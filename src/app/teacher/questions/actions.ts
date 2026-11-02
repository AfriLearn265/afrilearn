"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/components/app/ActionForm";

export async function createBank(fd: FormData): Promise<ActionResult> {
  const { userId } = await requireRole("teacher", "admin");
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 3) return { error: "Name the question bank, for example “JSS2 Fractions”." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("question_banks").insert({
    name, owner_id: userId,
    subject_id: String(fd.get("subject_id") ?? "") || null,
    class_id: String(fd.get("class_id") ?? "") || null,
    exam_body: String(fd.get("exam_body") ?? "") || null,
    is_shared: fd.get("is_shared") === "on",
    source_license: String(fd.get("source_license") ?? "").trim() || "Original content",
  }).select("id").single();
  if (error) return { error: error.message };
  redirect(`/teacher/questions?bank=${data.id}`);
}

export async function deleteQuestion(fd: FormData): Promise<ActionResult> {
  await requireRole("teacher", "admin");
  const supabase = await createClient();
  const { error } = await supabase.from("questions").delete().eq("id", String(fd.get("id")));
  if (error) return { error: "This question is used in an examination attempt, so it can't be deleted." };
  revalidatePath("/teacher/questions");
  return { message: "Question deleted." };
}
