import Link from "next/link";
import clsx from "clsx";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Input, Select } from "@/components/ui/Field";
import { QuestionEditor } from "@/components/exam/QuestionEditor";
import { AiQuestionGenerator } from "@/components/exam/AiQuestionGenerator";
import { createBank, deleteQuestion } from "./actions";

export const metadata = { title: "Question banks" };

type Bank = { id: string; name: string; owner_id: string; is_shared: boolean; exam_body: string | null; subject_id: string | null; class_id: string | null;
  subjects: { name: string } | null; classes: { name: string } | null; questions: { count: number }[] };
type Q = { id: string; question_type: string; body: string; topic: string | null; marks: number; difficulty: string; answer_options: { id: string; body: string; sort_order: number }[];
  question_answer_keys: { correct_option_ids: string[]; explanation: string | null } | null };

const typeLabel: Record<string, string> = { mcq: "Multiple choice", true_false: "True or false", short_answer: "Short answer", essay: "Theory" };

export default async function QuestionBanks({ searchParams }: { searchParams: Promise<{ bank?: string }> }) {
  const { userId } = await requireRole("teacher");
  const { bank: bankId } = await searchParams;
  const supabase = await createClient();
  const [{ data: banksData }, { data: subjects }, { data: classes }] = await Promise.all([
    supabase.from("question_banks").select("id, name, owner_id, is_shared, exam_body, subject_id, class_id, subjects(name), classes(name), questions(count)").order("created_at", { ascending: false }),
    supabase.from("subjects").select("id, name").eq("is_active", true).order("name"),
    supabase.from("classes").select("id, name").eq("is_active", true).order("sort_order"),
  ]);
  const banks = (banksData ?? []) as unknown as Bank[];
  const current = banks.find((b) => b.id === bankId) ?? null;
  const mine = current?.owner_id === userId;
  const { data: qData } = current
    ? await supabase.from("questions").select("id, question_type, body, topic, marks, difficulty, answer_options(id, body, sort_order), question_answer_keys(correct_option_ids, explanation)")
        .eq("bank_id", current.id).order("created_at", { ascending: false })
    : { data: [] };
  const questions = (qData ?? []) as unknown as Q[];

  return (
    <>
      <PageHeader title="Question banks" intro="Write questions once and reuse them in tests and examinations. Shared banks also feed the practice quizzes for every pupil." />
      <div className="grid gap-6 lg:grid-cols-[19rem_1fr]">
        <div className="grid content-start gap-6">
          <Panel title="Banks">
            {banks.length === 0 ? <p className="text-sm text-muted">No banks yet.</p> : (
              <ul className="grid gap-1">
                {banks.map((b) => (
                  <li key={b.id}>
                    <Link href={`/teacher/questions?bank=${b.id}`} className={clsx("block rounded-xl px-3 py-2.5", b.id === current?.id ? "bg-adire-700 text-white" : "hover:bg-wash")}>
                      <span className="block font-semibold leading-tight">{b.name}</span>
                      <span className={clsx("text-xs", b.id === current?.id ? "text-adire-100" : "text-muted")}>
                        {b.questions?.[0]?.count ?? 0} questions{b.subjects ? `, ${b.subjects.name}` : ""}{b.is_shared ? ", shared" : ""}{b.owner_id !== userId ? ", by a colleague" : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="New bank">
            <ActionForm action={createBank} submitLabel="Create bank" pendingLabel="Creating">
              <Field label="Name" htmlFor="bname"><Input id="bname" name="name" placeholder="SS2 Biology: Ecology" /></Field>
              <Field label="Subject" htmlFor="bsubject">
                <Select id="bsubject" name="subject_id" defaultValue=""><option value="">Choose</option>{(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
              </Field>
              <Field label="Class" htmlFor="bclass">
                <Select id="bclass" name="class_id" defaultValue=""><option value="">Any class</option>{(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
              </Field>
              <input type="hidden" name="exam_body" value="" />
              <Field label="Source" htmlFor="bsrc" hint="Only original or licensed questions">
                <Input id="bsrc" name="source_license" defaultValue="Original content" />
              </Field>
              <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" name="is_shared" className="mt-0.5 size-4 accent-adire-700" />Share with other teachers and the practice quizzes</label>
            </ActionForm>
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          {!current ? (
            <EmptyState title="Choose or create a bank.">Questions in a bank can be added to any of your tests in a few clicks.</EmptyState>
          ) : (
            <>
              {mine && (
                <Panel title={`Add a question to ${current.name}`}>
                  <QuestionEditor bankId={current.id} subjectId={current.subject_id} classId={current.class_id} examBody={current.exam_body} />
                  <AiQuestionGenerator bankId={current.id} subjectId={current.subject_id} classId={current.class_id} examBody={current.exam_body}
                    subjectName={current.subjects?.name ?? null} className={current.classes?.name ?? current.exam_body ?? null} />
                </Panel>
              )}
              <Panel title={`${questions.length} question${questions.length === 1 ? "" : "s"}`}>
                {questions.length === 0 ? <p className="text-sm text-muted">This bank is empty.</p> : (
                  <ol className="divide-y divide-line">
                    {questions.map((q, i) => {
                      const correct = new Set(q.question_answer_keys?.correct_option_ids ?? []);
                      return (
                        <li key={q.id} className="py-4">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium"><span className="mr-2 text-muted tabular">{questions.length - i}.</span>{q.body}</p>
                            {mine && (
                              <form action={async (fd) => { "use server"; await deleteQuestion(fd); }}>
                                <input type="hidden" name="id" value={q.id} />
                                <button type="submit" className="text-sm font-semibold text-coral-700 hover:underline">Delete</button>
                              </form>
                            )}
                          </div>
                          {q.answer_options.length > 0 && (
                            <ul className="mt-2 flex flex-wrap gap-1.5 text-sm">
                              {[...q.answer_options].sort((a, b) => a.sort_order - b.sort_order).map((o) => (
                                <li key={o.id} className={clsx("rounded-full px-2.5 py-0.5", correct.has(o.id) ? "bg-leaf-100 font-semibold text-leaf-700" : "bg-wash text-ink-soft")}>{o.body}</li>
                              ))}
                            </ul>
                          )}
                          <p className="mt-2 text-xs text-muted">{typeLabel[q.question_type]}, {Number(q.marks)} mark{Number(q.marks) === 1 ? "" : "s"}, {q.difficulty}{q.topic ? `, ${q.topic}` : ""}</p>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </Panel>
            </>
          )}
        </div>
      </div>
    </>
  );
}
