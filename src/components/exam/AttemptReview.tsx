import clsx from "clsx";
import { Check, CircleDashed, X } from "lucide-react";
import { formatDateTime, pct } from "@/lib/format";
import { GradeAnswer } from "./GradeAnswer";

export type ReviewQuestion = {
  id: string; type: string; body: string; topic: string | null; marks: number;
  options: { id: string; body: string; is_correct: boolean | null }[];
  selected_option_id: string | null; text_answer: string | null; is_correct: boolean | null;
  awarded_marks: number | null; feedback: string | null; accepted_answers: string[] | null; explanation: string | null;
};
export type Review = {
  exam: { id: string; title: string; exam_type: string; exam_body: string | null; pass_mark: number; subject: string | null };
  attempt: { id: string; status: string; score: number | null; max_score: number | null; percentage: number | null; submitted_at: string | null;
    started_at: string; needs_manual_grading: boolean; student_name: string; grade: string | null };
  can_grade: boolean;
  questions: ReviewQuestion[];
};

export function AttemptReview({ review, showStudent }: { review: Review; showStudent?: boolean }) {
  const { exam, attempt, questions } = review;
  const pending = attempt.status !== "graded";
  const passed = attempt.percentage != null && Number(attempt.percentage) >= Number(exam.pass_mark);
  const correct = questions.filter((q) => q.is_correct).length;

  const topics = Object.values(questions.reduce<Record<string, { topic: string; total: number; right: number }>>((acc, q) => {
    const k = q.topic ?? "General";
    acc[k] ??= { topic: k, total: 0, right: 0 };
    acc[k].total += 1;
    if (q.is_correct) acc[k].right += 1;
    return acc;
  }, {})).sort((a, b) => a.right / a.total - b.right / b.total);

  return (
    <div className="grid gap-6">
      <section className={clsx("grid gap-6 rounded-[1.5rem] p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8",
        pending ? "bg-sun-100" : passed ? "bg-adire-700 text-white" : "bg-white border border-line")}>
        <div className={clsx("grid size-32 place-items-center rounded-full border-[10px] text-center",
          pending ? "border-sun-400" : passed ? "border-sun-400" : "border-coral-500")}>
          <div>
            <p className="font-display text-3xl font-bold tabular">{pending ? "…" : pct(attempt.percentage)}</p>
            {!pending && attempt.grade && <p className="text-sm font-semibold opacity-80">{attempt.grade}</p>}
          </div>
        </div>
        <div>
          {showStudent && <p className="text-sm opacity-80">{attempt.student_name}</p>}
          <h1 className="text-3xl font-bold">{exam.title}</h1>
          <p className="mt-2 opacity-85">
            {pending
              ? "Some answers are waiting for your teacher to mark. Your final score appears here once they are done."
              : `${Number(attempt.score)} of ${Number(attempt.max_score)} marks, ${correct} of ${questions.length} questions correct. ${passed ? "You passed." : `The pass mark is ${Number(exam.pass_mark)}%.`}`}
          </p>
          {attempt.submitted_at && <p className="mt-1 text-sm opacity-70">Submitted {formatDateTime(attempt.submitted_at)}</p>}
        </div>
      </section>

      {topics.length > 1 && (
        <section className="rounded-[1.25rem] border border-line bg-white p-5 md:p-6">
          <h2 className="font-sans text-lg font-semibold tracking-normal">By topic</h2>
          <ul className="mt-4 grid gap-3">
            {topics.map((t) => {
              const p = Math.round((t.right / t.total) * 100);
              return (
                <li key={t.topic} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
                  <span className="truncate font-medium">{t.topic}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-wash" aria-hidden="true">
                    <span className={clsx("block h-full rounded-full", p >= 70 ? "bg-leaf-500" : p >= 50 ? "bg-sun-400" : "bg-coral-500")} style={{ width: `${p}%` }} />
                  </span>
                  <span className="tabular text-muted">{t.right}/{t.total} {p >= 70 ? "mastered" : "revise"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ol className="grid gap-4">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-[1.25rem] border border-line bg-white p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-semibold">Question {i + 1}{q.topic ? <span className="font-normal text-muted">, {q.topic}</span> : null}</p>
              <p className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold",
                q.awarded_marks == null ? "bg-sun-100 text-ink" : q.is_correct ? "bg-leaf-100 text-leaf-700" : "bg-coral-100 text-coral-700")}>
                {q.awarded_marks == null ? <CircleDashed className="size-3.5" /> : q.is_correct ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                {q.awarded_marks == null ? "To be marked" : `${Number(q.awarded_marks)} / ${Number(q.marks)}`}
              </p>
            </div>
            <p className="mt-3 whitespace-pre-line leading-relaxed">{q.body}</p>
            {q.options.length > 0 ? (
              <ul className="mt-4 grid gap-2">
                {q.options.map((o) => {
                  const chosen = o.id === q.selected_option_id;
                  return (
                    <li key={o.id} className={clsx("flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm",
                      o.is_correct ? "border-leaf-500 bg-leaf-100" : chosen ? "border-coral-500 bg-coral-100" : "border-line")}>
                      <span className="flex-1">{o.body}</span>
                      {chosen && <span className="text-xs font-semibold">Your answer</span>}
                      {o.is_correct && <span className="text-xs font-semibold text-leaf-700">Correct answer</span>}
                    </li>
                  );
                })}
                {!q.selected_option_id && <li className="text-sm text-muted">Not answered.</li>}
              </ul>
            ) : (
              <div className="mt-4 rounded-xl bg-paper p-4 text-sm">
                <p className="font-semibold text-muted">Answer</p>
                <p className="mt-1 whitespace-pre-line">{q.text_answer?.trim() || "Not answered."}</p>
                {q.accepted_answers && q.accepted_answers.length > 0 && <p className="mt-2 text-muted">Accepted: {q.accepted_answers.join(", ")}</p>}
              </div>
            )}
            {q.explanation && <p className="mt-3 rounded-xl bg-adire-50 p-3 text-sm"><strong>Explanation.</strong> {q.explanation}</p>}
            {q.feedback && <p className="mt-3 rounded-xl bg-sun-100 p-3 text-sm"><strong>Teacher&apos;s comment.</strong> {q.feedback}</p>}
            {review.can_grade && q.options.length === 0 && (
              <GradeAnswer attemptId={attempt.id} questionId={q.id} max={Number(q.marks)} current={q.awarded_marks} feedback={q.feedback} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
