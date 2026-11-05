import Link from "next/link";
import clsx from "clsx";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Input } from "@/components/ui/Field";
import { addSubject, saveClassSubjects, toggleClass, toggleSubject } from "../manage-actions";

export const metadata = { title: "Academic structure" };

type Klass = { id: string; code: string; name: string; is_active: boolean; education_levels: { name: string; sort_order: number } | null };

export default async function Academics({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  await requireRole("admin");
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: classesData }, { data: subjects }] = await Promise.all([
    supabase.from("classes").select("id, code, name, is_active, education_levels(name, sort_order)").order("sort_order"),
    supabase.from("subjects").select("id, name, color, is_active, class_subjects(count)").order("name"),
  ]);
  const all = (classesData ?? []) as unknown as Klass[];
  const classes = all.filter((c) => c.is_active);
  const off = all.filter((c) => !c.is_active);
  const current = all.find((c) => c.code === sp.class) ?? classes[0];
  const { data: mapped } = current ? await supabase.from("class_subjects").select("subject_id, is_compulsory").eq("class_id", current.id) : { data: [] };
  const on = new Map((mapped ?? []).map((m) => [m.subject_id, m.is_compulsory]));
  const levels = [...new Set(classes.map((c) => c.education_levels?.name ?? ""))];

  return (
    <>
      <PageHeader title="Classes and subjects" intro="Decide which subjects belong to each class. Pupils see only their class's subjects; teachers and the practice quizzes use the same map." />
      <div className="grid gap-6 xl:grid-cols-[16rem_1fr_20rem]">
        <Panel title="Classes">
          <nav aria-label="Classes" className="grid gap-4">
            {levels.map((lv) => (
              <div key={lv}>
                <p className="mb-1 text-xs font-semibold text-muted">{lv}</p>
                <ul className="grid gap-0.5">
                  {classes.filter((c) => (c.education_levels?.name ?? "") === lv).map((c) => (
                    <li key={c.id}><Link href={`/admin/academics?class=${c.code}`} className={clsx("block rounded-lg px-2.5 py-1.5 text-sm", c.id === current?.id ? "bg-grape-600 font-semibold text-white" : "hover:bg-wash")}>{c.name}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          {off.length > 0 && (
            <details className="mt-5 border-t-2 border-line pt-4">
              <summary className="cursor-pointer text-sm font-semibold text-muted">Switched off ({off.length})</summary>
              <p className="mt-2 text-xs text-muted">These classes are hidden from the site, sign-up and dashboards. Their records are kept.</p>
              <ul className="mt-2 grid gap-1">
                {off.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted">{c.name}</span>
                    <form action={toggleClass}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="on" value="1" />
                      <button type="submit" className="text-xs font-semibold text-grape-700 hover:underline">Switch on</button></form>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Panel>
        <Panel title={current ? `Subjects for ${current.name}` : "Subjects"}
          action={current?.is_active ? (
            <form action={toggleClass}><input type="hidden" name="id" value={current.id} /><input type="hidden" name="on" value="0" />
              <button type="submit" className="text-sm font-semibold text-coral-700 hover:underline">Switch this class off</button></form>
          ) : undefined}>
          {current && (
            <ActionForm action={saveClassSubjects} submitLabel="Save subjects" resetOnSuccess={false}>
              <input type="hidden" name="class_id" value={current.id} />
              <p className="text-sm text-muted">Tick the subjects taught in this class. Tick “compulsory” for core subjects.</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {(subjects ?? []).filter((s) => s.is_active).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-wash">
                    <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name="subject_id" value={s.id} defaultChecked={on.has(s.id)} className="size-4 accent-adire-700" />
                      <span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden="true" />{s.name}</label>
                    <label className="flex items-center gap-1 text-xs text-muted"><input type="checkbox" name="compulsory" value={s.id} defaultChecked={on.get(s.id) === true} className="size-3.5 accent-sun-600" />compulsory</label>
                  </li>
                ))}
              </ul>
            </ActionForm>
          )}
        </Panel>
        <div className="grid content-start gap-6">
          <Panel title="Add a subject">
            <ActionForm action={addSubject} submitLabel="Add subject">
              <Field label="Name" htmlFor="sname"><Input id="sname" name="name" placeholder="e.g. Data Processing" /></Field>
              <Field label="Colour" htmlFor="scolor"><Input id="scolor" name="color" type="color" defaultValue="#4A1FB8" className="h-11 w-20 p-1" /></Field>
            </ActionForm>
          </Panel>
          <Panel title="All subjects">
            <ul className="grid gap-1 text-sm">
              {(subjects ?? []).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <span className={s.is_active ? "" : "text-muted line-through"}>{s.name} <span className="text-xs text-muted">({(s.class_subjects as { count: number }[])?.[0]?.count ?? 0} classes)</span></span>
                  <form action={toggleSubject}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="on" value={s.is_active ? "0" : "1"} />
                    <button type="submit" className="text-xs font-semibold text-adire-700 hover:underline">{s.is_active ? "Hide" : "Restore"}</button></form>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
