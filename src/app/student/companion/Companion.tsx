"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Markdown } from "@/components/app/Markdown";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Field";

type Msg = { role: "user" | "assistant"; content: string };
const modes = [
  ["ask", "Ask a question"], ["simpler", "Explain more simply"], ["example", "Show me an example"],
  ["practice", "Give me practice questions"], ["summary", "Summarise a topic"], ["revise", "What should I revise?"],
] as const;

export function Companion({ initial, configured, subjects }: { initial: Msg[]; configured: boolean; subjects: string[] }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<string>("ask");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, busy]);

  async function send() {
    const message = text.trim() || (mode === "simpler" && messages.length ? "Please explain your last answer more simply." : "");
    if (!message) return;
    setBusy(true);
    setError(null);
    setMessages((m) => [...m, { role: "user", content: message }]);
    setText("");
    const res = await fetch("/api/ai/companion", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, mode, subject, history: messages.slice(-8) }),
    });
    const json = await res.json().catch(() => ({ error: "The companion did not respond." }));
    setBusy(false);
    if (!res.ok) {
      setError(json.error);
      setMessages((m) => m.slice(0, -1));
      setText(message);
      return;
    }
    setLeft(json.remaining ?? null);
    setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
  }

  return (
    <div className="grid gap-4">
      {!configured && <Notice tone="warning" title="Not connected yet.">The learning companion needs an AI service key on the server. Your administrator can add one; until then questions can&apos;t be answered here.</Notice>}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="What do you need?">
        {modes.map(([v, label]) => (
          <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => setMode(v)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${mode === v ? "border-adire-700 bg-adire-700 text-white" : "border-line bg-white hover:border-adire-300"}`}>{label}</button>
        ))}
      </div>
      <div className="min-h-[22rem] rounded-[1.25rem] border border-line bg-white p-4 md:p-6" aria-live="polite">
        {messages.length === 0 && !busy && (
          <div className="grid place-items-center gap-2 py-16 text-center text-muted">
            <Sparkles className="size-8 text-adire-700" aria-hidden="true" />
            <p className="max-w-sm">Ask about anything you&apos;re learning. Answers are pitched at your class level, and nothing here is shared with other students.</p>
          </div>
        )}
        <ul className="grid gap-4">
          {messages.map((m, i) => (
            <li key={i} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-adire-700 px-4 py-3 text-white" : "max-w-[92%] rounded-2xl rounded-bl-md bg-wash px-4 py-3"}>
              {m.role === "user" ? <p className="whitespace-pre-line">{m.content}</p> : <Markdown source={m.content} />}
            </li>
          ))}
          {busy && <li className="max-w-[92%] animate-pulse rounded-2xl rounded-bl-md bg-wash px-4 py-3 text-muted">Thinking</li>}
        </ul>
        <div ref={end} />
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="grid gap-3 rounded-[1.25rem] border border-line bg-white p-3 md:grid-cols-[12rem_1fr_auto] md:items-end">
        <label className="sr-only" htmlFor="c-subject">Subject</label>
        <select id="c-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="h-11 rounded-xl border border-line bg-white px-3 text-sm">
          <option value="">Any subject</option>{subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
        <label className="sr-only" htmlFor="c-text">Your question</label>
        <textarea id="c-text" value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={2000} placeholder="e.g. Why does a balanced equation need the same number of atoms on both sides?"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          className="min-h-11 resize-none rounded-xl border border-line px-3.5 py-2.5 focus:border-adire-500 focus:outline-none focus:ring-4 focus:ring-adire-100" />
        <Button type="submit" loading={busy} disabled={!configured}><Send className="size-4" aria-hidden="true" />Send</Button>
      </form>
      {left !== null && <p className="text-xs text-muted">{left} questions left today.</p>}
    </div>
  );
}
