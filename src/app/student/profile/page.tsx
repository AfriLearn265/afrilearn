import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Award, BadgeCheck, ClipboardCheck, Flame, GraduationCap, Lock, Sparkles, Star, Trophy } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { Panel } from "@/components/app/AppShell";
import { ProfileHero } from "@/components/app/ProfileHero";
import { ActionForm, type ActionResult } from "@/components/app/ActionForm";
import { CopyButton } from "@/components/app/CopyButton";
import { Field, Input, Select } from "@/components/ui/Field";
import { interestOptions } from "@/config/curriculum";

export const metadata = { title: "Profile" };

const badgeIcons = { sparkles: Sparkles, trophy: Trophy, "graduation-cap": GraduationCap, flame: Flame, "clipboard-check": ClipboardCheck, star: Star, award: Award };

async function saveProfile(fd: FormData): Promise<ActionResult> {
  "use server";
  const { userId } = await requireRole("student");
  const supabase = await createClient();
  const name = String(fd.get("full_name") ?? "").trim();
  if (name.length < 2) return { error: "Enter your name." };
  const [a, b] = await Promise.all([
    supabase.from("profiles").update({ full_name: name }).eq("id", userId),
    supabase.from("students").update({
      class_id: String(fd.get("class_id") ?? "") || null,
      interests: fd.getAll("interests").map(String).slice(0, 12),
      leaderboard_opt_in: fd.get("leaderboard_opt_in") === "on",
    }).eq("profile_id", userId),
  ]);
  if (a.error || b.error) return { error: (a.error ?? b.error)!.message };
  revalidatePath("/student", "layout");
  return { message: "Profile saved." };
}

type Me = {
  class_id: string | null; interests: string[]; leaderboard_opt_in: boolean; link_code: string; guardian_name: string | null;
  points: number; streak_days: number; created_at: string; classes: { name: string } | null;
};

export default async function Profile() {
  const { userId, email, profile } = await requireRole("student");
  const supabase = await createClient();
  const [{ data: meRow }, { data: classes }, { data: parents }, { data: badges }, { data: mine }, { data: certs }, { count: lessons }, { data: results }, { count: rooms }] = await Promise.all([
    supabase.from("students").select("class_id, interests, leaderboard_opt_in, link_code, guardian_name, points, streak_days, created_at, classes(name)").eq("profile_id", userId).single(),
    supabase.from("classes").select("id, name").order("sort_order"),
    supabase.from("parent_children").select("parent_id, relationship").eq("student_id", userId),
    supabase.from("badges").select("id, key, name, description, icon").order("points").order("name"),
    supabase.from("student_badges").select("badge_id, awarded_at").eq("student_id", userId),
    supabase.from("certificates").select("id, title, certificate_no, issued_at").eq("student_id", userId).order("issued_at", { ascending: false }),
    supabase.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("student_id", userId).eq("status", "completed"),
    supabase.from("results").select("percentage").eq("student_id", userId),
    supabase.from("enrollments").select("classroom_id", { count: "exact", head: true }).eq("student_id", userId),
  ]);
  const me = meRow as unknown as Me | null;
  const ids = (parents ?? []).map((p) => p.parent_id);
  const { data: names } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const nameOf = new Map((names ?? []).map((n) => [n.id, n.full_name]));
  const interests = new Set(me?.interests ?? []);
  const earned = new Map((mine ?? []).map((b) => [b.badge_id, b.awarded_at]));
  const scores = (results ?? []).map((r) => Number(r.percentage));
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <>
      <ProfileHero id="student" userId={userId} name={profile.full_name} avatarUrl={profile.avatar_url}
        subtitle={<>{me?.classes?.name ?? "Class not set"}, learning since {me ? formatDate(me.created_at) : "today"}</>}
        tags={[...(me?.interests ?? [])].slice(0, 6)}
        stats={[
          { label: "Learning points", value: me?.points ?? 0 },
          { label: "Day streak", value: <>{me?.streak_days ?? 0}<span className="text-base font-semibold text-muted"> days</span></> },
          { label: "Lessons completed", value: lessons ?? 0 },
          { label: "Average test score", value: avg === null ? "–" : `${avg}%` },
        ]} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title={`Badges (${earned.size} of ${(badges ?? []).length})`}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(badges ?? []).map((b) => {
                const Icon = badgeIcons[b.icon as keyof typeof badgeIcons] ?? Award;
                const when = earned.get(b.id);
                return (
                  <li key={b.id} className={`rounded-2xl border p-4 ${when ? "border-sun-300 bg-sun-100" : "border-line bg-paper"}`}>
                    <span className={`grid size-11 place-items-center rounded-full ${when ? "bg-sun-400 text-ink" : "bg-white text-faint"}`}>
                      {when ? <Icon className="size-5" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
                    </span>
                    <p className={`mt-3 font-semibold leading-snug ${when ? "" : "text-muted"}`}>{b.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{when ? `Earned ${formatDate(when)}` : b.description}</p>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Certificates">
            {(certs ?? []).length === 0 ? (
              <p className="text-sm text-muted">Finish every lesson in a course to earn a certificate. <Link href="/student/courses" className="font-semibold text-adire-700 hover:underline">Browse courses</Link></p>
            ) : (
              <ul className="grid gap-3">
                {(certs ?? []).map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-paper p-4">
                    <BadgeCheck className="size-8 shrink-0 text-leaf-500" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{c.title}</p>
                      <p className="text-sm text-muted">Issued {formatDate(c.issued_at)}, certificate {c.certificate_no}</p>
                    </div>
                    <Link href={`/verify?no=${c.certificate_no}`} className="text-sm font-semibold text-adire-700 hover:underline">Verify</Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Edit your details">
            <ActionForm action={saveProfile} submitLabel="Save profile" resetOnSuccess={false}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="full_name"><Input id="full_name" name="full_name" defaultValue={profile.full_name} /></Field>
                <Field label="Class" htmlFor="class_id">
                  <Select id="class_id" name="class_id" defaultValue={me?.class_id ?? ""}>{[<option key="" value="">Not set</option>, ...(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)]}</Select>
                </Field>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-ink-soft">Interests</legend>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((i) => (
                    <label key={i} className="cursor-pointer">
                      <input type="checkbox" name="interests" value={i} defaultChecked={interests.has(i)} className="peer sr-only" />
                      <span className="inline-flex rounded-full border border-line px-3 py-1.5 text-sm peer-checked:border-adire-700 peer-checked:bg-adire-700 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-sun-300">{i}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="leaderboard_opt_in" defaultChecked={!!me?.leaderboard_opt_in} className="mt-0.5 size-4 accent-adire-700" />
                <span>Show my first name and points on class leaderboards (only where my teacher has turned them on).</span>
              </label>
            </ActionForm>
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <Panel title="Your account">
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Email</dt><dd className="truncate font-medium">{email}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Classrooms joined</dt><dd className="font-medium">{rooms ?? 0}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Tests taken</dt><dd className="font-medium">{scores.length}</dd></div>
            </dl>
          </Panel>
          <Panel title="Parent link code">
            <p className="mb-3 text-sm text-muted">Give this code to your parent or guardian so they can follow your progress.</p>
            <div className="flex flex-wrap items-center gap-3">
              <p className="rounded-xl bg-wash px-4 py-2 font-display text-2xl font-bold tracking-[0.2em] text-adire-800">{me?.link_code}</p>
              {me?.link_code && <CopyButton value={me.link_code} />}
            </div>
          </Panel>
          <Panel title="Linked parents and guardians">
            {(parents ?? []).length === 0 ? <p className="text-sm text-muted">No parent has linked to your account yet.{me?.guardian_name ? ` ${me.guardian_name} gave consent when you signed up.` : ""}</p> : (
              <ul className="grid gap-2 text-sm">{(parents ?? []).map((p, i) => <li key={i}><strong>{nameOf.get(p.parent_id) ?? "A parent"}</strong>, your {p.relationship}</li>)}</ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
