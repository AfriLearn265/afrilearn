"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";

export function GradeAnswer({ attemptId, questionId, max, current, feedback }: {
  attemptId: string; questionId: string; max: number; current: number | null; feedback: string | null;
}) {
  const router = useRouter();
  const [marks, setMarks] = useState(current?.toString() ?? "");
  const [note, setNote] = useState(feedback ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function save() {
    const value = Number(marks);
    if (marks === "" || Number.isNaN(value) || value < 0 || value > max) {
      setMsg({ ok: false, text: `Enter a mark between 0 and ${max}.` });
      return;
    }
    start(async () => {
      const { error } = await createClient().rpc("grade_answer", { p_attempt: attemptId, p_question: questionId, p_marks: value, p_feedback: note || null });
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Mark saved." });
      if (!error) router.refresh();
    });
  }

  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-adire-200 bg-adire-50/60 p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
      <div>
        <label htmlFor={`m-${questionId}`} className="text-sm font-semibold text-ink-soft">Marks (of {max})</label>
        <Input id={`m-${questionId}`} type="number" min={0} max={max} step={0.5} value={marks} onChange={(e) => setMarks(e.target.value)} className="mt-1" />
      </div>
      <div>
        <label htmlFor={`f-${questionId}`} className="text-sm font-semibold text-ink-soft">Comment for the student</label>
        <Textarea id={`f-${questionId}`} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 min-h-11" rows={1} />
      </div>
      <Button onClick={save} loading={pending}>Save mark</Button>
      {msg && <p className={`text-sm sm:col-span-3 ${msg.ok ? "text-leaf-700" : "text-coral-700"}`}>{msg.text}</p>}
    </div>
  );
}
