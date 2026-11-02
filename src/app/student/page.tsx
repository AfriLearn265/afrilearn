import Link from "next/link";
import { CheckCircle2, CircleDot, Flame, Medal, Star, Users, ArrowUpRight } from "lucide-react";
import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStudentCourses } from "@/lib/learning";
import { formatDateTime, greeting } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { CopyButton } from "@/components/app/CopyButton";
import { TopicMastery, type MasteryRow } from "@/components/app/TopicMastery";
import { Field, Input, Notice } from "@/components/ui/Field";
import { joinClassroom, regenerateLinkCode } from "./actions";

export const metadata = { title: "Student dashboard" };

type Enrollment = { classrooms: { id: string; name: string; subjects: { name: string; color: string } | null; profiles: { full_name: string } | null } | null };
type Due = { id: string; title: string; due_at: string; classrooms: { name: string } | null; assignment_submissions: { status: string }[] };
type Live = { id: string; title: string; starts_at: string; duration_minutes: number; classrooms: { name: string } | null };

const clock = () => Date.now();

export default async function StudentHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { profile, userId } = await requireRole("student");
  const sp = await searchParams;
  const supabase = await createClient();
  const now = clock();
  const [{ data: me }, { data: enrollments }, { count: badgeCount }, learning, { data: mastery }, { data: due }, { data: live }, { data: challenge }] = await Promise.all([
    supabase.from("students").select("points, streak_days, link_code, classes(name, education_levels(name))").eq("profile_id", userId).single(),
    supabase.from("enrollments").select("classrooms(id, name, subjects(name, color), profiles(full_name))").eq("student_id", userId).eq("status", "active"),
    supabase.from("student_badges").select("badge_id", { count: "exact", head: true }).eq("student_id", userId),
    getStudentCourses(userId),
    supabase.rpc("student_topic_mastery", { p_student: userId }),
    supabase.from("assignments").select("id, title, due_at, classrooms(name), assignment_submissions(status)").gte("due_at", new Date(now - 86400000 * 3).toISOString()).order("due_at").limit(6),
    supabase.from("live_classes").select("id, title, starts_at, duration_minutes, classrooms(name)").neq("status", "cancelled").gte("starts_at", new Date(now - 3600000 * 2).toISOString()).order("starts_at").limit(3),
    supabase.from("weekly_challenges").select("title, description, target, points, metric, starts_on, ends_on").eq("is_active", true).order("starts_on", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const klass = me?.classes as unknown as { name: string; education_levels: { name: string } | null } | null;
  const rooms = ((enrollments ?? []) as unknown as Enrollment[]).map((e) => e.classrooms).filter((r): r is NonNullable<Enrollment["classrooms"]> => !!r);
  const { courses, status } = learning;

  const totalLessons = courses.filter((c) => c.started > 0 || c.class_id || c.classroom_id).reduce((n, c) => n + c.lessons.length, 0);
  const completed = [...status.values()].filter((s) => s === "completed").length;
  const inProgress = courses.flatMap((c) => c.lessons.filter((l) => status.get(l.id) === "in_progress").map((l) => ({ ...l, course: c })));
  const upNext = courses.filter((c) => c.nextLesson && !status.has(c.nextLesson.id)).slice(0, 4).map((c) => ({ ...c.nextLesson!, course: c }));
  const overall = totalLessons ? Math.round((completed / totalLessons) * 100) : 0;
  const masteryRows = (mastery ?? []) as MasteryRow[];
  const mastered = masteryRows.filter((m) => Number(m.percent) >= 70).length;
  const revise = masteryRows.filter((m) => Number(m.percent) < 70).length;
  const pending = ((due ?? []) as unknown as Due[]).filter((a) => !a.assignment_submissions?.length);
  const weekStart = challenge ? new Date(challenge.starts_on).getTime() : 0;
  const lessonsThisWeek = challenge ? (await supabase.from("lesson_progress").select("lesson_id", { count: "exact", head: true })
    .eq("student_id", userId).eq("status", "completed").gte("completed_at", new Date(weekStart).toISOString())).count ?? 0 : 0;

  return (
    <>
      <PageHeader title={`${greeting()}, ${firstName(profile.full_name)}.`}
        intro={klass ? `${klass.name}${klass.education_levels ? `, ${klass.education_levels.name}` : ""}. Here is where your learning stands today.` : "Choose your class on your profile page to see the right lessons."} />

      {sp.welcome && <div className="mb-6"><Notice tone="success" title="Your account is ready.">Join your teacher&apos;s classroom with their class code, or start a course for your class below.</Notice></div>}
      {sp.notice && <div className="mb-6"><Notice tone="warning">{sp.notice}</Notice></div>}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{ icon: Star, label: "Learning points", value: me?.points ?? 0 }, { icon: Flame, label: "Day streak", value: me?.streak_days ?? 0 },
          { icon: Users, label: "Classrooms", value: rooms.length }, { icon: Medal, label: "Badges", value: badgeCount ?? 0 }].map(({ icon: Icon, label, value }) => (
          <li key={label} className="rounded-[1.25rem] border border-line bg-white p-5">
            <Icon className="size-5 text-adire-700" aria-hidden="true" />
            <p className="mt-3 font-display text-3xl font-bold tabular">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="journey" className="mt-6 rounded-[1.5rem] bg-adire-800 p-6 text-white md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="journey" className="text-2xl font-bold md:text-3xl">My learning journey</h2>
            <p className="mt-1 text-adire-100">{completed} lessons completed, {inProgress.length} in progress, {mastered} topics mastered, {revise} to revise.</p>
          </div>
          <p className="font-display text-5xl font-bold tabular">{overall}%</p>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Overall progress" aria-valuenow={overall} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-sun-400" style={{ width: `${Math.max(overall, 2)}%` }} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/8 p-4">
            <p className="text-sm font-semibold text-adire-100">In progress</p>
            {inProgress.length === 0 ? <p className="mt-2 text-sm text-adire-200">Nothing half-finished. Pick something from Up next.</p> : (
              <ul className="mt-2 grid gap-2">{inProgress.slice(0, 4).map((l) => (
                <li key={l.id}><Link href={`/student/lessons/${l.id}`} className="flex items-center gap-2 hover:underline"><CircleDot className="size-4 shrink-0 text-sun-400" aria-hidden="true" /><span className="truncate">{l.title}</span><span className="shrink-0 text-sm text-adire-200">{l.course.subject?.name}</span></Link></li>
              ))}</ul>
            )}
          </div>
          <div className="rounded-2xl bg-white/8 p-4">
            <p className="text-sm font-semibold text-adire-100">Up next</p>
            {upNext.length === 0 ? <p className="mt-2 text-sm text-adire-200">No new lessons waiting. <Link href="/student/courses" className="font-semibold text-white underline">Browse courses</Link></p> : (
              <ul className="mt-2 grid gap-2">{upNext.map((l) => (
                <li key={l.id}><Link href={`/student/lessons/${l.id}`} className="flex items-center gap-2 hover:underline"><ArrowUpRight className="size-4 shrink-0 text-sun-400" aria-hidden="true" /><span className="truncate">{l.title}</span><span className="shrink-0 text-sm text-adire-200">{l.course.subject?.name}</span></Link></li>
              ))}</ul>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title="Due soon" action={<Link href="/student/assignments" className="text-sm font-semibold text-adire-700">All assignments</Link>}>
            {pending.length === 0 ? <p className="text-sm text-muted">No assignments waiting for you.</p> : (
              <ul className="divide-y divide-line">{pending.map((a) => {
                const overdue = new Date(a.due_at).getTime() < now;
                return (
                  <li key={a.id}><Link href={`/student/assignments/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                    <span><span className="block font-semibold">{a.title}</span><span className="text-sm text-muted">{a.classrooms?.name}</span></span>
                    <span className={`shrink-0 text-sm font-semibold ${overdue ? "text-coral-700" : "text-ink-soft"}`}>{overdue ? "Overdue" : `Due ${formatDateTime(a.due_at)}`}</span>
                  </Link></li>
                );
              })}</ul>
            )}
          </Panel>
          <Panel title="Topics mastered and to revise" action={<Link href="/student/results" className="text-sm font-semibold text-adire-700">Results</Link>}>
            <TopicMastery rows={masteryRows} limit={6} />
          </Panel>
          <Panel title="My classrooms">
            {rooms.length === 0 ? (
              <EmptyState title="You haven't joined a classroom yet.">Ask your teacher for their six-character class code and enter it under Join a classroom.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {rooms.map((r) => (
                  <li key={r.id}><Link href={`/student/classes/${r.id}`} className="flex items-center gap-4 py-3.5 hover:opacity-80">
                    <span className="size-3 shrink-0 rounded-full" style={{ background: r.subjects?.color ?? "#2B3A9F" }} aria-hidden="true" />
                    <span className="min-w-0"><span className="block truncate font-semibold">{r.name}</span><span className="text-sm text-muted">{[r.subjects?.name, r.profiles?.full_name && `with ${r.profiles.full_name}`].filter(Boolean).join(", ")}</span></span>
                  </Link></li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          {(live ?? []).length > 0 && (
            <Panel title="Live classes" action={<Link href="/student/live" className="text-sm font-semibold text-adire-700">Join</Link>}>
              <ul className="grid gap-3 text-sm">{((live ?? []) as unknown as Live[]).map((l) => (
                <li key={l.id}><p className="font-semibold">{l.title}</p><p className="text-muted">{l.classrooms?.name}, {formatDateTime(l.starts_at)}</p></li>
              ))}</ul>
            </Panel>
          )}
          {challenge && (
            <Panel title="Weekly challenge">
              <p className="font-semibold">{challenge.title}</p>
              <p className="text-sm text-muted">{challenge.description} Worth {challenge.points} points.</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-wash"><span className="block h-full rounded-full bg-sun-400" style={{ width: `${Math.min(100, (lessonsThisWeek / challenge.target) * 100)}%` }} /></span>
                <span className="text-sm font-semibold tabular">{Math.min(lessonsThisWeek, challenge.target)}/{challenge.target}</span>
              </div>
              {lessonsThisWeek >= challenge.target && <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700"><CheckCircle2 className="size-4" />Challenge complete</p>}
            </Panel>
          )}
          <Panel title="Join a classroom">
            <ActionForm action={joinClassroom} submitLabel="Join classroom" pendingLabel="Joining">
              <Field label="Class code" htmlFor="code"><Input id="code" name="code" maxLength={12} autoComplete="off" className="uppercase tracking-[0.25em]" placeholder="K7M2QX" /></Field>
            </ActionForm>
          </Panel>
          <Panel title="Link a parent or guardian">
            <p className="text-sm text-muted">Give this code to your parent or guardian. They enter it on their dashboard to follow your progress.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="rounded-xl bg-wash px-4 py-2 font-display text-2xl font-bold tracking-[0.2em] text-adire-800">{me?.link_code}</p>
              {me?.link_code && <CopyButton value={me.link_code} />}
            </div>
            <ActionForm action={regenerateLinkCode} submitLabel="Make a new code" pendingLabel="Making a new code" variant="outline" className="mt-4" resetOnSuccess={false}>
              <p className="text-xs text-muted">A new code stops the old one from working. Parents already linked stay linked.</p>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
