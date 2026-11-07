"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, CircleCheck, CircleX, Lock, Play, Timer } from "lucide-react";
import { Mascot, Sparkle } from "@/components/brand/Mascot";
import { SubjectArt } from "@/components/brand/SubjectArt";
import { FREE_LIMIT, englishQuestions, mathsQuestions, type FreeQuestion } from "@/config/freePlay";

type Game = "english" | "maths" | "sprint";

const games: { key: Game; title: string; blurb: string; art: string; tone: string }[] = [
  { key: "english", title: "English quiz", blurb: "Spelling, plurals and grammar", art: "english", tone: "bg-sky-400" },
  { key: "maths", title: "Maths quiz", blurb: "Sums, fractions and naira", art: "mathematics", tone: "bg-tangerine-400" },
  { key: "sprint", title: "Number sprint", blurb: "How many in 30 seconds?", art: "sprint", tone: "bg-lime-400" },
];

function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Free games on the homepage. Visitors play a few questions with instant feedback, then sign up to see
 * their score and carry on. Nothing is saved for visitors; it all runs in the browser.
 */
export function PlayArcade() {
  const [game, setGame] = useState<Game>("maths");
  const [round, setRound] = useState(0);
  return (
    <div className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-7">
      <div role="tablist" aria-label="Choose a game" className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1">
        {games.map((g) => (
          <button key={g.key} type="button" role="tab" aria-selected={game === g.key} onClick={() => { setGame(g.key); setRound((r) => r + 1); }}
            className={clsx("flex flex-col items-center gap-2 rounded-[1.4rem] border-2 p-2.5 text-center transition sm:flex-row sm:text-left lg:pr-4",
              game === g.key ? "border-ink bg-white shadow-[3px_4px_0_var(--color-ink)]" : "border-line bg-white/70 hover:border-grape-300")}>
            <span className={clsx("grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink sm:size-16", g.tone)}>
              {g.art === "sprint" ? <Timer className="size-7 text-ink sm:size-8" aria-hidden="true" /> : <SubjectArt code={g.art} className="h-10 w-auto sm:h-11" />}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[0.95rem] font-semibold leading-tight sm:text-lg">{g.title}</span>
              <span className="hidden text-sm text-muted sm:block">{g.blurb}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="sticker relative min-h-[23rem] overflow-hidden rounded-[1.75rem] bg-white sm:min-h-[25rem] sm:rounded-[2rem]">
        {game === "sprint" ? <Sprint key={`s${round}`} /> : <Quiz key={`${game}${round}`} bank={game === "english" ? englishQuestions : mathsQuestions} label={game === "english" ? "English" : "Maths"} />}
      </div>
    </div>
  );
}

function Quiz({ bank, label }: { bank: FreeQuestion[]; label: string }) {
  const [questions, setQuestions] = useState<FreeQuestion[] | null>(null);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);

  if (!questions) {
    return (
      <Intro title={`${label} quiz`} text={`${FREE_LIMIT} free questions for Primary pupils. Tap an answer to see if you're right.`}
        onStart={() => setQuestions(shuffle(bank).slice(0, 8))} />
    );
  }
  if (at >= FREE_LIMIT) return <Gate answered={FREE_LIMIT} right={right} remaining={questions.length - FREE_LIMIT} />;

  const q = questions[at];
  const answer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setRight((r) => r + 1);
    window.setTimeout(() => { setPicked(null); setAt((n) => n + 1); }, 1100);
  };

  return (
    <div className="flex h-full flex-col p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-grape-600">{label} · Question {at + 1}</p>
        <ol className="flex gap-1.5" aria-label={`Question ${at + 1} of ${questions.length}`}>
          {questions.map((_, i) => (
            <li key={i} className={clsx("h-2.5 rounded-full", i < at ? "w-2.5 bg-grape-600" : i === at ? "w-6 bg-sun-400" : i < FREE_LIMIT ? "w-2.5 bg-grape-200" : "w-2.5 bg-line")} />
          ))}
        </ol>
      </div>
      <p className="mt-5 font-display text-[1.7rem] font-semibold leading-tight sm:mt-6 sm:text-4xl">{q.q}</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {q.options.map((opt, i) => {
          const isRight = picked !== null && i === q.answer;
          const isWrong = picked === i && i !== q.answer;
          return (
            <button key={opt} type="button" onClick={() => answer(i)} disabled={picked !== null}
              className={clsx("flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 font-display text-xl font-semibold transition",
                isRight ? "border-leaf-500 bg-leaf-100 text-leaf-700" : isWrong ? "border-coral-500 bg-coral-100 text-coral-700" :
                "border-ink bg-white shadow-[0_4px_0_var(--color-ink)] hover:-translate-y-0.5 hover:bg-sun-100 active:translate-y-1 active:shadow-none disabled:hover:translate-y-0")}>
              {opt}
              {isRight && <CircleCheck className="size-5" aria-label="Correct" />}
              {isWrong && <CircleX className="size-5" aria-label="Not quite" />}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="mt-5 min-h-7 font-display text-lg font-semibold">
        {picked === null ? "" : picked === q.answer ? "Correct! Well done." : "Not quite. Keep going!"}
      </p>
      <Mascot pose={picked !== null && picked === q.answer ? "cheer" : "wave"} className="pointer-events-none absolute -bottom-4 -right-4 hidden w-36 opacity-95 sm:block" />
    </div>
  );
}

function Sprint() {
  const [state, setState] = useState<"intro" | "play" | "done">("intro");
  const [left, setLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState<{ text: string; options: number[]; answer: number } | null>(null);
  const [flash, setFlash] = useState<"right" | "wrong" | null>(null);
  const timer = useRef<number | null>(null);

  const next = useCallback(() => {
    const plus = Math.random() < 0.6;
    const a = 2 + Math.floor(Math.random() * 18);
    const b = 1 + Math.floor(Math.random() * (plus ? 15 : a - 1));
    const answer = plus ? a + b : a - b;
    const options = shuffle([answer, answer + (Math.random() < 0.5 ? 1 : 2), Math.max(0, answer - (Math.random() < 0.5 ? 1 : 3))]);
    setQ({ text: `${a} ${plus ? "+" : "−"} ${b}`, options: [...new Set(options)].length === 3 ? options : shuffle([answer, answer + 1, answer + 3]), answer });
  }, []);

  useEffect(() => {
    if (state !== "play") return;
    timer.current = window.setInterval(() => setLeft((s) => {
      if (s <= 1) { setState("done"); return 0; }
      return s - 1;
    }), 1000);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [state]);

  if (state === "intro") {
    return <Intro title="Number sprint" text="Add and take away as fast as you can. You have 30 seconds. Ready?" onStart={() => { next(); setScore(0); setLeft(30); setState("play"); }} />;
  }
  if (state === "done") return <Gate answered={score} right={score} sprint />;
  return (
    <div className="flex h-full flex-col items-center justify-center p-5 text-center sm:p-8">
      <p className="inline-flex items-center gap-2 rounded-full bg-lime-100 px-4 py-1.5 font-display font-semibold text-lime-600"><Timer className="size-4" aria-hidden="true" />{left}s · {score} right</p>
      <p className={clsx("mt-6 font-display text-6xl font-semibold tabular transition-colors sm:text-7xl", flash === "right" ? "text-leaf-500" : flash === "wrong" ? "text-coral-500" : "text-ink")}>{q?.text} = ?</p>
      <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-3">
        {q?.options.map((n) => (
          <button key={n} type="button" onClick={() => {
            const ok = n === q.answer;
            if (ok) setScore((s) => s + 1);
            setFlash(ok ? "right" : "wrong");
            window.setTimeout(() => setFlash(null), 250);
            next();
          }} className="h-16 rounded-2xl border-2 border-ink bg-white font-display text-3xl font-semibold shadow-[0_4px_0_var(--color-ink)] transition hover:-translate-y-0.5 hover:bg-lime-100 active:translate-y-1 active:shadow-none">
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function Intro({ title, text, onStart }: { title: string; text: string; onStart: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center sm:p-10">
      <Mascot pose="wave" prop="book" className="w-36" />
      <p className="font-display text-3xl font-semibold">{title}</p>
      <p className="max-w-sm text-ink-soft">{text}</p>
      <button type="button" onClick={onStart}
        className="mt-2 inline-flex h-14 items-center gap-2 rounded-full border-2 border-ink bg-sun-400 px-8 font-display text-lg font-semibold shadow-[0_4px_0_var(--color-ink)] transition hover:-translate-y-px active:translate-y-1 active:shadow-none">
        <Play className="size-5 fill-ink" aria-hidden="true" />Play free
      </button>
      <p className="text-xs text-muted">No sign-up needed to start.</p>
    </div>
  );
}

function Gate({ answered, right, remaining, sprint }: { answered: number; right: number; remaining?: number; sprint?: boolean }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden bg-[radial-gradient(120%_120%_at_50%_0%,var(--color-grape-600),var(--color-grape-900))] p-6 text-center text-white sm:p-10">
      <Sparkle className="absolute left-8 top-8 size-8" />
      <Sparkle className="absolute bottom-10 right-10 size-6" color="#FF6BAA" />
      <Mascot pose="cheer" prop="star" className="w-32" />
      {sprint ? (
        <p className="font-display text-3xl font-semibold">{right} right in 30 seconds!</p>
      ) : (
        <p className="font-display text-3xl font-semibold">You&apos;re on a roll!</p>
      )}
      <p className="max-w-md text-grape-100">
        {sprint
          ? "Sign up free to save your score, beat it tomorrow and unlock every game."
          : <>You answered {answered} questions. <span className="font-semibold text-white">Sign up free to see your score</span>{remaining ? ` and finish the last ${remaining}` : ""}, then carry on with lessons for your class.</>}
      </p>
      <div className="mt-3 grid w-full max-w-sm gap-3 sm:flex sm:justify-center">
        <Link href="/signup" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-sun-400 px-6 font-display font-semibold text-ink shadow-[0_4px_0_var(--color-ink)] transition hover:-translate-y-px">
          <Lock className="size-4" aria-hidden="true" />See my score<ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full border-2 border-white/40 px-6 font-display font-semibold hover:border-white hover:bg-white/10">I have an account</Link>
      </div>
    </div>
  );
}
