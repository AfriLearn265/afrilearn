import Link from "next/link";
import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { greeting } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Input, Select } from "@/components/ui/Field";
import { linkChild } from "./actions";
import { AddChildForm } from "./AddChildForm";
import { siteUrl } from "@/lib/env";
import { Flame, MonitorPlay, Star, Trophy } from "lucide-react";
import { classNumber, lookFor } from "@/config/classLook";
import { pct } from "@/lib/format";

export const metadata = { title: "Parent dashboard" };

type Child = {
  relationship: string;
  students: { profile_id: string; class_id: string | null; points: number; streak_days: number; profiles: { full_name: string } | null; classes: { name: string; code: string } | null } | null;
};

export default async function ParentHome() {
  const { profile, userId } = await requireRole("parent");
  const supabase = await createClient();
  const { data } = await supabase.from("parent_children")
    .select("relationship, students(profile_id, class_id, points, streak_days, profiles(full_name), classes(name, code))")
    .eq("parent_id", userId).order("linked_at");
  const children = ((data ?? []) as unknown as Child[]).map((c) => ({ ...c.students!, relationship: c.relationship })).filter((c) => c.profile_id);
  const { data: offered } = await supabase.from("classes").select("code, name").eq("is_active", true).order("sort_order");
  const site = siteUrl().replace(/^https?:\/\//, "");
  const ids = children.map((c) => c.profile_id);
  const classIds = [...new Set(children.map((c) => c.class_id).filter((x): x is string => !!x))];
  const [{ data: views }, { data: vids }, { data: attempts }] = ids.length ? await Promise.all([
    supabase.from("video_views").select("student_id, video_id").in("student_id", ids),
    classIds.length ? supabase.from("class_videos").select("id, class_id").in("class_id", classIds).eq("is_published", true) : Promise.resolve({ data: [] as { id: string; class_id: string }[] }),
    supabase.from("exam_attempts").select("student_id, percentage, submitted_at, examinations(title)").in("student_id", ids).eq("status", "graded").order("submitted_at", { ascending: false }).limit(40),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];
  const videosIn = (classId: string | null) => (vids ?? []).filter((v) => v.class_id === classId).length;
  const watchedBy = (id: string) => (views ?? []).filter((v) => v.student_id === id).length;
  const lastResult = (id: string) => ((attempts ?? []) as unknown as { student_id: string; percentage: number; examinations: { title: string } | null }[]).find((a) => a.student_id === id);

  return (
    <>
      <PageHeader title={`${greeting()}, ${firstName(profile.full_name)}.`}
        intro="Your children's videos, quizzes, results and teacher feedback, all in one place." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Your children">
          {children.length === 0 ? (
            <EmptyState title="No children added yet.">Create your child&apos;s account under Add a child. If they already have one, enter the link code from their profile page.</EmptyState>
          ) : (
            <ul className="grid gap-4">
              {children.map((c) => {
                const look = lookFor(c.classes?.code);
                const total = videosIn(c.class_id);
                const seen = Math.min(watchedBy(c.profile_id), total);
                const last = lastResult(c.profile_id);
                return (
                  <li key={c.profile_id} className="overflow-hidden rounded-[1.6rem] border-2 border-ink bg-white shadow-[var(--shadow-sticker-sm)]">
                    <Link href={`/parent/children/${c.profile_id}`} className="group flex items-center gap-4 p-4 sm:p-5">
                      <span className={`grid size-16 shrink-0 place-items-center rounded-2xl border-2 border-ink font-display text-3xl font-semibold ${look.bg}`}>
                        {c.classes ? classNumber(c.classes.name) : "?"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-2xl font-semibold group-hover:underline">{c.profiles?.full_name}</span>
                        <span className="block text-sm text-muted">{c.classes?.name ?? "Class not set"}, your {c.relationship}</span>
                      </span>
                      <span className="hidden rounded-full bg-grape-50 px-4 py-2 font-display text-sm font-semibold text-grape-700 sm:block">See progress</span>
                    </Link>
                    <dl className="grid grid-cols-2 border-t-2 border-line text-sm sm:grid-cols-4">
                      <div className="flex items-center gap-2 px-4 py-3"><Star className="size-4 text-sun-600" aria-hidden="true" /><dt className="sr-only">Points</dt><dd><span className="font-display text-lg font-semibold tabular">{c.points}</span> points</dd></div>
                      <div className="flex items-center gap-2 px-4 py-3"><Flame className="size-4 text-tangerine-600" aria-hidden="true" /><dt className="sr-only">Streak</dt><dd><span className="font-display text-lg font-semibold tabular">{c.streak_days}</span>-day streak</dd></div>
                      <div className="flex items-center gap-2 px-4 py-3"><MonitorPlay className="size-4 text-grape-600" aria-hidden="true" /><dt className="sr-only">Videos watched</dt><dd><span className="font-display text-lg font-semibold tabular">{seen}/{total}</span> videos</dd></div>
                      <div className="flex min-w-0 items-center gap-2 px-4 py-3"><Trophy className="size-4 shrink-0 text-leaf-500" aria-hidden="true" /><dt className="sr-only">Latest result</dt>
                        <dd className="min-w-0 truncate">{last ? <><span className="font-display text-lg font-semibold tabular">{pct(last.percentage)}</span> latest test</> : "No tests yet"}</dd></div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <div className="grid content-start gap-6">
        <Panel title="Add a child">
          <p className="mb-4 text-sm text-muted">No email needed. We make a simple login ID and password your child can type on any phone or computer.</p>
          <AddChildForm classes={offered ?? []} site={site} />
        </Panel>
        <Panel title="Already has an account? Link it">
          <ActionForm action={linkChild} submitLabel="Link child" pendingLabel="Linking">
            <Field label="Link code" htmlFor="code" hint="From your child's dashboard">
              <Input id="code" name="code" maxLength={12} autoComplete="off" className="uppercase tracking-[0.25em]" placeholder="8 characters" />
            </Field>
            <Field label="You are their" htmlFor="relationship">
              <Select id="relationship" name="relationship" defaultValue="parent">
                <option value="mother">Mother</option>
                <option value="father">Father</option>
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
                <option value="sponsor">Sponsor</option>
              </Select>
            </Field>
          </ActionForm>
        </Panel>
        </div>
      </div>
    </>
  );
}
