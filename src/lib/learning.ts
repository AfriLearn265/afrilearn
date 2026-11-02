import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CourseLesson = { id: string; title: string; sort_order: number; duration_minutes: number | null; topic_id: string | null };
export type CourseWithProgress = {
  id: string; title: string; slug: string; summary: string | null; difficulty: string; class_id: string | null; classroom_id: string | null;
  subject: { name: string; color: string } | null; klass: { name: string } | null; teacher: string | null;
  lessons: CourseLesson[]; completed: number; started: number; progress: number; nextLesson: CourseLesson | null;
};

/** Every course a student can see, with their own progress through it. */
export async function getStudentCourses(userId: string) {
  const supabase = await createClient();
  const [{ data: me }, { data: courses }, { data: progress }] = await Promise.all([
    supabase.from("students").select("class_id").eq("profile_id", userId).single(),
    supabase.from("courses")
      .select("id, title, slug, summary, difficulty, class_id, classroom_id, subjects(name, color), classes(name), profiles(full_name), lessons(id, title, sort_order, duration_minutes, topic_id, is_published)")
      .eq("is_published", true).order("created_at", { ascending: false }),
    supabase.from("lesson_progress").select("lesson_id, status, updated_at").eq("student_id", userId),
  ]);
  const status = new Map((progress ?? []).map((p) => [p.lesson_id, p.status as string]));
  const list: CourseWithProgress[] = ((courses ?? []) as unknown as Array<{
    id: string; title: string; slug: string; summary: string | null; difficulty: string; class_id: string | null; classroom_id: string | null;
    subjects: { name: string; color: string } | null; classes: { name: string } | null; profiles: { full_name: string } | null;
    lessons: (CourseLesson & { is_published: boolean })[];
  }>).map((c) => {
    const lessons = c.lessons.filter((l) => l.is_published).sort((a, b) => a.sort_order - b.sort_order);
    const completed = lessons.filter((l) => status.get(l.id) === "completed").length;
    const started = lessons.filter((l) => status.has(l.id)).length;
    return {
      id: c.id, title: c.title, slug: c.slug, summary: c.summary, difficulty: c.difficulty, class_id: c.class_id, classroom_id: c.classroom_id,
      subject: c.subjects, klass: c.classes, teacher: c.profiles?.full_name ?? null, lessons, completed, started,
      progress: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
      nextLesson: lessons.find((l) => status.get(l.id) !== "completed") ?? null,
    };
  });
  return { classId: me?.class_id as string | null, courses: list, status };
}
