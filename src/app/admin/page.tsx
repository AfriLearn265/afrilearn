import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, greeting, timeAgo } from "@/lib/format";
import { formatNaira } from "@/lib/catalogue";
import { PageHeader, Panel, Stat } from "@/components/app/AppShell";
import { DailyBars } from "@/components/app/charts";
import { TeacherReview, type Application } from "./TeacherReview";

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
  const classes = ((breakdown ?? []) as ClassRow[]);
  const levels = [...new Set(classes.map((c) => c.level_name ?? "Other"))];
  const totals = classes.reduce((t, c) => ({ students: t.students + Number(c.students), active: t.active + Number(c.active_7d), classrooms: t.classrooms + Number(c.classrooms) }), { students: 0, active: 0, classrooms: 0 });
  const busiest = Math.max(1, ...classes.map((c) => Number(c.students)));
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
      <PageHeader title={`${greeting()}, ${firstName(profile.full_name)}.`} intro="Everything happening across the platform, live from the database." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Students" value={o.students ?? 0} note={`${o.active_learners_7d ?? 0} active this week`} />
        <Stat label="Active teachers" value={o.teachers_active ?? 0} note={`${o.teachers_pending ?? 0} waiting for review`} />
        <Stat label="Parents" value={o.parents ?? 0} />
        <Stat label="Classrooms" value={o.classrooms ?? 0} />
        <Stat label="Courses" value={o.courses ?? 0} note={`${o.courses_published ?? 0} published`} />
        <Stat label="Examinations" value={o.examinations ?? 0} note={`${o.exam_attempts ?? 0} attempts`} />
        <Stat label="Submission rate" value={submissionRate == null ? "–" : `${submissionRate}%`} note={`${o.submissions ?? 0} submissions`} />
        <Stat label="Revenue" value={formatNaira(o.revenue_kobo ?? 0)} note={`${o.active_subscriptions ?? 0} active plans`} />
      </div>

      {apps.length > 0 && (
        <Panel title={`Teacher applications waiting for you (${apps.length})`} className="mt-6 border-sun-400">
          <div className="grid gap-4">{apps.map((a) => <TeacherReview key={a.id} app={a} />)}</div>
        </Panel>
      )}

      <Panel title="Every class at a glance" className="mt-6"
        action={<span className="text-sm text-muted">{totals.students} students, {totals.active} active this week, {totals.classrooms} classrooms</span>}>
        <div className="-mx-4 overflow-x-auto sm:-mx-5 md:-mx-6">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium sm:px-5 md:px-6">Class</th>
                <th scope="col" className="px-3 py-2 font-medium">Students</th>
                <th scope="col" className="px-3 py-2 font-medium">Active this week</th>
                <th scope="col" className="px-3 py-2 font-medium">Teachers</th>
                <th scope="col" className="px-3 py-2 font-medium">Classrooms</th>
                <th scope="col" className="px-3 py-2 pr-4 font-medium sm:pr-5 md:pr-6">Courses</th>
              </tr>
            </thead>
            {levels.map((lv) => (
              <tbody key={lv} className="border-b border-line last:border-0">
                <tr><th colSpan={6} scope="colgroup" className="bg-paper px-4 py-2 text-xs font-semibold text-muted sm:px-5 md:px-6">{lv}</th></tr>
                {classes.filter((c) => (c.level_name ?? "Other") === lv).map((c) => {
                  const n = Number(c.students);
                  return (
                    <tr key={c.code} className={n === 0 && Number(c.teachers) === 0 ? "text-muted" : ""}>
                      <th scope="row" className="px-4 py-2.5 font-semibold sm:px-5 md:px-6">{c.name}</th>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          <span className="tabular w-6">{n}</span>
                          <span aria-hidden="true" className="h-2 w-24 overflow-hidden rounded-full bg-wash"><span className="block h-full rounded-full bg-adire-600" style={{ width: `${(n / busiest) * 100}%` }} /></span>
                        </span>
                      </td>
                      <td className="tabular px-3 py-2.5">{Number(c.active_7d)}</td>
                      <td className={`tabular px-3 py-2.5 ${n > 0 && Number(c.teachers) === 0 ? "font-semibold text-coral-700" : ""}`}>{Number(c.teachers)}{n > 0 && Number(c.teachers) === 0 ? " (needs one)" : ""}</td>
                      <td className="tabular px-3 py-2.5">{Number(c.classrooms)}</td>
                      <td className="tabular px-3 py-2.5 pr-4 sm:pr-5 md:pr-6">{Number(c.courses)}</td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Happening now" action={<Link href="/admin/activity" className="text-sm font-semibold text-adire-700 hover:underline">All activity</Link>}>
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
