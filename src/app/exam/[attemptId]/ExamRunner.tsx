"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, ChevronLeft, ChevronRight, CircleAlert, Flag, LoaderCircle, Timer, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Field";

type Option = { id: string; body: string };
type Question = { id: string; type: "mcq" | "true_false" | "short_answer" | "essay"; body: string; topic: string | null; marks: number; options: Option[] };
type Answer = { selected_option_id: string | null; text_answer: string | null; is_correct?: boolean | null; correct_option_ids?: string[] | null; explanation?: string | null };
type Payload = {
  attempt: { id: string; status: string; expires_at: string; started_at: string };
  server_now: string;
  exam: { id: string; title: string; instructions: string | null; exam_type: string; exam_body: string | null; subject: string | null; duration_minutes: number };
  questions: Question[];
  answers: Record<string, Answer>;
};
type SaveState = "idle" | "saving" | "saved" | "error";

const clock = () => Date.now();

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return (h ? `${h}:${String(m).padStart(2, "0")}` : String(m).padStart(2, "0")) + ":" + String(r).padStart(2, "0");
}

export function ExamRunner({ initial }: { initial: Payload }) {
  const supabase = createClient();
  const router = useRouter();
  const practice = initial.exam.exam_type === "practice";
  const { questions } = initial;
  const offset = useMemo(() => new Date(initial.server_now).getTime() - clock(), [initial.server_now]);
  const deadline = new Date(initial.attempt.expires_at).getTime();

  const [answers, setAnswers] = useState<Record<string, Answer>>(initial.answers ?? {});
  const [index, setIndex] = useState(0);
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [left, setLeft] = useState(() => (deadline - (clock() + offset)) / 1000);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const submitted = useRef(false);

  const q = questions[index];
  const answered = (id: string) => {
    const a = answers[id];
    return !!a && (!!a.selected_option_id || !!a.text_answer?.trim());
  };
  const answeredCount = questions.filter((x) => answered(x.id)).length;

  const submit = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    await Promise.all(Object.values(timers.current).map((t) => clearTimeout(t)));
    const { error } = await supabase.rpc("submit_exam_attempt", { p_attempt: initial.attempt.id });
    if (error) {
      submitted.current = false;
      setSubmitting(false);
      setError(`We couldn't submit yet: ${error.message}. Check your connection and press Submit again.`);
      return;
    }
    router.replace(`/student/results/${initial.attempt.id}`);
  }, [initial.attempt.id, router, supabase]);

  useEffect(() => {
    const t = setInterval(() => {
      const remaining = (deadline - (clock() + offset)) / 1000;
      setLeft(remaining);
      if (remaining <= 0) submit();
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, offset, submit]);

  async function persist(questionId: string, optionId: string | null, text: string | null) {
    setSave("saving");
    const { data, error } = await supabase.rpc("save_answer", {
      p_attempt: initial.attempt.id, p_question: questionId, p_option: optionId, p_text: text,
    });
    if (error) {
      setSave("error");
      setError(error.message);
      return;
    }
    const res = data as { saved: boolean; expired?: boolean; is_correct?: boolean; correct_option_ids?: string[]; explanation?: string };
    if (res.expired) return submit();
    setError(null);
    setSave("saved");
    if (practice && res.is_correct !== undefined) {
      setAnswers((a) => ({ ...a, [questionId]: { ...a[questionId], is_correct: res.is_correct, correct_option_ids: res.correct_option_ids, explanation: res.explanation } }));
    }
  }

  function choose(optionId: string) {
    if (practice && answers[q.id]?.is_correct != null) return;
    setAnswers((a) => ({ ...a, [q.id]: { selected_option_id: optionId, text_answer: null } }));
    persist(q.id, optionId, null);
  }

  function type(text: string) {
    setAnswers((a) => ({ ...a, [q.id]: { selected_option_id: null, text_answer: text } }));
    clearTimeout(timers.current[q.id]);
    const id = q.id;
    setSave("saving");
    timers.current[id] = setTimeout(() => persist(id, null, text), 900);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT" || confirm) return;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "n") setIndex((i) => Math.min(questions.length - 1, i + 1));
      else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "p") setIndex((i) => Math.max(0, i - 1));
      else if (q?.options?.length) {
        const i = "abcdef".indexOf(e.key.toLowerCase());
        if (i >= 0 && q.options[i]) choose(q.options[i].id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!q) return <Notice tone="error">This examination has no questions.</Notice>;
  const a = answers[q.id];
  const checked = practice && a?.is_correct != null;
  const low = left <= 60;

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold">{initial.exam.title}</p>
            <p className="text-sm text-muted">{[initial.exam.subject, practice ? "Practice mode" : initial.exam.exam_type === "mock" ? "Timed mock" : null].filter(Boolean).join(", ")}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline" aria-live="polite">
              {save === "saving" ? <span className="inline-flex items-center gap-1"><LoaderCircle className="size-3.5 animate-spin" />Saving</span>
                : save === "saved" ? <span className="inline-flex items-center gap-1 text-leaf-700"><Check className="size-3.5" />Saved</span>
                : save === "error" ? <span className="text-coral-700">Not saved</span> : null}
            </span>
            <p role="timer" aria-label={`${fmt(left)} remaining`}
              className={clsx("inline-flex items-center gap-2 rounded-xl px-3.5 py-2 font-display text-lg font-bold tabular", low ? "bg-coral-500 text-white" : "bg-adire-700 text-white")}>
              <Timer className="size-4" aria-hidden="true" />{fmt(left)}
            </p>
            <Button variant="accent" onClick={() => setConfirm(true)} disabled={submitting}>Submit</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[1fr_17rem]">
        <section aria-labelledby="q-title" className="rounded-[1.25rem] border border-line bg-white p-5 md:p-8">
          {error && <div className="mb-5"><Notice tone="error">{error}</Notice></div>}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <p id="q-title" className="font-semibold text-ink">Question {index + 1} of {questions.length}</p>
            <p>{q.topic ? `${q.topic}, ` : ""}{q.marks} {Number(q.marks) === 1 ? "mark" : "marks"}</p>
          </div>
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{q.body}</p>

          {q.options.length > 0 ? (
            <ol className="mt-6 grid gap-2.5" aria-label="Answer options">
              {q.options.map((o, i) => {
                const chosen = a?.selected_option_id === o.id;
                const right = checked && a?.correct_option_ids?.includes(o.id);
                const wrong = checked && chosen && !right;
                return (
                  <li key={o.id}>
                    <button type="button" onClick={() => choose(o.id)} disabled={checked} aria-pressed={chosen}
                      className={clsx("flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-colors",
                        right ? "border-leaf-500 bg-leaf-100" : wrong ? "border-coral-500 bg-coral-100"
                          : chosen ? "border-adire-700 bg-adire-50" : "border-line hover:border-adire-300",
                        checked && !right && !wrong && "opacity-60")}>
                      <span className={clsx("grid size-8 shrink-0 place-items-center rounded-lg font-display font-bold",
                        right ? "bg-leaf-500 text-white" : wrong ? "bg-coral-500 text-white" : chosen ? "bg-adire-700 text-white" : "bg-wash text-adire-800")}>
                        {right ? <Check className="size-4" /> : wrong ? <X className="size-4" /> : String.fromCharCode(65 + i)}
                      </span>
                      <span>{o.body}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="mt-6">
              <label htmlFor="answer" className="text-sm font-semibold text-ink-soft">{q.type === "essay" ? "Your answer" : "Short answer"}</label>
              <textarea id="answer" value={a?.text_answer ?? ""} onChange={(e) => type(e.target.value)}
                rows={q.type === "essay" ? 10 : 2} maxLength={10000}
                className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 leading-relaxed focus:border-adire-500 focus:outline-none focus:ring-4 focus:ring-adire-100" />
              <p className="mt-1 text-xs text-muted">Your answer saves automatically as you type.</p>
            </div>
          )}

          {checked && (
            <div className={clsx("mt-5 animate-fade-in rounded-xl p-4", a?.is_correct ? "bg-leaf-100" : "bg-coral-100")}>
              <p className="font-semibold">{a?.is_correct ? "Correct." : "Not quite."}</p>
              {a?.explanation && <p className="mt-1 text-ink-soft">{a.explanation}</p>}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
              <ChevronLeft className="size-4" aria-hidden="true" />Previous
            </Button>
            <button type="button" onClick={() => setFlags((f) => { const n = new Set(f); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })}
              aria-pressed={flags.has(q.id)}
              className={clsx("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold", flags.has(q.id) ? "bg-sun-100 text-ink" : "text-muted hover:bg-wash")}>
              <Flag className="size-4" aria-hidden="true" />{flags.has(q.id) ? "Flagged for review" : "Flag for review"}
            </button>
            {index < questions.length - 1 ? (
              <Button onClick={() => setIndex((i) => i + 1)}>Next<ChevronRight className="size-4" aria-hidden="true" /></Button>
            ) : (
              <Button variant="accent" onClick={() => setConfirm(true)}>Finish</Button>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-[1.25rem] border border-line bg-white p-5 lg:sticky lg:top-24">
          <p className="font-semibold">Questions</p>
          <p className="text-sm text-muted">{answeredCount} of {questions.length} answered</p>
          <ol className="mt-4 grid grid-cols-6 gap-1.5 lg:grid-cols-5" aria-label="Jump to question">
            {questions.map((x, i) => (
              <li key={x.id}>
                <button type="button" onClick={() => setIndex(i)} aria-current={i === index ? "step" : undefined}
                  aria-label={`Question ${i + 1}${answered(x.id) ? ", answered" : ""}${flags.has(x.id) ? ", flagged" : ""}`}
                  className={clsx("relative grid aspect-square w-full place-items-center rounded-lg text-sm font-bold tabular",
                    i === index ? "ring-2 ring-adire-700 ring-offset-2" : "",
                    practice && answers[x.id]?.is_correct === true ? "bg-leaf-500 text-white"
                      : practice && answers[x.id]?.is_correct === false ? "bg-coral-500 text-white"
                      : answered(x.id) ? "bg-adire-700 text-white" : "bg-wash text-adire-800")}>
                  {i + 1}
                  {flags.has(x.id) && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-sun-400 ring-2 ring-white" />}
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted">Keys: A to D choose an answer, arrow keys move between questions.</p>
          {initial.exam.instructions && <p className="mt-4 border-t border-line pt-4 text-sm text-ink-soft">{initial.exam.instructions}</p>}
        </aside>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="w-full max-w-md animate-fade-in rounded-[1.5rem] bg-white p-6 shadow-pop">
            <h2 id="confirm-title" className="text-2xl font-bold">Submit your answers?</h2>
            <p className="mt-2 text-muted">You answered {answeredCount} of {questions.length} questions{flags.size ? ` and flagged ${flags.size} for review` : ""}. You can&apos;t change answers after submitting.</p>
            {answeredCount < questions.length && (
              <p className="mt-3 flex gap-2 rounded-xl bg-sun-100 p-3 text-sm"><CircleAlert className="size-4 shrink-0" aria-hidden="true" />Unanswered questions score zero.</p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirm(false)} disabled={submitting}>Keep working</Button>
              <Button variant="accent" onClick={submit} loading={submitting}>Submit answers</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
