import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, pct } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { ButtonLink } from "@/components/ui/Button";
import { addQuestions, removeQuestion, setPublished } from "../actions";

export const metadata = { title: "Examination" };

type EQ = { sort_order: number; questions: { id: string; body: string; question_type: string; marks: number; topic: string | null } | null };
type Attempt = { id: string; status: string; percentage: number | null; submitted_at: string | null; needs_manual_grading: boolean; students: { profiles: { full_name: string } | null } | null };
type BankQ = { id: string; body: string; question_type: string; marks: number; topic: string | null; question_banks: { name: string } | null };

export default async function ExamBuilder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ topic?: string }> }) {
  await requireRole("teacher");
  const { id } = await params;
  const { topic } = await searchParams;
  const supabase = await createClient();
  const { data: exam } = await supabase.from("examinations")
    .select("id, title, exam_type, is_published, duration_minutes, max_attempts, pass_mark, instructions, available_from, available_until, subject_id, classrooms(name), subjects(name)")
    .eq("id", id).maybeSingle();
  if (!exam) notFound();

  let bankQuery = supabase.from("questions").select("id, body, question_type, marks, topic, question_banks(name)").order("created_at", { ascending: false }).limit(80);
  if (exam.subject_id) bankQuery = bankQuery.eq("subject_id", exam.subject_id);
  if (topic) bankQuery = bankQuery.ilike("topic", `%${topic}%`);
  const [{ data: eqs }, { data: attempts }, { data: bank }] = await Promise.all([
    supabase.from("exam_questions").select("sort_order, questions(id, body, question_type, marks, topic)").eq("exam_id", id).order("sort_order"),
    supabase.from("exam_attempts").select("id, status, percentage, submitted_at, needs_manual_grading, students(profiles(full_name))").eq("exam_id", id).order("submitted_at", { ascending: false }),
    bankQuery,
  ]);
  const inExam = ((eqs ?? []) as unknown as EQ[]).map((e) => e.questions).filter((q): q is NonNullable<EQ["questions"]> => !!q);
  const inIds = new Set(inExam.map((q) => q.id));
  const available = ((bank ?? []) as unknown as BankQ[]).filter((q) => !inIds.has(q.id));
  const total = inExam.reduce((n, q) => n + Number(q.marks), 0);
  const list = (attempts ?? []) as unknown as Attempt[];
  const toMark = list.filter((a) => a.needs_manual_grading).length;
  const room = exam.classrooms as unknown as { name: string } | null;

  return (
    <>
      <PageHeader title={exam.title}
        intro={`${room?.name ?? ""}, ${exam.duration_minutes} minutes, pass mark ${Number(exam.pass_mark)}%${exam.available_until ? `, closes ${formatDateTime(exam.available_until)}` : ""}.`}
        actions={
          <ActionForm action={setPublished} submitLabel={exam.is_published ? "Unpublish" : "Publish to classroom"} variant={exam.is_published ? "outline" : "accent"} resetOnSuccess={false}>
            <input type="hidden" name="exam_id" value={exam.id} /><input type="hidden" name="publish" value={exam.is_published ? "0" : "1"} />
          </ActionForm>
        } />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title={`Paper: ${inExam.length} questions, ${total} marks`}>
            {inExam.length === 0 ? <EmptyState title="No questions yet.">Tick questions from your banks on the right, or <Link className="font-semibold text-adire-700" href="/teacher/questions">write new ones</Link>.</EmptyState> : (
              <ol className="divide-y divide-line">
                {inExam.map((q, i) => (
                  <li key={q.id} className="flex items-start gap-3 py-3">
                    <span className="w-6 shrink-0 font-display font-bold text-muted tabular">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p>{q.body}</p>
                      <p className="text-xs text-muted">{q.question_type.replace("_", " ")}, {Number(q.marks)} marks{q.topic ? `, ${q.topic}` : ""}</p>
                    </div>
                    {!exam.is_published && (
                      <form action={removeQuestion}>
                        <input type="hidden" name="exam_id" value={exam.id} /><input type="hidden" name="question_id" value={q.id} />
                        <button type="submit" className="text-sm font-semibold text-coral-700 hover:underline">Remove</button>
                      </form>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
          <Panel title={`Attempts (${list.length})`} action={toMark ? <span className="rounded-full bg-sun-100 px-3 py-1 text-sm font-semibold">{toMark} to mark</span> : null}>
            {list.length === 0 ? <p className="text-sm text-muted">No one has taken this yet.</p> : (
              <ul className="divide-y divide-line">
                {list.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div><p className="font-semibold">{a.students?.profiles?.full_name}</p><p className="text-muted">{a.submitted_at ? formatDateTime(a.submitted_at) : "In progress"}</p></div>
                    {a.status === "in_progress" ? <span className="text-muted">Writing now</span>
                      : <ButtonLink href={`/teacher/attempts/${a.id}`} size="sm" variant={a.needs_manual_grading ? "accent" : "outline"}>{a.needs_manual_grading ? "Mark theory" : pct(a.percentage)}</ButtonLink>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <Panel title="Add from your question banks">
          {exam.is_published ? <p className="text-sm text-muted">Unpublish the examination to change its questions.</p> : (
            <>
              <form className="mb-4 flex gap-2" action={`/teacher/exams/${exam.id}`}>
                <label htmlFor="topic" className="sr-only">Filter by topic</label>
                <input id="topic" name="topic" defaultValue={topic} placeholder="Filter by topic" className="h-10 flex-1 rounded-xl border border-line px-3 text-sm" />
                <button type="submit" className="rounded-xl border border-line px-3 text-sm font-semibold hover:bg-wash">Filter</button>
              </form>
              {available.length === 0 ? <p className="text-sm text-muted">No more questions {exam.subjects ? `for ${(exam.subjects as unknown as { name: string }).name} ` : ""}in your banks. <Link href="/teacher/questions" className="font-semibold text-adire-700">Write some</Link>.</p> : (
                <ActionForm action={addQuestions} submitLabel="Add ticked questions" pendingLabel="Adding">
                  <input type="hidden" name="exam_id" value={exam.id} />
                  <ul className="grid max-h-[32rem] gap-1 overflow-y-auto pr-1">
                    {available.map((q) => (
                      <li key={q.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2.5 hover:bg-wash">
                          <input type="checkbox" name="question_id" value={q.id} className="mt-1 size-4 accent-adire-700" />
                          <span className="text-sm"><span className="block">{q.body}</span><span className="text-xs text-muted">{q.question_banks?.name}, {q.question_type.replace("_", " ")}, {Number(q.marks)} marks{q.topic ? `, ${q.topic}` : ""}</span></span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </ActionForm>
              )}
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
