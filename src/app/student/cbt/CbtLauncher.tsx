"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { startPractice } from "../exam-actions";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Select } from "@/components/ui/Field";

export type CatalogueRow = { exam_body: string | null; subject_id: string; subject_name: string; topic: string; question_count: number };


export function CbtLauncher({ rows }: { rows: CatalogueRow[]; initialBody?: string }) {
  const [subject, setSubject] = useState("");
  const [mode, setMode] = useState<"practice" | "mock">("practice");
  const scoped = rows;
  const subjects = useMemo(() => {
    const m = new Map<string, { id: string; name: string; n: number }>();
    scoped.forEach((r) => {
      const s = m.get(r.subject_id) ?? { id: r.subject_id, name: r.subject_name, n: 0 };
      s.n += Number(r.question_count);
      m.set(r.subject_id, s);
    });
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [scoped]);
  const topics = scoped.filter((r) => r.subject_id === subject);
  const available = subjects.find((s) => s.id === subject)?.n ?? 0;

  return (
    <ActionForm action={startPractice} submitLabel={mode === "mock" ? "Start the challenge" : "Start practising"} pendingLabel="Making your quiz" resetOnSuccess={false} variant="accent">
      <input type="hidden" name="exam_body" value="" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject" htmlFor="subject_id">
          <Select id="subject_id" name="subject_id" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="" disabled>Choose a subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.n})</option>)}
          </Select>
        </Field>
        <Field label="Topic" htmlFor="topic" hint="Optional">
          <Select id="topic" name="topic" defaultValue="" disabled={!subject}>
            <option value="">All topics</option>
            {topics.map((t) => <option key={t.topic} value={t.topic}>{t.topic} ({t.question_count})</option>)}
          </Select>
        </Field>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-soft">Mode</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {([["practice", "Practice", "See the answer and a short explanation after each question."], ["mock", "Timed challenge", "Beat the clock. Marked when you finish."]] as const).map(([v, t, d]) => (
            <label key={v} className="cursor-pointer">
              <input type="radio" name="mode" value={v} checked={mode === v} onChange={() => setMode(v)} className="peer sr-only" />
              <span className={clsx("block h-full rounded-2xl border-2 p-3.5 peer-checked:border-adire-700 peer-checked:bg-adire-50 peer-focus-visible:ring-4 peer-focus-visible:ring-sun-300", "border-line")}>
                <span className="block font-semibold">{t}</span><span className="text-sm text-muted">{d}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Questions" htmlFor="count" hint={subject ? `${available} available` : undefined}>
          <Select id="count" name="count" defaultValue="10">
            {[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} questions</option>)}
          </Select>
        </Field>
        <Field label="Time allowed" htmlFor="minutes">
          <Select id="minutes" name="minutes" defaultValue="10">
            {[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} minutes</option>)}
          </Select>
        </Field>
      </div>
    </ActionForm>
  );
}
