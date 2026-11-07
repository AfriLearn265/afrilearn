import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { subjectsForClass } from "@/lib/curriculum";
import { currentTerm } from "@/config/subjects";
import { PupilHome } from "@/components/app/PupilHome";

export const metadata = { title: "My subjects" };

/**
 * The pupil home: a sliding banner, then just the subjects. Tap a subject to see this term's topics,
 * tap a topic to watch, read and play the quiz. Everything else lives in the bottom menu.
 */
export default async function StudentHome() {
  const { profile, userId } = await requireRole("student");
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("points, streak_days, class_id, classes(name)").eq("profile_id", userId).single();
  const klass = me?.classes as unknown as { name: string } | null;
  const term = currentTerm();
  const subjects = me?.class_id ? await subjectsForClass(me.class_id, userId) : [];
  const termTopics = subjects.flatMap((s) => s.topics.filter((t) => t.term === term).map((t) => ({ ...t, subject: s })));
  const { data: doneRows } = termTopics.length
    ? await supabase.from("topic_progress").select("topic_id").eq("student_id", userId).not("completed_at", "is", null).in("topic_id", termTopics.map((t) => t.id))
    : { data: [] };
  const done = new Set((doneRows ?? []).map((r) => r.topic_id as string));
  const next = termTopics.find((t) => !done.has(t.id) && t.subject.code === "mathematics") ?? termTopics.find((t) => !done.has(t.id));

  return <PupilHome name={firstName(profile.full_name)} points={me?.points ?? 0} streak={me?.streak_days ?? 0} className={klass?.name ?? null}
    term={term} subjects={subjects} next={next ? { code: next.code, title: next.title, subjectCode: next.subject.code } : null} />;
}
