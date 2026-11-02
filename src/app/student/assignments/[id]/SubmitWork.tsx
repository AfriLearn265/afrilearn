"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Paperclip, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Notice, Textarea } from "@/components/ui/Field";

function submissionPath(userId: string, assignmentId: string, name: string) {
  return `${userId}/${assignmentId}/${Date.now()}-${name.replace(/[^\w.-]+/g, "-").slice(-80)}`;
}

export function SubmitWork({ userId, assignmentId, accepted, maxMb, existing, existingText, resubmit }: {
  userId: string; assignmentId: string; accepted: string[]; maxMb: number; existing: string[]; existingText: string | null; resubmit: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [keep, setKeep] = useState<string[]>(existing);
  const [text, setText] = useState(existingText ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function pick(list: FileList | null) {
    if (!list) return;
    const bad = Array.from(list).find((f) => !accepted.includes(f.name.split(".").pop()?.toLowerCase() ?? "") || f.size > maxMb * 1024 * 1024);
    if (bad) return setMsg({ ok: false, text: `${bad.name} isn't allowed. Use ${accepted.join(", ")} files up to ${maxMb} MB.` });
    setMsg(null);
    setFiles((f) => [...f, ...Array.from(list)].slice(0, 5 - keep.length));
    if (input.current) input.current.value = "";
  }

  async function submit() {
    if (files.length === 0 && keep.length === 0 && !text.trim()) return setMsg({ ok: false, text: "Attach a file or type your answer first." });
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      const uploaded: string[] = [];
      for (const f of files) {
        const path = submissionPath(userId, assignmentId, f.name);
        const { error } = await supabase.storage.from("submissions").upload(path, f, { contentType: f.type || undefined });
        if (error) throw new Error(`${f.name}: ${error.message}`);
        uploaded.push(path);
      }
      const { data, error } = await supabase.rpc("submit_assignment", { p_assignment: assignmentId, p_files: [...keep, ...uploaded], p_text: text || null });
      if (error) throw new Error(error.message);
      setFiles([]);
      setMsg({ ok: true, text: (data as { status: string }).status === "late" ? "Handed in after the deadline. Your teacher will see it marked late." : "Handed in. Your teacher has been notified." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Submission failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      {msg && <Notice tone={msg.ok ? "success" : "error"}>{msg.text}</Notice>}
      <div>
        <label htmlFor="answer-text" className="text-sm font-semibold text-ink-soft">Written answer <span className="font-normal text-muted">optional</span></label>
        <Textarea id="answer-text" value={text} onChange={(e) => setText(e.target.value)} rows={5} className="mt-1.5" />
      </div>
      {(keep.length > 0 || files.length > 0) && (
        <ul className="grid gap-2 text-sm">
          {keep.map((p) => (
            <li key={p} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
              <FileText className="size-4 text-adire-700" aria-hidden="true" />
              <a href={`/api/files/submissions?path=${encodeURIComponent(p)}`} target="_blank" className="flex-1 truncate hover:underline">{p.split("/").pop()?.replace(/^\d+-/, "")}</a>
              <button type="button" onClick={() => setKeep((k) => k.filter((x) => x !== p))} aria-label="Remove file" className="text-muted hover:text-coral-700"><X className="size-4" /></button>
            </li>
          ))}
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 rounded-xl border border-dashed border-adire-300 px-3 py-2">
              <Paperclip className="size-4 text-adire-700" aria-hidden="true" /><span className="flex-1 truncate">{f.name}</span>
              <button type="button" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} aria-label="Remove file" className="text-muted hover:text-coral-700"><X className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <input ref={input} type="file" multiple accept={accepted.map((a) => `.${a}`).join(",")} className="sr-only" onChange={(e) => pick(e.target.files)} aria-label="Attach files" />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={busy || keep.length + files.length >= 5}><Paperclip className="size-4" aria-hidden="true" />Attach files</Button>
        <Button type="button" variant="accent" onClick={submit} loading={busy}>{busy ? "Handing in" : resubmit ? "Update submission" : "Hand in"}</Button>
      </div>
      <p className="text-xs text-muted">Allowed: {accepted.join(", ")}. Up to 5 files, {maxMb} MB each. On a slow connection, keep this page open until it says handed in.</p>
    </div>
  );
}
