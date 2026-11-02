"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/components/app/ActionForm";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export async function createCourse(fd: FormData): Promise<ActionResult> {
  const { userId } = await requireRole("teacher");
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 4) return { error: "Give the course a clear title." };
  const supabase = await createClient();
  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await supabase.from("courses").insert({
    title, slug, teacher_id: userId,
    summary: String(fd.get("summary") ?? "").trim() || null,
    subject_id: String(fd.get("subject_id") ?? "") || null,
    class_id: String(fd.get("class_id") ?? "") || null,
    classroom_id: String(fd.get("classroom_id") ?? "") || null,
    difficulty: String(fd.get("difficulty") ?? "standard"),
  }).select("id").single();
  if (error) return { error: error.message };
  redirect(`/teacher/courses/${data.id}`);
}

export async function updateCourse(fd: FormData): Promise<ActionResult> {
  await requireRole("teacher");
  const id = String(fd.get("course_id"));
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (fd.has("publish")) {
    if (fd.get("publish") === "1") {
      const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("course_id", id);
      if (!count) return { error: "Add at least one lesson before publishing." };
    }
    patch.is_published = fd.get("publish") === "1";
  } else {
    patch.title = String(fd.get("title") ?? "").trim();
    patch.summary = String(fd.get("summary") ?? "").trim() || null;
    patch.description = String(fd.get("description") ?? "").trim() || null;
    patch.estimated_hours = Number(fd.get("estimated_hours")) || null;
  }
  const { error } = await supabase.from("courses").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/teacher/courses/${id}`);
  return { message: fd.has("publish") ? (patch.is_published ? "Course published." : "Course moved back to draft.") : "Course details saved." };
}

export async function addTopic(fd: FormData): Promise<ActionResult> {
  await requireRole("teacher");
  const courseId = String(fd.get("course_id"));
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "Name the topic." };
  const supabase = await createClient();
  const { count } = await supabase.from("topics").select("id", { count: "exact", head: true }).eq("course_id", courseId);
  const { error } = await supabase.from("topics").insert({ course_id: courseId, title, sort_order: (count ?? 0) + 1 });
  if (error) return { error: error.message };
  revalidatePath(`/teacher/courses/${courseId}`);
  return { message: "Topic added." };
}

export async function saveLesson(fd: FormData): Promise<ActionResult> {
  await requireRole("teacher");
  const courseId = String(fd.get("course_id"));
  const lessonId = String(fd.get("lesson_id") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "Give the lesson a title." };
  const supabase = await createClient();
  const row = {
    course_id: courseId, title,
    topic_id: String(fd.get("topic_id") ?? "") || null,
    summary: String(fd.get("summary") ?? "").trim() || null,
    content: String(fd.get("content") ?? "").trim() || null,
    video_url: String(fd.get("video_url") ?? "").trim() || null,
    duration_minutes: Number(fd.get("duration_minutes")) || null,
  };
  if (lessonId) {
    const { error } = await supabase.from("lessons").update(row).eq("id", lessonId);
    if (error) return { error: error.message };
  } else {
    const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("course_id", courseId);
    const { error } = await supabase.from("lessons").insert({ ...row, sort_order: (count ?? 0) + 1 });
    if (error) return { error: error.message };
  }
  revalidatePath(`/teacher/courses/${courseId}`);
  return { message: lessonId ? "Lesson saved." : "Lesson added." };
}

export async function deleteLesson(fd: FormData) {
  await requireRole("teacher");
  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", String(fd.get("lesson_id")));
  revalidatePath(`/teacher/courses/${fd.get("course_id")}`);
}

export async function recordMaterial(input: {
  title: string; path: string; mime: string; size: number; courseId?: string | null; lessonId?: string | null;
  classroomId?: string | null; subjectId?: string | null; classId?: string | null; category?: string; audience?: string;
}): Promise<ActionResult> {
  const { userId } = await requireRole("teacher", "admin");
  if (!input.path.startsWith(`${userId}/`)) return { error: "That upload doesn't belong to you." };
  const type = input.mime.includes("pdf") ? "pdf" : input.mime.startsWith("video") ? "video" : input.mime.includes("presentation") || input.mime.includes("powerpoint") ? "slides"
    : input.mime.includes("word") ? "document" : input.mime.startsWith("image") ? "image" : "other";
  const supabase = await createClient();
  const { error } = await supabase.from("learning_materials").insert({
    title: input.title, storage_path: input.path, mime_type: input.mime, file_size_bytes: input.size, material_type: type,
    course_id: input.courseId ?? null, lesson_id: input.lessonId ?? null, classroom_id: input.classroomId ?? null,
    subject_id: input.subjectId ?? null, class_id: input.classId ?? null,
    library_category: input.category ?? "class_notes", audience: input.audience ?? "students", uploaded_by: userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/teacher", "layout");
  return { message: `${input.title} uploaded.` };
}
