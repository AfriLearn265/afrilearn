import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { Panel } from "@/components/app/AppShell";
import { AdminDashboard, RANGES, type Activity, type Insights } from "@/components/app/AdminDashboard";
import type { Application } from "./TeacherReview";

export const metadata = { title: "Administration" };

type TeacherRow = {
  profile_id: string; qualification: string | null; years_experience: number | null; institution: string | null; bio: string | null;
  document_paths: string[]; created_at: string; profiles: { full_name: string } | null;
  teacher_subjects: { subjects: { name: string } | null }[]; teacher_classes: { classes: { name: string; sort_order: number } | null }[];
};

/**
 * The administrator's control room: how the platform is doing over a chosen period, what content is still
 * missing for this term, how each class is getting on, and what needs attention today.
 */
export default async function AdminHome({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { profile } = await requireRole("admin");
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.range) as (typeof RANGES)[number]) ? Number(sp.range) : 30;
  const supabase = await createClient();
  const [{ data: raw, error }, { data: pending }, { data: users }, { data: activity }] = await Promise.all([
    supabase.rpc("admin_insights", { p_days: days }),
    supabase.from("teachers")
      .select("profile_id, qualification, years_experience, institution, bio, document_paths, created_at, profiles(full_name), teacher_subjects(subjects(name)), teacher_classes(classes(name, sort_order))")
      .eq("application_status", "pending").order("created_at"),
    supabase.rpc("admin_list_users", { p_role: "teacher", p_limit: 200 }),
    supabase.from("activity_logs").select("id, action, created_at, actor:profiles(full_name, role)").order("created_at", { ascending: false }).limit(10),
  ]);
  if (error || !raw) {
    return <Panel title="The dashboard couldn't load">Refresh the page. If it keeps happening, check that the latest database update has been run.</Panel>;
  }
  const d = raw as Insights;
  const emails = new Map(((users ?? []) as { id: string; email: string }[]).map((u) => [u.id, u.email]));
  const apps: Application[] = ((pending ?? []) as unknown as TeacherRow[]).map((t) => ({
    id: t.profile_id, name: t.profiles?.full_name ?? "Unnamed", email: emails.get(t.profile_id) ?? null,
    qualification: t.qualification, years: t.years_experience, institution: t.institution, bio: t.bio,
    subjects: t.teacher_subjects.map((s) => s.subjects?.name).filter((s): s is string => !!s),
    classes: t.teacher_classes.map((c) => c.classes).filter((c): c is { name: string; sort_order: number } => !!c)
      .sort((a, b) => a.sort_order - b.sort_order).map((c) => c.name),
    documents: t.document_paths ?? [], applied: formatDate(t.created_at),
  }));
  return <AdminDashboard insights={d} days={days} name={firstName(profile.full_name)} apps={apps} activity={(activity ?? []) as unknown as Activity[]} />;
}

