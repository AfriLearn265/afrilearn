import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, pct } from "@/lib/format";
import { PageHeader, Panel, EmptyState, Stat } from "@/components/app/AppShell";
import { TopicMastery, type MasteryRow } from "@/components/app/TopicMastery";

export const metadata = { title: "Child progress" };

type Attempt = { id: string; status: string; percentage: number | null; submitted_at: string | null; examinations: { title: string; owner_student_id: string | null; exam_type: string } | null; results: { grade: string } | null };
type Sub = { status: string; score: number | null; feedback: string | null; submitted_at: string; is_late: boolean; assignments: { title: string; total_marks: number; due_at: string } | null };
type Room = { classrooms: { id: string; name: string; profiles: { full_name: string } | null } | null };
const clock = () => Date.now();

export default async function ChildPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("parent");
  const { id } = await params;
  const supabase = await createClient();
  const { data: child } = await supabase.from("students").select("profile_id, points, streak_days, profiles(full_name), classes(name)").eq("profile_id", id).maybeSingle();
  if (!child) notFound();
  const now = clock();
  const [{ data: attempts }, { data: subs }, { data: att }, { data: rooms }, { data: mastery }, { count: lessons }, { data: badges }, { data: due }, { data: certs }] = await Promise.all([
    supabase.from("exam_attempts").select("id, status, percentage, submitted_at, examinations(title, owner_student_id, exam_type), results(grade)").eq("student_id", id).neq("status", "in_progress").order("submitted_at", { ascending: false }).limit(12),
    supabase.from("assignment_submissions").select("status, score, feedback, submitted_at, is_late, assignments(title, total_marks, due_at)").eq("student_id", id).order("submitted_at", { ascending: false }).limit(10),
    supabase.from("attendance").select("status, attended_on").eq("student_id", id).order("attended_on", { ascending: false }).limit(60),
    supabase.from("enrollments").select("classrooms(id, name, profiles(full_name))").eq("student_id", id).eq("status", "active"),
    supabase.rpc("student_topic_mastery", { p_student: id }),
    supabase.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("student_id", id).eq("status", "completed"),
    supabase.from("student_badges").select("awarded_at, badges(name)").eq("student_id", id),
    supabase.from("assignments").select("id, title, due_at, assignment_submissions(student_id)").gte("due_at", new Date(now).toISOString()).order("due_at").limit(6),
    supabase.from("certificates").select("title, issued_at").eq("student_id", id),
  ]);
  const name = (child.profiles as unknown as { full_name: string } | null)?.full_name ?? "Your child";
  const attendance = att ?? [];
  const present = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const graded = ((attempts ?? []) as unknown as Attempt[]).filter((a) => a.status === "graded");
  const avg = graded.length ? graded.reduce((n, a) => n + Number(a.percentage), 0) / graded.length : null;
  const upcoming = ((due ?? []) as unknown as { id: string; title: string; due_at: string; assignment_submissions: { student_id: string }[] }[])
    .filter((a) => !a.assignment_submissions.some((s) => s.student_id === id));

  return (
    <>
      <PageHeader title={name} intro={`${(child.classes as unknown as { name: string } | null)?.name ?? "Class not set"}. Everything below is updated as ${name.split(" ")[0]} learns.`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Average test score" value={pct(avg)} note={`${graded.length} completed`} />
        <Stat label="Attendance" value={attendance.length ? `${Math.round((present / attendance.length) * 100)}%` : "–"} note={`${attendance.length} records`} />
        <Stat label="Lessons completed" value={lessons ?? 0} />
        <Stat label="Learning points" value={child.points} note={`${child.streak_days}-day streak`} />
        <Stat label="Badges" value={(badges ?? []).length} note={`${(certs ?? []).length} certificates`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title="Test and examination results">
            {graded.length === 0 && (attempts ?? []).length === 0 ? <EmptyState title="No results yet." /> : (
              <ul className="divide-y divide-line text-sm">
                {((attempts ?? []) as unknown as Attempt[]).map((a) => (
                  <li key={a.id}><Link href={`/parent/results/${a.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80">
                    <span><span className="block font-semibold">{a.examinations?.title}</span><span className="text-muted">{a.submitted_at ? formatDate(a.submitted_at) : ""}{a.examinations?.owner_student_id ? ", self-practice" : ""}</span></span>
                    <span className="font-display font-bold tabular">{a.status === "graded" ? `${pct(a.percentage)} ${a.results?.grade ?? ""}` : "Being marked"}</span>
                  </Link></li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Assignments and teacher feedback">
            {(subs ?? []).length === 0 && upcoming.length === 0 ? <EmptyState title="No assignments yet." /> : (
              <ul className="grid gap-3 text-sm">
                {upcoming.map((u) => <li key={u.id} className="rounded-xl bg-sun-100 p-3"><strong>{u.title}</strong> is due {formatDateTime(u.due_at)} and hasn&apos;t been handed in.</li>)}
                {((subs ?? []) as unknown as Sub[]).map((s, i) => (
                  <li key={i} className="rounded-xl border border-line p-3">
                    <div className="flex justify-between gap-3"><strong>{s.assignments?.title}</strong><span className="tabular">{s.status === "graded" ? `${Number(s.score)}/${Number(s.assignments?.total_marks)}` : "Awaiting grade"}</span></div>
                    <p className="text-muted">Handed in {formatDateTime(s.submitted_at)}{s.is_late ? ", late" : ""}</p>
                    {s.feedback && <p className="mt-1.5 rounded-lg bg-paper p-2.5">&ldquo;{s.feedback}&rdquo;</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="grid content-start gap-6">
          <Panel title="Topics mastered and to revise"><TopicMastery rows={(mastery ?? []) as MasteryRow[]} limit={8} /></Panel>
          <Panel title="Classrooms and teachers">
            {((rooms ?? []) as unknown as Room[]).length === 0 ? <p className="text-sm text-muted">Not in any classroom yet.</p> : (
              <ul className="grid gap-2 text-sm">
                {((rooms ?? []) as unknown as Room[]).map((r) => r.classrooms && (
                  <li key={r.classrooms.id} className="flex items-center justify-between gap-3"><span><strong>{r.classrooms.name}</strong><span className="text-muted">, {r.classrooms.profiles?.full_name}</span></span><Link href="/parent/messages" className="font-semibold text-adire-700 hover:underline">Message</Link></li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Recent attendance">
            {attendance.length === 0 ? <p className="text-sm text-muted">No attendance recorded yet.</p> : (
              <ul className="flex flex-wrap gap-1.5" aria-label="Attendance, most recent first">
                {attendance.slice(0, 30).map((a, i) => (
                  <li key={i} title={`${formatDate(a.attended_on)}: ${a.status}`} className={`grid size-8 place-items-center rounded-lg text-[0.65rem] font-bold uppercase ${a.status === "present" ? "bg-leaf-100 text-leaf-700" : a.status === "late" ? "bg-sun-100" : a.status === "excused" ? "bg-wash text-muted" : "bg-coral-100 text-coral-700"}`}>
                    <span className="sr-only">{formatDate(a.attended_on)} {a.status}</span><span aria-hidden="true">{a.status[0]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
