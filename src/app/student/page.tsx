import { Flame, Medal, Star, Users } from "lucide-react";
import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { greeting } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { CopyButton } from "@/components/app/CopyButton";
import { Field, Input, Notice } from "@/components/ui/Field";
import { joinClassroom, regenerateLinkCode } from "./actions";

export const metadata = { title: "Student dashboard" };

type Enrollment = {
  classrooms: { id: string; name: string; subjects: { name: string; color: string } | null; profiles: { full_name: string } | null } | null;
};

export default async function StudentHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { profile, userId } = await requireRole("student");
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: me }, { data: enrollments }, { count: badgeCount }] = await Promise.all([
    supabase.from("students").select("points, streak_days, link_code, classes(name, education_levels(name))").eq("profile_id", userId).single(),
    supabase.from("enrollments").select("classrooms(id, name, subjects(name, color), profiles(full_name))").eq("student_id", userId).eq("status", "active"),
    supabase.from("student_badges").select("badge_id", { count: "exact", head: true }).eq("student_id", userId),
  ]);
  const klass = me?.classes as unknown as { name: string; education_levels: { name: string } | null } | null;
  const rooms = ((enrollments ?? []) as unknown as Enrollment[]).map((e) => e.classrooms).filter((r): r is NonNullable<Enrollment["classrooms"]> => !!r);

  const stats = [
    { icon: Star, label: "Learning points", value: me?.points ?? 0 },
    { icon: Flame, label: "Day streak", value: me?.streak_days ?? 0 },
    { icon: Users, label: "Classrooms", value: rooms.length },
    { icon: Medal, label: "Badges", value: badgeCount ?? 0 },
  ];

  return (
    <>
      <PageHeader title={`${greeting()}, ${firstName(profile.full_name)}.`}
        intro={klass ? `${klass.name}${klass.education_levels ? `, ${klass.education_levels.name}` : ""}. Here is where your learning stands today.` : "Choose your class from your profile to see the right lessons."} />

      {sp.welcome && <div className="mb-6"><Notice tone="success" title="Your account is ready.">Join your teacher&apos;s classroom with their class code to see lessons and assignments.</Notice></div>}
      {sp.notice && <div className="mb-6"><Notice tone="warning">{sp.notice}</Notice></div>}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <li key={label} className="rounded-[1.25rem] border border-line bg-white p-5">
            <Icon className="size-5 text-adire-700" aria-hidden="true" />
            <p className="mt-3 font-display text-3xl font-bold tabular">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="My classrooms">
          {rooms.length === 0 ? (
            <EmptyState title="You haven't joined a classroom yet.">Ask your teacher for their six-character class code and enter it on the right.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {rooms.map((r) => (
                <li key={r.id} className="flex items-center gap-4 py-3.5">
                  <span className="size-3 shrink-0 rounded-full" style={{ background: r.subjects?.color ?? "#2B3A9F" }} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.name}</p>
                    <p className="text-sm text-muted">{[r.subjects?.name, r.profiles?.full_name && `with ${r.profiles.full_name}`].filter(Boolean).join(", ")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="grid content-start gap-6">
          <Panel title="Join a classroom">
            <ActionForm action={joinClassroom} submitLabel="Join classroom" pendingLabel="Joining">
              <Field label="Class code" htmlFor="code">
                <Input id="code" name="code" maxLength={12} autoComplete="off" className="uppercase tracking-[0.25em]" placeholder="K7M2QX" />
              </Field>
            </ActionForm>
          </Panel>
          <Panel title="Link a parent or guardian">
            <p className="text-sm text-muted">Give this code to your parent or guardian. They enter it on their dashboard to follow your progress.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="rounded-xl bg-wash px-4 py-2 font-display text-2xl font-bold tracking-[0.2em] text-adire-800">{me?.link_code}</p>
              {me?.link_code && <CopyButton value={me.link_code} />}
            </div>
            <ActionForm action={regenerateLinkCode} submitLabel="Make a new code" pendingLabel="Making a new code" variant="outline" className="mt-4" resetOnSuccess={false}>
              <p className="text-xs text-muted">Making a new code stops the old one from working. Parents already linked stay linked.</p>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
