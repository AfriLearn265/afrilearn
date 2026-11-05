import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, greeting, timeAgo } from "@/lib/format";
import { formatNaira } from "@/lib/catalogue";
import { PageHeader, Panel, Stat } from "@/components/app/AppShell";
import { DailyBars } from "@/components/app/charts";
import { TeacherReview, type Application } from "./TeacherReview";
import { AlertTriangle, Eye } from "lucide-react";
import { classNumber, lookFor } from "@/config/classLook";
import { Mascot } from "@/components/brand/Mascot";

export const metadata = { title: "Administration" };

type Overview = {
  students: number; teachers_active: number; teachers_pending: number; parents: number; classrooms: number;
  courses: number; courses_published: number; examinations: number; exam_attempts: number; assignments: number;
  submissions: number; expected_submissions: number; active_learners_7d: number; revenue_kobo: number;
  active_subscriptions: number; open_reports: number; signups_14d: { day: string; count: number }[];
};

type TeacherRow = {
  profile_id: string; qualification: string | null; years_experience: number | null; institution: string | null; bio: string | null;
  document_paths: string[]; created_at: string; profiles: { full_name: string } | null;
  teacher_subjects: { subjects: { name: string } | null }[]; teacher_classes: { classes: { name: string; sort_order: number } | null }[];
};

type ClassRow = { code: string; name: string; level_name: string | null; sort_order: number; students: number; active_7d: number; teachers: number; classrooms: number; courses: number };
type Activity = { id: number; action: string; created_at: string; metadata: Record<string, unknown>; actor: { full_name: string; role: string } | null };
type LiveNow = { id: string; title: string; classrooms: { name: string } | null; profiles: { full_name: string } | null };

const clock = () => Date.now();

const actionLabel: Record<string, string> = {
  "account.created": "created an account", "classroom.joined": "joined a classroom", "exam.started": "started a test",
  "exam.submitted": "submitted a test", "exam.answer_graded": "marked a theory answer", "assignment.submitted": "handed in an assignment",
  "assignment.graded": "graded an assignment", "parent.linked_child": "linked a child", "teacher.approved": "approved a teacher",
  "teacher.rejected": "declined a teacher application", "notification.broadcast": "sent an announcement",
  "user.role_changed": "changed a user's role", "user.status_changed": "changed a user's status",
};

export default async function AdminHome() {
  const { profile } = await requireRole("admin");
  const supabase = await createClient();
  const [{ data: overview }, { data: pending }, { data: users }, { data: breakdown }, { data: activity }, { data: live }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.from("teachers")
      .select("profile_id, qualification, years_experience, institution, bio, document_paths, created_at, profiles(full_name), teacher_subjects(subjects(name)), teacher_classes(classes(name, sort_order))")
      .eq("application_status", "pending").order("created_at"),
    supabase.rpc("admin_list_users", { p_role: "teacher", p_limit: 200 }),
    supabase.rpc("admin_class_breakdown"),
    supabase.from("activity_logs").select("id, action, created_at, metadata, actor:profiles(full_name, role)").order("created_at", { ascending: false }).limit(12),
    supabase.from("live_classes").select("id, title, classrooms(name), profiles(full_name)").eq("status", "live").limit(5),
  ]);
  const [{ data: vids }, { data: watches }] = await Promise.all([
    supabase.from("class_videos").select("id, title, view_count, class_id, created_at, classes(code, name)").eq("is_published", true).order("view_count", { ascending: false }).limit(400),
    supabase.from("video_views").select("video_id, student_id, last_viewed_at").limit(5000),
  ]);
  type VidRow = { id: string; title: string; view_count: number; class_id: string; created_at: string; classes: { code: string; name: string } | null };
  const videoRows = (vids ?? []) as unknown as VidRow[];
  const videosByClass = new Map<string, { videos: number; watches: number }>();
  const classOfVideo = new Map(videoRows.map((v) => [v.id, v.classes?.code ?? ""]));
  videoRows.forEach((v) => { const k = v.classes?.code ?? ""; const e = videosByClass.get(k) ?? { videos: 0, watches: 0 }; e.videos += 1; videosByClass.set(k, e); });
  (watches ?? []).forEach((w) => { const k = classOfVideo.get(w.video_id as string); if (!k) return; const e = videosByClass.get(k) ?? { videos: 0, watches: 0 }; e.watches += 1; videosByClass.set(k, e); });
  const weekAgo = clock() - 7 * 86400000;
  const watchedThisWeek = (watches ?? []).filter((w) => new Date(String(w.last_viewed_at)).getTime() > weekAgo).length;
  const totalViews = videoRows.reduce((n, v) => n + v.view_count, 0);
  const classes = ((breakdown ?? []) as ClassRow[]);
  const totals = classes.reduce((t, c) => ({ students: t.students + Number(c.students), active: t.active + Number(c.active_7d), classrooms: t.classrooms + Number(c.classrooms) }), { students: 0, active: 0, classrooms: 0 });
    const o = (overview ?? {}) as Overview;
  const emails = new Map(((users ?? []) as { id: string; email: string }[]).map((u) => [u.id, u.email]));
  const apps: Application[] = ((pending ?? []) as unknown as TeacherRow[]).map((t) => ({
    id: t.profile_id, name: t.profiles?.full_name ?? "Unnamed", email: emails.get(t.profile_id) ?? null,
    qualification: t.qualification, years: t.years_experience, institution: t.institution, bio: t.bio,
    subjects: t.teacher_subjects.map((s) => s.subjects?.name).filter((s): s is string => !!s),
    classes: t.teacher_classes.map((c) => c.classes).filter((c): c is { name: string; sort_order: number } => !!c)
      .sort((a, b) => a.sort_order - b.sort_order).map((c) => c.name),
    documents: t.document_paths ?? [], applied: formatDate(t.created_at),
  }));
  const submissionRate = o.expected_submissions ? Math.round((o.submissions / o.expected_submissions) * 100) : null;

  return (
    <>
      <section className="relative isolate mb-6 overflow-hidden rounded-[2rem] bg-grape-700 p-6 text-white sm:p-8">
        <div aria-hidden="true" className="sky-dots absolute inset-0 -z-10" />
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <h1 className="text-[2.1rem] font-semibold leading-[1.05] sm:text-5xl">{greeting()}, {firstName(profile.full_name)}!</h1>
            <p className="mt-2 max-w-xl text-lg text-grape-100">Your Primary 1 to 6 control room: every class, teacher and video, live from the database.</p>
          </div>
          <Mascot pose="stand" prop="cap" className="hidden w-48 sm:block" />
        </div>
      </section>
      <PageHeader title="School at a glance" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pupils" value={o.students ?? 0} note={`${o.active_learners_7d ?? 0} active this week`} />
        <Stat label="Active teachers" value={o.teachers_active ?? 0} note={`${o.teachers_pending ?? 0} waiting for review`} />
        <Stat label="Parents" value={o.parents ?? 0} />
        <Stat label="Classrooms" value={o.classrooms ?? 0} />
        <Stat label="Tests and quizzes" value={o.examinations ?? 0} note={`${o.exam_attempts ?? 0} taken, ${o.courses_published ?? 0} courses live`} />
        <Stat label="Class videos" value={videoRows.length} note={`${totalViews} plays, ${watchedThisWeek} pupils watched this week`} />
        <Stat label="Submission rate" value={submissionRate == null ? "–" : `${submissionRate}%`} note={`${o.submissions ?? 0} submissions`} />
        <Stat label="Revenue" value={formatNaira(o.revenue_kobo ?? 0)} note={`${o.active_subscriptions ?? 0} active plans`} />
      </div>

      {apps.length > 0 && (
        <Panel title={`Teacher applications waiting for you (${apps.length})`} className="mt-6 border-sun-400">
          <div className="grid gap-4">{apps.map((a) => <TeacherReview key={a.id} app={a} />)}</div>
        </Panel>
      )}

      <section aria-labelledby="classes-title" className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="classes-title" className="text-2xl font-semibold sm:text-3xl">Primary 1 to 6</h2>
          <p className="text-sm text-muted">{totals.students} pupils, {totals.active} active this week, {totals.classrooms} classrooms</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => {
            const look = lookFor(c.code);
            const n = Number(c.students);
            const v = videosByClass.get(c.code) ?? { videos: 0, watches: 0 };
            const possible = v.videos * n;
            const watchRate = possible ? Math.round((v.watches / possible) * 100) : null;
            const warnings = [n > 0 && Number(c.teachers) === 0 && "Needs a teacher", v.videos === 0 && "No videos yet", n === 0 && "No pupils yet"].filter(Boolean) as string[];
            return (
              <li key={c.code} className="overflow-hidden rounded-[1.6rem] border-2 border-line bg-white">
                <div className={`flex items-center gap-3 px-5 py-3 ${look.bg}`}>
                  <span className="font-display text-4xl font-semibold leading-none">{classNumber(c.name)}</span>
                  <span className="font-display text-lg font-semibold">{c.name}</span>
                  <Link href={`/admin/videos?class=${c.code}`} className="ml-auto rounded-full bg-white/80 px-3 py-1 text-xs font-bold hover:bg-white">Videos</Link>
                </div>
                <dl className="grid grid-cols-3 gap-2 px-5 py-4 text-center">
                  <div><dt className="text-xs text-muted">Pupils</dt><dd className="font-display text-2xl font-semibold tabular">{n}</dd></div>
                  <div><dt className="text-xs text-muted">Active</dt><dd className="font-display text-2xl font-semibold tabular">{Number(c.active_7d)}</dd></div>
                  <div><dt className="text-xs text-muted">Teachers</dt><dd className="font-display text-2xl font-semibold tabular">{Number(c.teachers)}</dd></div>
                  <div><dt className="text-xs text-muted">Videos</dt><dd className="font-display text-2xl font-semibold tabular">{v.videos}</dd></div>
                  <div><dt className="text-xs text-muted">Courses</dt><dd className="font-display text-2xl font-semibold tabular">{Number(c.courses)}</dd></div>
                  <div><dt className="text-xs text-muted">Watched</dt><dd className="font-display text-2xl font-semibold tabular">{watchRate == null ? "–" : `${watchRate}%`}</dd></div>
                </dl>
                {warnings.length > 0 && (
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t-2 border-line bg-sun-100 px-5 py-2.5 text-sm font-semibold text-ink-soft">
                    <AlertTriangle className="size-4 text-tangerine-700" aria-hidden="true" />{warnings.join(", ")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <Panel title="Most-watched videos" className="mt-6" action={<Link href="/admin/videos" className="text-sm font-semibold text-grape-700 hover:underline">All class videos</Link>}>
        {videoRows.length === 0 ? <p className="text-sm text-muted">No class videos yet. Teachers add them from Class videos.</p> : (
          <ol className="grid gap-2.5 text-sm">
            {videoRows.slice(0, 6).map((v, i) => (
              <li key={v.id} className="flex items-center gap-3">
                <span className={`grid size-8 shrink-0 place-items-center rounded-full font-display font-semibold ${lookFor(v.classes?.code).bg}`}>{i + 1}</span>
                <Link href={`/admin/videos/${v.id}`} className="min-w-0 flex-1 truncate font-semibold hover:underline">{v.title}</Link>
                <span className="shrink-0 text-muted">{v.classes?.name}</span>
                <span className="inline-flex w-16 shrink-0 items-center justify-end gap-1 tabular"><Eye className="size-3.5" aria-hidden="true" />{v.view_count}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Happening now" action={<Link href="/admin/activity" className="text-sm font-semibold text-grape-700 hover:underline">All activity</Link>}>
          {((live ?? []) as unknown as LiveNow[]).length > 0 && (
            <ul className="mb-4 grid gap-2">
              {((live ?? []) as unknown as LiveNow[]).map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-coral-100 px-3 py-2 text-sm">
                  <span className="rounded-full bg-coral-500 px-2 py-0.5 text-xs font-bold text-white">Live</span>
                  <span className="font-semibold">{l.title}</span>
                  <span className="text-ink-soft">{[l.classrooms?.name, l.profiles?.full_name].filter(Boolean).join(", ")}</span>
                </li>
              ))}
            </ul>
          )}
          {((activity ?? []) as unknown as Activity[]).length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : (
            <ul className="divide-y divide-line text-sm">
              {((activity ?? []) as unknown as Activity[]).map((a) => (
                <li key={a.id} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="min-w-0"><span className="font-semibold">{a.actor?.full_name || "Someone"}</span>{a.actor?.role ? <span className="text-muted"> ({a.actor.role})</span> : null} {actionLabel[a.action] ?? a.action.replace(".", " ")}</span>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="New accounts, last 14 days">
          <DailyBars data={o.signups_14d ?? []} label="New accounts" />
        </Panel>
      </div>

    </>
  );
}
