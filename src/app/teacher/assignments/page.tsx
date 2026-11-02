import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { createAssignment } from "./actions";

export const metadata = { title: "Assignments" };

type A = { id: string; title: string; due_at: string; total_marks: number; classrooms: { name: string; enrollments: { count: number }[] } | null; assignment_submissions: { status: string }[] };
const types = ["pdf", "docx", "doc", "pptx", "jpg", "jpeg", "png", "txt"];

export default async function TeacherAssignments({ searchParams }: { searchParams: Promise<{ classroom?: string }> }) {
  const { userId } = await requireRole("teacher");
  const { classroom } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("assignments").select("id, title, due_at, total_marks, classrooms(name, enrollments(count)), assignment_submissions(status)").eq("teacher_id", userId).order("due_at", { ascending: false });
  if (classroom) q = q.eq("classroom_id", classroom);
  const [{ data }, { data: rooms }] = await Promise.all([q, supabase.from("classrooms").select("id, name").eq("teacher_id", userId).eq("is_archived", false).order("name")]);
  const list = (data ?? []) as unknown as A[];

  return (
    <>
      <PageHeader title="Assignments" intro="Set work with a deadline and accepted file types. Late hand-ins are flagged automatically using the server's clock." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Your assignments">
          {list.length === 0 ? <EmptyState title="No assignments yet." /> : (
            <ul className="divide-y divide-line">
              {list.map((a) => {
                const subs = a.assignment_submissions ?? [];
                const toGrade = subs.filter((s) => s.status !== "graded").length;
                const size = a.classrooms?.enrollments?.[0]?.count ?? 0;
                return (
                  <li key={a.id}><Link href={`/teacher/assignments/${a.id}`} className="flex flex-wrap items-center gap-3 py-3.5 hover:opacity-80">
                    <span className="min-w-0 flex-1"><span className="block font-semibold">{a.title}</span><span className="text-sm text-muted">{a.classrooms?.name}, due {formatDateTime(a.due_at)}, {subs.length}/{size} handed in</span></span>
                    {toGrade > 0 && <span className="rounded-full bg-sun-100 px-2.5 py-1 text-xs font-bold">{toGrade} to grade</span>}
                  </Link></li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="New assignment">
          {(rooms ?? []).length === 0 ? <EmptyState title="Create a classroom first." /> : (
            <ActionForm action={createAssignment} submitLabel="Create assignment" pendingLabel="Creating" resetOnSuccess={false}>
              <Field label="Title" htmlFor="title"><Input id="title" name="title" placeholder="Essay: My community" /></Field>
              <Field label="Classroom" htmlFor="classroom_id">
                <Select id="classroom_id" name="classroom_id" defaultValue={classroom ?? ""}>{[<option key="" value="" disabled>Choose</option>, ...(rooms ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)]}</Select>
              </Field>
              <Field label="Description" htmlFor="description"><Textarea id="description" name="description" rows={3} /></Field>
              <Field label="Instructions" htmlFor="instructions" hint="How to answer and hand in"><Textarea id="instructions" name="instructions" rows={2} /></Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Deadline" htmlFor="due_at" className="sm:col-span-2"><Input id="due_at" name="due_at" type="datetime-local" /></Field>
                <Field label="Marks" htmlFor="total_marks"><Input id="total_marks" name="total_marks" type="number" min={1} defaultValue={20} /></Field>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-ink-soft">Accepted files</legend>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <label key={t} className="cursor-pointer">
                      <input type="checkbox" name="accepted_file_types" value={t} defaultChecked={["pdf", "docx", "jpg", "jpeg", "png"].includes(t)} className="peer sr-only" />
                      <span className="inline-flex rounded-full border border-line px-3 py-1 text-sm uppercase peer-checked:border-adire-700 peer-checked:bg-adire-700 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-sun-300">{t}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Largest file (MB)" htmlFor="max_file_mb"><Input id="max_file_mb" name="max_file_mb" type="number" min={1} max={50} defaultValue={10} /></Field>
                <label className="flex items-center gap-2.5 self-end pb-3 text-sm"><input type="checkbox" name="allow_late" defaultChecked className="size-4 accent-adire-700" />Accept late hand-ins</label>
              </div>
            </ActionForm>
          )}
        </Panel>
      </div>
    </>
  );
}
