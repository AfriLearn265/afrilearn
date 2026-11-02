"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/components/app/ActionForm";

const toIso = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return s ? new Date(`${s}:00+01:00`).toISOString() : null; // inputs are Lagos local time
};

export async function createExam(fd: FormData): Promise<ActionResult> {
  const { userId } = await requireRole("teacher");
  const title = String(fd.get("title") ?? "").trim();
  const classroom = String(fd.get("classroom_id") ?? "");
  if (title.length < 3) return { error: "Give the test a title." };
  if (!classroom) return { error: "Choose the classroom that will take this test." };
  const supabase = await createClient();
  const { data: room } = await supabase.from("classrooms").select("subject_id, class_id").eq("id", classroom).single();
  const { data, error } = await supabase.from("examinations").insert({
    title, classroom_id: classroom, created_by: userId,
    subject_id: room?.subject_id ?? null, class_id: room?.class_id ?? null,
    exam_type: String(fd.get("exam_type") ?? "test"),
    duration_minutes: Math.min(600, Math.max(1, Number(fd.get("duration_minutes") ?? 30))),
    max_attempts: Number(fd.get("max_attempts")) || null,
    pass_mark: Number(fd.get("pass_mark") ?? 50),
    instructions: String(fd.get("instructions") ?? "").trim() || null,
    randomize_questions: fd.get("randomize_questions") === "on",
    randomize_options: fd.get("randomize_options") === "on",
    show_results_immediately: fd.get("show_results_immediately") === "on",
    show_explanations: fd.get("show_explanations") === "on",
    available_from: toIso(fd.get("available_from")),
    available_until: toIso(fd.get("available_until")),
    is_published: false,
  }).select("id").single();
  if (error) return { error: error.message };
  redirect(`/teacher/exams/${data.id}`);
}

export async function addQuestions(fd: FormData): Promise<ActionResult> {
  await requireRole("teacher");
  const examId = String(fd.get("exam_id"));
  const ids = fd.getAll("question_id").map(String);
  if (ids.length === 0) return { error: "Tick the questions you want to add." };
  const supabase = await createClient();
  const { count } = await supabase.from("exam_questions").select("question_id", { count: "exact", head: true }).eq("exam_id", examId);
  const { error } = await supabase.from("exam_questions").upsert(
    ids.map((id, i) => ({ exam_id: examId, question_id: id, sort_order: (count ?? 0) + i + 1 })),
    { onConflict: "exam_id,question_id", ignoreDuplicates: true });
  if (error) return { error: error.message };
  revalidatePath(`/teacher/exams/${examId}`);
  return { message: `${ids.length} question${ids.length === 1 ? "" : "s"} added.` };
}

export async function removeQuestion(fd: FormData) {
  await requireRole("teacher");
  const supabase = await createClient();
  await supabase.from("exam_questions").delete().eq("exam_id", String(fd.get("exam_id"))).eq("question_id", String(fd.get("question_id")));
  revalidatePath(`/teacher/exams/${fd.get("exam_id")}`);
}

export async function setPublished(fd: FormData): Promise<ActionResult> {
  await requireRole("teacher");
  const examId = String(fd.get("exam_id"));
  const publish = fd.get("publish") === "1";
  const supabase = await createClient();
  if (publish) {
    const { count } = await supabase.from("exam_questions").select("question_id", { count: "exact", head: true }).eq("exam_id", examId);
    if (!count) return { error: "Add at least one question before publishing." };
  }
  const { error } = await supabase.from("examinations").update({ is_published: publish }).eq("id", examId);
  if (error) return { error: error.message };
  revalidatePath(`/teacher/exams/${examId}`);
  return { message: publish ? "Published. Students in the classroom can now take it." : "Unpublished. Students can no longer start it." };
}
