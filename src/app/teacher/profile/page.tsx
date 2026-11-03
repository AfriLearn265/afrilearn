import Link from "next/link";
import { revalidatePath } from "next/cache";
import { BadgeCheck, Building2, Clock, GraduationCap } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { Panel } from "@/components/app/AppShell";
import { ProfileHero } from "@/components/app/ProfileHero";
import { ActionForm, type ActionResult } from "@/components/app/ActionForm";
import { Field, Input, Textarea } from "@/components/ui/Field";

export const metadata = { title: "My profile" };

async function saveTeacherProfile(fd: FormData): Promise<ActionResult> {
  "use server";
  const { userId } = await requireRole("teacher");
  const supabase = await createClient();
  const name = String(fd.get("full_name") ?? "").trim();
  if (name.length < 2) return { error: "Enter your name." };
  const yearsRaw = String(fd.get("years_experience") ?? "").trim();
  const years = yearsRaw === "" ? null : Number(yearsRaw);
  if (years !== null && (!Number.isInteger(years) || years < 0 || years > 70)) return { error: "Years of experience should be a whole number from 0 to 70." };
  const [a, b] = await Promise.all([
    supabase.from("profiles").update({ full_name: name }).eq("id", userId),
    supabase.from("teachers").update({
      qualification: String(fd.get("qualification") ?? "").trim() || null,
      institution: String(fd.get("institution") ?? "").trim() || null,
      phone: String(fd.get("phone") ?? "").trim() || null,
      years_experience: years,
      bio: String(fd.get("bio") ?? "").trim().slice(0, 1200) || null,
    }).eq("profile_id", userId),
  ]);
  if (a.error || b.error) return { error: (a.error ?? b.error)!.message };
  revalidatePath("/teacher", "layout");
  return { message: "Profile saved." };
}

type Teacher = {
  qualification: string | null; institution: string | null; years_experience: number | null; bio: string | null; phone: string | null;
  application_status: string; reviewed_at: string | null; created_at: string;
  teacher_subjects: { subjects: { name: string; color: string } | null }[];
  teacher_classes: { classes: { name: string; sort_order: number } | null }[];
};

export default async function TeacherProfile() {
  const { userId, email, profile } = await requireRole("teacher");
  const supabase = await createClient();
  const [{ data: row }, { data: rooms }, { count: courses }, { count: questions }, { count: lives }, { count: marked }] = await Promise.all([
    supabase.from("teachers").select("qualification, institution, years_experience, bio, phone, application_status, reviewed_at, created_at, teacher_subjects(subjects(name, color)), teacher_classes(classes(name, sort_order))")
      .eq("profile_id", userId).single(),
    supabase.from("classrooms").select("id, name, enrollments(count)").eq("teacher_id", userId).eq("is_archived", false),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("teacher_id", userId).eq("is_published", true),
    supabase.from("questions").select("id", { count: "exact", head: true }).eq("created_by", userId),
    supabase.from("live_classes").select("id", { count: "exact", head: true }).eq("teacher_id", userId).in("status", ["live", "ended"]),
    supabase.from("assignment_submissions").select("id", { count: "exact", head: true }).eq("graded_by", userId),
  ]);
  const t = row as unknown as Teacher | null;
  const roomList = (rooms ?? []) as unknown as { id: string; name: string; enrollments: { count: number }[] }[];
  const students = roomList.reduce((n, r) => n + (r.enrollments?.[0]?.count ?? 0), 0);
  const subjects = (t?.teacher_subjects ?? []).map((s) => s.subjects).filter((s): s is { name: string; color: string } => !!s);
  const classes = (t?.teacher_classes ?? []).map((c) => c.classes).filter((c): c is { name: string; sort_order: number } => !!c)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <ProfileHero id="teacher" userId={userId} name={profile.full_name} avatarUrl={profile.avatar_url}
        subtitle={[t?.qualification, t?.institution].filter(Boolean).join(", ") || "Teacher"}
        tags={subjects.map((s) => s.name)}
        stats={[
          { label: "Classrooms", value: roomList.length },
          { label: "Students taught", value: students },
          { label: "Courses published", value: courses ?? 0 },
          { label: "Questions written", value: questions ?? 0 },
        ]} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title="About me">
            {t?.bio ? <p className="whitespace-pre-line leading-relaxed text-ink-soft">{t.bio}</p>
              : <p className="text-sm text-muted">Add a short introduction below. Parents see it when you message them.</p>}
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-2.5"><GraduationCap className="mt-0.5 size-4 shrink-0 text-adire-700" aria-hidden="true" /><div><dt className="text-muted">Qualification</dt><dd className="font-medium">{t?.qualification ?? "Not added"}</dd></div></div>
              <div className="flex items-start gap-2.5"><Building2 className="mt-0.5 size-4 shrink-0 text-adire-700" aria-hidden="true" /><div><dt className="text-muted">School or institution</dt><dd className="font-medium">{t?.institution ?? "Not added"}</dd></div></div>
              <div className="flex items-start gap-2.5"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-leaf-500" aria-hidden="true" /><div><dt className="text-muted">Status</dt><dd className="font-medium">{t?.application_status === "approved" ? `Approved teacher${t.reviewed_at ? ` since ${formatDate(t.reviewed_at)}` : ""}` : "Application under review"}</dd></div></div>
              <div className="flex items-start gap-2.5"><Clock className="mt-0.5 size-4 shrink-0 text-adire-700" aria-hidden="true" /><div><dt className="text-muted">Experience</dt><dd className="font-medium">{t?.years_experience != null ? `${t.years_experience} years teaching` : "Not added"}</dd></div></div>
            </dl>
          </Panel>

          <Panel title="Edit your profile">
            <ActionForm action={saveTeacherProfile} submitLabel="Save profile" resetOnSuccess={false}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="full_name"><Input id="full_name" name="full_name" defaultValue={profile.full_name} /></Field>
                <Field label="Phone (private)" htmlFor="phone"><Input id="phone" name="phone" type="tel" defaultValue={t?.phone ?? ""} /></Field>
                <Field label="Qualification" htmlFor="qualification"><Input id="qualification" name="qualification" defaultValue={t?.qualification ?? ""} placeholder="B.Sc (Ed) Mathematics" /></Field>
                <Field label="School or institution" htmlFor="institution"><Input id="institution" name="institution" defaultValue={t?.institution ?? ""} /></Field>
                <Field label="Years of teaching" htmlFor="years_experience"><Input id="years_experience" name="years_experience" type="number" min={0} max={70} defaultValue={t?.years_experience ?? ""} /></Field>
              </div>
              <Field label="About me" htmlFor="bio" hint="A few sentences parents and students will see"><Textarea id="bio" name="bio" rows={4} maxLength={1200} defaultValue={t?.bio ?? ""} /></Field>
            </ActionForm>
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <Panel title="Subjects and classes">
            <p className="text-sm font-semibold text-ink-soft">Subjects</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {subjects.length === 0 ? <li className="text-sm text-muted">None listed</li> : subjects.map((s) => (
                <li key={s.name} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden="true" />{s.name}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm font-semibold text-ink-soft">Classes</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {classes.length === 0 ? <li className="text-sm text-muted">None listed</li> : classes.map((c) => (
                <li key={c.name} className="rounded-full bg-wash px-3 py-1 text-sm font-medium text-adire-800">{c.name}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">To change these, ask an administrator. They were checked when your application was approved.</p>
          </Panel>
          <Panel title="Your classrooms">
            {roomList.length === 0 ? <p className="text-sm text-muted">No classrooms yet. <Link href="/teacher" className="font-semibold text-adire-700 hover:underline">Create one</Link></p> : (
              <ul className="divide-y divide-line text-sm">
                {roomList.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/teacher/classrooms/${r.id}`} className="min-w-0 truncate font-semibold hover:underline">{r.name}</Link>
                    <span className="shrink-0 text-muted">{r.enrollments?.[0]?.count ?? 0} students</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Your account">
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Email</dt><dd className="truncate font-medium">{email}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Joined</dt><dd className="font-medium">{t ? formatDate(t.created_at) : "–"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Live classes taught</dt><dd className="font-medium">{lives ?? 0}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Assignments marked</dt><dd className="font-medium">{marked ?? 0}</dd></div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
