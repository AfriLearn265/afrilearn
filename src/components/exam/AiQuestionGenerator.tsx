"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice, Select } from "@/components/ui/Field";

type Draft = { body: string; options: string[]; correct: number; explanation: string; saved?: boolean };

export function AiQuestionGenerator({ bankId, subjectId, classId, examBody, subjectName, className }: {
  bankId: string; subjectId: string | null; classId: string | null; examBody: string | null; subjectName: string | null; className: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/ai/questions", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject: subjectName, level: className, topic, count: Number(count), difficulty }),
    });
    const json = await res.json().catch(() => ({ error: "The AI service did not respond." }));
    setBusy(false);
    if (!res.ok) return setError(json.error);
    setDrafts(json.questions);
  }

  async function add(i: number) {
    const d = drafts[i];
    const { error } = await createClient().rpc("upsert_question", {
      p: {
        bank_id: bankId, subject_id: subjectId, class_id: classId, exam_body: examBody, question_type: "mcq",
        body: d.body, topic, marks: 1, difficulty, explanation: d.explanation, source_license: "Original, AI-assisted and teacher-reviewed",
        options: d.options.map((o, j) => ({ body: o, is_correct: j === d.correct })),
      },
    });
    if (error) return setError(error.message);
    setDrafts((xs) => xs.map((x, j) => (j === i ? { ...x, saved: true } : x)));
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-dashed border-adire-300 px-4 py-2.5 text-sm font-semibold text-adire-700 hover:bg-adire-50">
        <Sparkles className="size-4" aria-hidden="true" />Draft questions with AI
      </button>
    );
  }

  return (
    <div className="mt-6 grid gap-4 rounded-2xl border border-adire-200 bg-adire-50/50 p-5">
      <p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-adire-700" aria-hidden="true" />Draft questions with AI</p>
      <p className="text-sm text-muted">Drafts are never saved automatically. Check each one, then add the ones you approve.</p>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem_9rem_auto] sm:items-end">
        <Field label="Topic" htmlFor="ai-topic"><Input id="ai-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Photosynthesis" /></Field>
        <Field label="How many" htmlFor="ai-count"><Select id="ai-count" value={count} onChange={(e) => setCount(e.target.value)}>{[3, 5, 8, 10].map((n) => <option key={n}>{n}</option>)}</Select></Field>
        <Field label="Difficulty" htmlFor="ai-diff"><Select id="ai-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select></Field>
        <Button onClick={generate} loading={busy} disabled={!topic.trim()}>{busy ? "Drafting" : "Draft"}</Button>
      </div>
      {drafts.length > 0 && (
        <ol className="grid gap-3">
          {drafts.map((d, i) => (
            <li key={i} className="rounded-xl border border-line bg-white p-4 text-sm">
              <p className="font-medium">{d.body}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {d.options.map((o, j) => <li key={j} className={`rounded-full px-2.5 py-0.5 ${j === d.correct ? "bg-leaf-100 font-semibold text-leaf-700" : "bg-wash"}`}>{o}</li>)}
              </ul>
              <p className="mt-2 text-muted">{d.explanation}</p>
              <div className="mt-3">
                {d.saved ? <p className="font-semibold text-leaf-700">Added to the bank</p> : <Button size="sm" variant="outline" onClick={() => add(i)}>Add to bank</Button>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
