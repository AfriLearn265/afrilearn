"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/components/app/ActionForm";

export async function reviewTeacher(fd: FormData): Promise<ActionResult> {
  await requireRole("admin");
  const teacherId = String(fd.get("teacher_id") ?? "");
  const approve = fd.get("decision") === "approve";
  const note = String(fd.get("note") ?? "").trim() || null;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_review_teacher", { p_teacher: teacherId, p_approve: approve, p_note: note });
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return { message: approve ? "Teacher approved. They can now create classrooms." : "Application declined and the teacher has been told." };
}

export async function documentLink(path: string): Promise<string | null> {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase.storage.from("teacher-documents").createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}
