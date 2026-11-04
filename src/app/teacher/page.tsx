import Link from "next/link";
import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { greeting } from "@/lib/format";
import { PageHeader, Panel, EmptyState, Stat } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { CopyButton } from "@/components/app/CopyButton";
import { Field, Input, Select } from "@/components/ui/Field";
import { createClassroom } from "./actions";

export const metadata = { title: "Teacher dashboard" };

type Room = {
  id: string; name: string; join_code: string; classes: { name: string } | null;
  subjects: { name: string; color: string } | null; enrollments: { count: number }[];
};

export default async function TeacherHome() {
  const { profile, userId } = await requireRole("teacher");
  const supabase = await createClient();
  const [{ data: rooms }, { data: classes }, { data: subjects }, { data: mySubjects }] = await Promise.all([
    supabase.from("classrooms").select("id, name, join_code, classes(name), subjects(name, color), enrollments(count)")
      .eq("teacher_id", userId).eq("is_archived", false).order("created_at", { ascending: false }),
    supabase.from("classes").select("id, name, education_levels(name, sort_order)").order("sort_order"),
    supabase.from("subjects").select("id, name").eq("is_active", true).order("name"),
    supabase.from("teacher_subjects").select("subject_id").eq("teacher_id", userId),
  ]);
  const list = (rooms ?? []) as unknown as Room[];
  const students = list.reduce((n, r) => n + (r.enrollments?.[0]?.count ?? 0), 0);
  const mine = new Set((mySubjects ?? []).map((s) => s.subject_id));
  const sortedSubjects = [...(subjects ?? [])].sort((a, b) => Number(mine.has(b.id)) - Number(mine.has(a.id)));

  return (
    <>
      <PageHeader title={`${greeting()}, ${firstName(profile.full_name)}.`} intro="Create a classroom, share its code, and your students appear here as they join." />
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <Stat label="Classrooms" value={list.length} />
        <Stat label="Students enrolled" value={students} />
        <Stat label="Subjects you teach" value={mine.size} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Your classrooms">
          {list.length === 0 ? (
            <EmptyState title="No classrooms yet.">Create your first classroom. You will get a code to share with your students.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {list.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                  <span className="size-3 shrink-0 rounded-full" style={{ background: r.subjects?.color ?? "#4A1FB8" }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/teacher/classrooms/${r.id}`} className="block truncate font-semibold hover:underline">{r.name}</Link>
                    <p className="text-sm text-muted">{[r.classes?.name, r.subjects?.name, `${r.enrollments?.[0]?.count ?? 0} students`].filter(Boolean).join(", ")}</p>
                  </div>
                  <div className="flex basis-full items-center gap-2 pl-7 sm:basis-auto sm:pl-0">
                    <p className="rounded-lg bg-wash px-3 py-1.5 font-display font-bold tracking-[0.2em] text-adire-800">{r.join_code}</p>
                    <CopyButton value={r.join_code} label="Copy code" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Create a classroom">
          <ActionForm action={createClassroom} submitLabel="Create classroom" pendingLabel="Creating">
            <Field label="Classroom name" htmlFor="name">
              <Input id="name" name="name" placeholder="SS1 Mathematics, First Term" required />
            </Field>
            <Field label="Class" htmlFor="class_id">
              <Select id="class_id" name="class_id" defaultValue="">
                <option value="">Any class</option>
                {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Subject" htmlFor="subject_id">
              <Select id="subject_id" name="subject_id" defaultValue="">
                <option value="">Several subjects</option>
                {sortedSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}{mine.has(s.id) ? " (yours)" : ""}</option>)}
              </Select>
            </Field>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
