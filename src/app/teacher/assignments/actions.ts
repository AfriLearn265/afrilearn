"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/components/app/ActionForm";

export async function createAssignment(fd: FormData): Promise<ActionResult> {
  const { userId } = await requireRole("teacher");
  const title = String(fd.get("title") ?? "").trim();
  const classroom = String(fd.get("classroom_id") ?? "");
  const due = String(fd.get("due_at") ?? "");
  if (!title) return { error: "Give the assignment a title." };
  if (!classroom) return { error: "Choose a classroom." };
  if (!due) return { error: "Set a deadline." };
  const types = fd.getAll("accepted_file_types").map(String);
  const supabase = await createClient();
  const { data, error } = await supabase.from("assignments").insert({
    title, classroom_id: classroom, teacher_id: userId,
    description: String(fd.get("description") ?? "").trim() || null,
    instructions: String(fd.get("instructions") ?? "").trim() || null,
    total_marks: Number(fd.get("total_marks") ?? 100) || 100,
    due_at: new Date(`${due}:00+01:00`).toISOString(),
    allow_late: fd.get("allow_late") === "on",
    accepted_file_types: types.length ? types : ["pdf", "docx", "jpg", "jpeg", "png"],
    max_file_mb: Math.min(50, Math.max(1, Number(fd.get("max_file_mb") ?? 10))),
  }).select("id").single();
  if (error) return { error: error.message };
  redirect(`/teacher/assignments/${data.id}`);
}

export async function attachToAssignment(assignmentId: string, path: string): Promise<ActionResult> {
  const { userId } = await requireRole("teacher");
  if (!path.startsWith(`${userId}/`)) return { error: "That upload doesn't belong to you." };
  const supabase = await createClient();
  const { data: a } = await supabase.from("assignments").select("attachment_paths").eq("id", assignmentId).single();
  const { error } = await supabase.from("assignments").update({ attachment_paths: [...((a?.attachment_paths as string[]) ?? []), path] }).eq("id", assignmentId);
  if (error) return { error: error.message };
  revalidatePath(`/teacher/assignments/${assignmentId}`);
  return { message: "Attached." };
}

export async function gradeSubmission(fd: FormData): Promise<ActionResult> {
  await requireRole("teacher");
  const supabase = await createClient();
  const { error } = await supabase.rpc("grade_submission", {
    p_submission: String(fd.get("submission_id")), p_score: Number(fd.get("score")), p_feedback: String(fd.get("feedback") ?? "") || null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/teacher/assignments/${fd.get("assignment_id")}`);
  return { message: "Grade saved. The student and their parents have been notified." };
}
