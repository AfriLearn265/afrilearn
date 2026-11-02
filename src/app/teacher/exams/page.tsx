import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { createExam } from "./actions";

export const metadata = { title: "Examinations" };

type Exam = { id: string; title: string; exam_type: string; is_published: boolean; duration_minutes: number;
  classrooms: { name: string } | null; exam_questions: { count: number }[]; exam_attempts: { count: number }[] };

export default async function TeacherExams() {
  const { userId } = await requireRole("teacher");
  const supabase = await createClient();
  const [{ data }, { data: rooms }] = await Promise.all([
    supabase.from("examinations").select("id, title, exam_type, is_published, duration_minutes, classrooms(name), exam_questions(count), exam_attempts(count)")
      .eq("created_by", userId).is("owner_student_id", null).order("created_at", { ascending: false }),
    supabase.from("classrooms").select("id, name").eq("teacher_id", userId).eq("is_archived", false).order("name"),
  ]);
  const exams = (data ?? []) as unknown as Exam[];
  const check = (name: string, label: string, on = true) => (
    <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name={name} defaultChecked={on} className="size-4 accent-adire-700" />{label}</label>
  );

  return (
    <>
      <PageHeader title="Tests and examinations" intro="Build a paper from your question banks, choose how it is marked, then publish it to a classroom." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Your examinations">
          {exams.length === 0 ? <EmptyState title="No examinations yet.">Create one on the right. You will add questions on the next screen.</EmptyState> : (
            <ul className="divide-y divide-line">
              {exams.map((e) => (
                <li key={e.id}>
                  <Link href={`/teacher/exams/${e.id}`} className="flex flex-wrap items-center gap-3 py-3.5 hover:opacity-80">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{e.title}</p>
                      <p className="text-sm text-muted">{e.classrooms?.name}, {e.exam_questions?.[0]?.count ?? 0} questions, {e.duration_minutes} min, {e.exam_attempts?.[0]?.count ?? 0} attempts</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${e.is_published ? "bg-leaf-100 text-leaf-700" : "bg-wash text-muted"}`}>{e.is_published ? "Published" : "Draft"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="New examination">
          {(rooms ?? []).length === 0 ? (
            <EmptyState title="Create a classroom first.">Examinations are set for a classroom.</EmptyState>
          ) : (
            <ActionForm action={createExam} submitLabel="Create and add questions" pendingLabel="Creating" resetOnSuccess={false}>
              <Field label="Title" htmlFor="title"><Input id="title" name="title" placeholder="First term test: Algebra" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Classroom" htmlFor="classroom_id">
                  <Select id="classroom_id" name="classroom_id" defaultValue="">{[<option key="" value="" disabled>Choose</option>, ...(rooms ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)]}</Select>
                </Field>
                <Field label="Type" htmlFor="exam_type">
                  <Select id="exam_type" name="exam_type" defaultValue="test">
                    <option value="test">Class test</option><option value="exam">Examination</option><option value="mock">Mock examination</option><option value="practice">Practice (instant feedback)</option>
                  </Select>
                </Field>
                <Field label="Duration (minutes)" htmlFor="duration_minutes"><Input id="duration_minutes" name="duration_minutes" type="number" min={1} max={600} defaultValue={30} /></Field>
                <Field label="Attempts allowed" htmlFor="max_attempts">
                  <Select id="max_attempts" name="max_attempts" defaultValue="1"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="">Unlimited</option></Select>
                </Field>
                <Field label="Pass mark (%)" htmlFor="pass_mark"><Input id="pass_mark" name="pass_mark" type="number" min={0} max={100} defaultValue={50} /></Field>
                <div />
                <Field label="Opens" htmlFor="available_from" hint="Optional, Lagos time"><Input id="available_from" name="available_from" type="datetime-local" /></Field>
                <Field label="Closes" htmlFor="available_until" hint="Optional"><Input id="available_until" name="available_until" type="datetime-local" /></Field>
              </div>
              <Field label="Instructions" htmlFor="instructions"><Textarea id="instructions" name="instructions" rows={2} placeholder="Answer all questions. Show working for theory questions." /></Field>
              <div className="grid gap-2">
                {check("randomize_questions", "Shuffle question order for each student")}
                {check("randomize_options", "Shuffle answer options")}
                {check("show_results_immediately", "Show the score as soon as a student submits")}
                {check("show_explanations", "Show correct answers and explanations in the review")}
              </div>
            </ActionForm>
          )}
        </Panel>
      </div>
    </>
  );
}
