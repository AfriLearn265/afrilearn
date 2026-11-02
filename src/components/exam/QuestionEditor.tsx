"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui/Field";

type Opt = { id?: string; body: string; is_correct: boolean };
export type EditableQuestion = {
  id?: string; question_type: string; body: string; topic: string; marks: number; difficulty: string;
  explanation: string; options: Opt[]; accepted_answers: string[];
};

const blank: EditableQuestion = {
  question_type: "mcq", body: "", topic: "", marks: 1, difficulty: "medium", explanation: "",
  options: [{ body: "", is_correct: true }, { body: "", is_correct: false }, { body: "", is_correct: false }, { body: "", is_correct: false }],
  accepted_answers: [],
};

export function QuestionEditor({ bankId, subjectId, classId, examBody, initial, onDone }: {
  bankId: string; subjectId: string | null; classId: string | null; examBody: string | null;
  initial?: EditableQuestion; onDone?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState<EditableQuestion>(initial ?? blank);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof EditableQuestion>(k: K, v: EditableQuestion[K]) => setQ((x) => ({ ...x, [k]: v }));

  function changeType(t: string) {
    if (t === "true_false") set("options", [{ body: "True", is_correct: true }, { body: "False", is_correct: false }]);
    if (t === "mcq" && q.question_type === "true_false") set("options", blank.options);
    set("question_type", t);
  }

  function save() {
    const options = q.options.filter((o) => o.body.trim());
    if (!q.body.trim()) return setMsg({ ok: false, text: "Write the question." });
    if ((q.question_type === "mcq" || q.question_type === "true_false") && (options.length < 2 || !options.some((o) => o.is_correct))) {
      return setMsg({ ok: false, text: "Add at least two options and mark the correct one." });
    }
    start(async () => {
      const { error } = await createClient().rpc("upsert_question", {
        p: {
          id: q.id ?? null, bank_id: bankId, subject_id: subjectId, class_id: classId, exam_body: examBody,
          question_type: q.question_type, body: q.body, topic: q.topic, marks: q.marks, difficulty: q.difficulty,
          explanation: q.explanation, options, accepted_answers: q.accepted_answers,
        },
      });
      if (error) return setMsg({ ok: false, text: error.message });
      setMsg({ ok: true, text: q.id ? "Question updated." : "Question added to the bank." });
      if (!q.id) setQ({ ...blank, topic: q.topic, marks: q.marks, difficulty: q.difficulty });
      router.refresh();
      onDone?.();
    });
  }

  const objective = q.question_type === "mcq" || q.question_type === "true_false";
  return (
    <div className="grid gap-4">
      {msg && <Notice tone={msg.ok ? "success" : "error"}>{msg.text}</Notice>}
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Type" htmlFor="qtype" className="sm:col-span-2">
          <Select id="qtype" value={q.question_type} onChange={(e) => changeType(e.target.value)}>
            <option value="mcq">Multiple choice</option>
            <option value="true_false">True or false</option>
            <option value="short_answer">Short answer (auto-marked)</option>
            <option value="essay">Theory or essay (you mark it)</option>
          </Select>
        </Field>
        <Field label="Marks" htmlFor="qmarks">
          <Input id="qmarks" type="number" min={0.5} step={0.5} value={q.marks} onChange={(e) => set("marks", Number(e.target.value))} />
        </Field>
        <Field label="Difficulty" htmlFor="qdiff">
          <Select id="qdiff" value={q.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </Select>
        </Field>
      </div>
      <Field label="Question" htmlFor="qbody">
        <Textarea id="qbody" value={q.body} onChange={(e) => set("body", e.target.value)} rows={3} />
      </Field>
      <Field label="Topic" htmlFor="qtopic" hint="Used for mastery reports">
        <Input id="qtopic" value={q.topic} onChange={(e) => set("topic", e.target.value)} placeholder="e.g. Simultaneous equations" />
      </Field>

      {objective && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink-soft">Options <span className="font-normal text-muted">select the correct answer</span></legend>
          <ul className="grid gap-2">
            {q.options.map((o, i) => (
              <li key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={o.is_correct} aria-label={`Option ${String.fromCharCode(65 + i)} is correct`}
                  onChange={() => set("options", q.options.map((x, j) => ({ ...x, is_correct: j === i })))} className="size-4 accent-leaf-500" />
                <span className="w-5 font-display font-bold text-muted">{String.fromCharCode(65 + i)}</span>
                <Input value={o.body} readOnly={q.question_type === "true_false"} aria-label={`Option ${String.fromCharCode(65 + i)}`}
                  onChange={(e) => set("options", q.options.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
                {q.question_type === "mcq" && q.options.length > 2 && (
                  <button type="button" onClick={() => set("options", q.options.filter((_, j) => j !== i))} className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-coral-100 hover:text-coral-700" aria-label="Remove option">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {q.question_type === "mcq" && q.options.length < 6 && (
            <button type="button" onClick={() => set("options", [...q.options, { body: "", is_correct: false }])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-adire-700">
              <Plus className="size-4" />Add option
            </button>
          )}
        </fieldset>
      )}
      {q.question_type === "short_answer" && (
        <Field label="Accepted answers" htmlFor="qacc" hint="Separate with commas; matching ignores capital letters">
          <Input id="qacc" value={q.accepted_answers.join(", ")} onChange={(e) => set("accepted_answers", e.target.value.split(",").map((s) => s.trim()))} placeholder="1/2, half, 0.5" />
        </Field>
      )}
      <Field label="Explanation" htmlFor="qexp" hint="Shown to students after they answer">
        <Textarea id="qexp" value={q.explanation} onChange={(e) => set("explanation", e.target.value)} rows={2} />
      </Field>
      <div className="flex gap-2">
        <Button onClick={save} loading={pending}>{q.id ? "Save changes" : "Add question"}</Button>
        {onDone && <Button variant="ghost" onClick={onDone}>Cancel</Button>}
      </div>
    </div>
  );
}
