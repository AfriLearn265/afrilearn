"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { CircleCheck, CircleX, RotateCcw, Star } from "lucide-react";
import { checkTopicQuiz, type QuizResult } from "@/app/student/topic-actions";
import { Spinner } from "@/components/ui/Button";
import { Mascot } from "@/components/brand/Mascot";

export type QuizQuestion = { id: string; prompt: string; options: string[] };

/** The quiz at the end of a topic. Answers are checked on the server; scores of 50% or more mark the topic done. */
export function TopicQuiz({ topicId, questions }: { topicId: string; questions: QuizQuestion[] }) {
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, start] = useTransition();
  const marked = result && !("error" in result) ? new Map(result.items.map((i) => [i.id, i])) : null;
  const allAnswered = questions.every((q) => picks[q.id] !== undefined);

  if (questions.length === 0) {
    return <p className="rounded-[1.4rem] bg-wash p-6 text-center text-ink-soft">The quiz for this topic is coming soon.</p>;
  }

  return (
    <div className="grid gap-5">
      {marked && result && !("error" in result) && (
        <div className="flex items-center gap-4 rounded-[1.6rem] border-2 border-ink bg-sun-100 p-5 shadow-[4px_5px_0_var(--color-ink)]">
          <Mascot pose={result.score * 2 >= result.total ? "cheer" : "wave"} prop={result.score === result.total ? "star" : "none"} className="w-24 shrink-0" />
          <div>
            <p className="font-display text-3xl font-semibold">{result.score} / {result.total}</p>
            <p className="text-ink-soft">
              {result.score === result.total ? "Perfect! You got every one right." : result.score * 2 >= result.total ? "Well done! Topic complete." : "Good try! Read the notes again, then have another go."}
            </p>
            {result.score * 2 >= result.total && <p className="mt-1 inline-flex items-center gap-1 font-display font-semibold text-sun-600"><Star className="size-4 fill-sun-400" aria-hidden="true" />+{result.score * 5} stars</p>}
          </div>
        </div>
      )}
      <ol className="grid gap-4">
        {questions.map((q, n) => {
          const m = marked?.get(q.id);
          return (
            <li key={q.id} className="rounded-[1.4rem] border-2 border-line bg-white p-4 sm:p-5">
              <p className="font-display text-lg font-semibold"><span className="text-grape-600">{n + 1}.</span> {q.prompt}</p>
              <div role="radiogroup" aria-label={`Question ${n + 1}`} className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, i) => {
                  const chosen = picks[q.id] === i;
                  const right = m && m.answer === i;
                  const wrong = m && chosen && !m.correct;
                  return (
                    <button key={i} type="button" role="radio" aria-checked={chosen} disabled={!!marked}
                      onClick={() => setPicks((p) => ({ ...p, [q.id]: i }))}
                      className={clsx("flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-colors",
                        right ? "border-leaf-500 bg-leaf-100" : wrong ? "border-coral-500 bg-coral-100" :
                        chosen ? "border-grape-600 bg-grape-50" : "border-line hover:border-grape-300")}>
                      <span className={clsx("grid size-7 shrink-0 place-items-center rounded-full border-2 font-display text-sm",
                        chosen ? "border-grape-600 bg-grape-600 text-white" : "border-line text-ink-soft")}>{String.fromCharCode(65 + i)}</span>
                      <span className="flex-1">{opt}</span>
                      {right && <CircleCheck className="size-5 text-leaf-700" aria-label="Correct answer" />}
                      {wrong && <CircleX className="size-5 text-coral-700" aria-label="Your answer" />}
                    </button>
                  );
                })}
              </div>
              {m?.explanation && <p className="mt-3 rounded-xl bg-wash px-4 py-2.5 text-sm text-ink-soft">{m.explanation}</p>}
            </li>
          );
        })}
      </ol>
      {result && "error" in result && <p role="alert" className="font-semibold text-coral-700">{result.error}</p>}
      <div className="flex flex-wrap gap-3">
        {!marked ? (
          <button type="button" disabled={!allAnswered || pending}
            onClick={() => start(async () => setResult(await checkTopicQuiz(topicId, picks)))}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-grape-600 px-7 font-display font-semibold text-white shadow-[0_4px_0_var(--color-grape-900)] transition-transform hover:-translate-y-px disabled:opacity-50">
            {pending && <Spinner />}{allAnswered ? "Check my answers" : `Answer all ${questions.length} questions`}
          </button>
        ) : (
          <button type="button" onClick={() => { setPicks({}); setResult(null); }}
            className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-line bg-white px-6 font-display font-semibold hover:border-grape-300">
            <RotateCcw className="size-4" aria-hidden="true" />Try again
          </button>
        )}
      </div>
    </div>
  );
}
