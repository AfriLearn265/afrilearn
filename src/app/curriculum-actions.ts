"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/components/app/ActionForm";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function refresh() {
  revalidatePath("/admin/curriculum");
  revalidatePath("/teacher/curriculum");
  revalidatePath("/student", "layout");
}

export async function addTopic(fd: FormData): Promise<ActionResult> {
  await requireRole("admin");
  const title = s(fd, "title");
  const term = Number(s(fd, "term"));
  if (title.length < 2) return { error: "Type the topic title." };
  if (![1, 2, 3].includes(term)) return { error: "Choose a term." };
  const supabase = await createClient();
  const classId = s(fd, "class_id");
  const subjectId = s(fd, "subject_id");
  const { data: last } = await supabase.from("curriculum_topics").select("sort_order").eq("class_id", classId).eq("subject_id", subjectId)
    .order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("curriculum_topics").insert({
    class_id: classId, subject_id: subjectId, term, title, theme: s(fd, "theme") || null, sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) return { error: error.message };
  refresh();
  return { message: `Added "${title}".` };
}

export async function updateTopic(fd: FormData): Promise<ActionResult> {
  await requireRole("teacher", "admin");
  const title = s(fd, "title");
  const term = Number(s(fd, "term"));
  if (title.length < 2) return { error: "The title can't be empty." };
  if (![1, 2, 3].includes(term)) return { error: "Choose a term." };
  const supabase = await createClient();
  const { error } = await supabase.from("curriculum_topics").update({
    title, term, theme: s(fd, "theme") || null, summary: s(fd, "summary") || null, notes: s(fd, "notes") || null,
    is_published: fd.get("is_published") === "on",
  }).eq("id", s(fd, "id"));
  if (error) return { error: error.message };
  refresh();
  return { message: "Saved." };
}

export async function deleteTopic(fd: FormData): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("curriculum_topics").delete().eq("id", s(fd, "id"));
  if (error) return { error: error.message };
  refresh();
  return { message: "Topic removed." };
}

export async function addQuestion(fd: FormData): Promise<ActionResult> {
  await requireRole("teacher", "admin");
  const prompt = s(fd, "prompt");
  const options = [0, 1, 2, 3].map((i) => s(fd, `option${i}`)).filter(Boolean);
  const answer = Number(s(fd, "answer"));
  if (prompt.length < 2) return { error: "Type the question." };
  if (options.length < 2) return { error: "Give at least two answer choices." };
  if (!(answer >= 0 && answer < options.length)) return { error: "Choose which answer is correct." };
  const supabase = await createClient();
  const topicId = s(fd, "topic_id");
  const { count } = await supabase.from("topic_questions").select("id", { count: "exact", head: true }).eq("topic_id", topicId);
  const { error } = await supabase.from("topic_questions").insert({
    topic_id: topicId, prompt, options, answer, explanation: s(fd, "explanation") || null, sort_order: (count ?? 0) + 1,
  });
  if (error) return { error: error.message };
  refresh();
  return { message: "Question added." };
}

export async function deleteQuestion(fd: FormData): Promise<ActionResult> {
  await requireRole("teacher", "admin");
  const supabase = await createClient();
  const { error } = await supabase.from("topic_questions").delete().eq("id", s(fd, "id"));
  if (error) return { error: error.message };
  refresh();
  return { message: "Question removed." };
}
