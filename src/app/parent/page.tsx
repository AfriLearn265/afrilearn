import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { greeting } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Input, Select } from "@/components/ui/Field";
import { linkChild } from "./actions";

export const metadata = { title: "Parent dashboard" };

type Child = {
  relationship: string;
  students: { profile_id: string; points: number; streak_days: number; profiles: { full_name: string } | null; classes: { name: string } | null } | null;
};

export default async function ParentHome() {
  const { profile, userId } = await requireRole("parent");
  const supabase = await createClient();
  const { data } = await supabase.from("parent_children")
    .select("relationship, students(profile_id, points, streak_days, profiles(full_name), classes(name))")
    .eq("parent_id", userId).order("linked_at");
  const children = ((data ?? []) as unknown as Child[]).map((c) => ({ ...c.students!, relationship: c.relationship })).filter((c) => c.profile_id);

  return (
    <>
      <PageHeader title={`${greeting()}, ${firstName(profile.full_name)}.`}
        intro="Link each child once. You will see their results, attendance, assignments and teacher feedback here." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Your children">
          {children.length === 0 ? (
            <EmptyState title="No children linked yet.">Ask your child to open their profile on {`their dashboard`} and read out their link code. Enter it on the right.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {children.map((c) => (
                <li key={c.profile_id} className="flex flex-wrap items-center gap-4 py-4">
                  <span className="grid size-11 place-items-center rounded-full bg-sun-400 font-display font-bold">{c.profiles?.full_name?.[0] ?? "?"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.profiles?.full_name}</p>
                    <p className="text-sm text-muted">{c.classes?.name ?? "Class not set"}, your {c.relationship}</p>
                  </div>
                  <dl className="flex gap-6 text-sm">
                    <div><dt className="text-muted">Points</dt><dd className="font-display text-xl font-bold tabular">{c.points}</dd></div>
                    <div><dt className="text-muted">Streak</dt><dd className="font-display text-xl font-bold tabular">{c.streak_days} days</dd></div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Link a child">
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
    </>
  );
}
