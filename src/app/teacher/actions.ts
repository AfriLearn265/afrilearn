"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/components/app/ActionForm";

export async function createClassroom(fd: FormData): Promise<ActionResult> {
  const { userId } = await requireRole("teacher");
  const name = String(fd.get("name") ?? "").trim();
  const classId = String(fd.get("class_id") ?? "") || null;
  const subjectId = String(fd.get("subject_id") ?? "") || null;
  if (name.length < 3) return { error: "Give the classroom a name, for example “SS1 Mathematics, Term 1”." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("classrooms")
    .insert({ name, class_id: classId, subject_id: subjectId, teacher_id: userId, description: String(fd.get("description") ?? "").trim() || null })
    .select("join_code").single();
  if (error) return { error: "We couldn't create the classroom. " + error.message };
  revalidatePath("/teacher", "layout");
  return { message: `Classroom created. Share the class code ${data.join_code} with your students.` };
}
