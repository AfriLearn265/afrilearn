import "server-only";
import { createClient } from "@/lib/supabase/server";
import { CORE_SUBJECTS } from "@/config/subjects";

export type TopicRow = {
  id: string; code: string; class_id: string; subject_id: string; term: number; theme: string | null; sub_theme: string | null;
  title: string; summary: string | null; sort_order: number;
};
export type SubjectRow = { id: string; code: string; name: string; color: string };

export const TOPIC_FIELDS = "id, code, class_id, subject_id, term, theme, sub_theme, title, summary, sort_order";

/** The core subjects with each one's topics for a class, and which of them the pupil has finished. */
export async function subjectsForClass(classId: string, studentId?: string) {
  const supabase = await createClient();
  const [{ data: subjects }, { data: topics }] = await Promise.all([
    supabase.from("subjects").select("id, code, name, color").in("code", [...CORE_SUBJECTS]),
    supabase.from("curriculum_topics").select(TOPIC_FIELDS).eq("class_id", classId).eq("is_published", true).order("sort_order"),
  ]);
  const all = (topics ?? []) as TopicRow[];
  const done = studentId ? await doneTopics(studentId, all.map((t) => t.id)) : new Set<string>();
  const order = (code: string) => CORE_SUBJECTS.indexOf(code as (typeof CORE_SUBJECTS)[number]);
  return ((subjects ?? []) as SubjectRow[])
    .sort((a, b) => order(a.code) - order(b.code))
    .map((s) => {
      const list = all.filter((t) => t.subject_id === s.id);
      return { ...s, topics: list, done: list.filter((t) => done.has(t.id)).length };
    });
}

export async function doneTopics(studentId: string, topicIds: string[]) {
  if (!topicIds.length) return new Set<string>();
  const supabase = await createClient();
  const { data } = await supabase.from("topic_progress").select("topic_id, completed_at").eq("student_id", studentId).in("topic_id", topicIds);
  return new Set((data ?? []).filter((r) => r.completed_at).map((r) => r.topic_id as string));
}

/** Topic ids that have at least one published video. */
export async function topicsWithVideos(topicIds: string[]) {
  if (!topicIds.length) return new Set<string>();
  const supabase = await createClient();
  const { data } = await supabase.from("class_videos").select("topic_id").in("topic_id", topicIds).eq("is_published", true);
  return new Set((data ?? []).map((r) => r.topic_id as string));
}
