"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Check, X, Timer } from "lucide-react";

// Original sample questions written for this demo.
const samples = [
  {
    exam: "JAMB UTME", subject: "Mathematics",
    body: "If 3x − 7 = 11, what is the value of x?",
    options: ["4", "6", "9", "18"],
    answer: 1,
    explanation: "Add 7 to both sides to get 3x = 18, then divide both sides by 3: x = 6.",
  },
  {
    exam: "WAEC WASSCE", subject: "Biology",
    body: "Which part of a cell is the main site of aerobic respiration?",
    options: ["Nucleus", "Ribosome", "Mitochondrion", "Cell wall"],
    answer: 2,
    explanation: "Mitochondria use oxygen to release energy from glucose, which is why they are called the powerhouse of the cell.",
  },
  {
    exam: "JAMB UTME", subject: "Use of English",
    body: "Choose the word nearest in meaning to the word in capitals: The principal gave a CANDID account of the incident.",
    options: ["frank", "brief", "confusing", "dramatic"],
    answer: 0,
    explanation: "Candid means honest and direct, so frank is the closest meaning.",
  },
  {
    exam: "NECO SSCE", subject: "Economics",
    body: "The price of a good rises and the quantity people buy falls. Which idea does this illustrate?",
    options: ["The law of supply", "The law of demand", "Elasticity of supply", "Market equilibrium"],
    answer: 1,
    explanation: "The law of demand says that, other things being equal, a higher price leads to a lower quantity demanded.",
  },
];

const SECONDS = 45;

export function CbtDemo() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [left, setLeft] = useState(SECONDS);
  const q = samples[i];
  const done = picked !== null || left === 0;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [done, i]);

  function next() {
    setI((n) => (n + 1) % samples.length);
    setPicked(null);
    setLeft(SECONDS);
  }

  return (
    <div className="rounded-[1.75rem] bg-white p-5 text-ink shadow-pop md:p-7">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-xs font-semibold text-muted">Sample {q.exam} question, {i + 1} of {samples.length}</p>
          <p className="font-display text-lg font-bold">{q.subject}</p>
        </div>
        <p className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-sm font-bold tabular",
          left <= 10 && !done ? "bg-coral-100 text-coral-700" : "bg-wash text-adire-800")} aria-label={`${left} seconds left`}>
          <Timer className="size-4" aria-hidden="true" />00:{String(left).padStart(2, "0")}
        </p>
      </div>
      <p className="mt-5 text-[1.05rem] font-medium leading-relaxed">{q.body}</p>
      <ol className="mt-4 grid gap-2.5" aria-label="Options">
        {q.options.map((o, idx) => {
          const correct = idx === q.answer;
          const chosen = idx === picked;
          return (
            <li key={o}>
              <button type="button" disabled={done} onClick={() => setPicked(idx)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  !done && "border-line hover:border-adire-400 hover:bg-adire-50",
                  done && correct && "border-leaf-500 bg-leaf-100",
                  done && chosen && !correct && "border-coral-500 bg-coral-100",
                  done && !correct && !chosen && "border-line opacity-60",
                )}>
                <span className={clsx("grid size-7 shrink-0 place-items-center rounded-lg font-display text-sm font-bold",
                  done && correct ? "bg-leaf-500 text-white" : done && chosen ? "bg-coral-500 text-white" : "bg-wash text-adire-800")}>
                  {done && correct ? <Check className="size-4" /> : done && chosen ? <X className="size-4" /> : String.fromCharCode(65 + idx)}
                </span>
                <span>{o}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div aria-live="polite">
        {done && (
          <div className="mt-4 animate-fade-in rounded-xl bg-paper p-4 text-sm leading-relaxed">
            <p className="font-semibold">
              {picked === null ? "Time is up." : picked === q.answer ? "Correct." : `Not quite. The answer is ${String.fromCharCode(65 + q.answer)}.`}
            </p>
            <p className="mt-1 text-muted">{q.explanation}</p>
          </div>
        )}
      </div>
      <button type="button" onClick={next}
        className="mt-5 w-full rounded-xl border border-line py-2.5 text-sm font-semibold text-adire-800 hover:bg-adire-50">
        {done ? "Try another question" : "Skip this question"}
      </button>
    </div>
  );
}
