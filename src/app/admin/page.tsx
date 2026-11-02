import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, greeting } from "@/lib/format";
import { formatNaira } from "@/lib/catalogue";
import { PageHeader, Panel, EmptyState, Stat } from "@/components/app/AppShell";
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

export default async function AdminHome() {
  const { profile } = await requireRole("admin");
  const supabase = await createClient();
  const [{ data: overview }, { data: pending }, { data: users }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.from("teachers")
      .select("profile_id, qualification, years_experience, institution, bio, document_paths, created_at, profiles(full_name), teacher_subjects(subjects(name)), teacher_classes(classes(name, sort_order))")
      .eq("application_status", "pending").order("created_at"),
    supabase.rpc("admin_list_users", { p_role: "teacher", p_limit: 200 }),
  ]);
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Panel title="New accounts, last 14 days">
          <DailyBars data={o.signups_14d ?? []} label="New accounts" />
        </Panel>
        <Panel title={`Teacher applications${apps.length ? ` (${apps.length})` : ""}`}>
          {apps.length === 0 ? (
            <EmptyState title="No applications waiting.">New teacher applications appear here for review.</EmptyState>
          ) : (
            <div className="grid gap-4">{apps.map((a) => <TeacherReview key={a.id} app={a} />)}</div>
          )}
        </Panel>
      </div>
    </>
  );
}
