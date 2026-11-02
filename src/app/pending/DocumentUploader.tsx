"use client";

import { useRef, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Field";

const ACCEPT = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX = 10 * 1024 * 1024;

function storagePath(userId: string, fileName: string) {
  const safe = fileName.replace(/[^\w.-]+/g, "-").slice(-80);
  return `${userId}/${Date.now()}-${safe}`;
}

export function DocumentUploader({ userId, initial }: { userId: string; initial: string[] }) {
  const [paths, setPaths] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function save(next: string[]) {
    const { error } = await supabase.from("teachers").update({ document_paths: next }).eq("profile_id", userId);
    if (error) throw new Error("We saved the file but couldn't attach it to your application. Try again.");
    setPaths(next);
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      const added: string[] = [];
      for (const file of Array.from(files)) {
        if (!ACCEPT.includes(file.type)) throw new Error(`${file.name} is not a PDF or image.`);
        if (file.size > MAX) throw new Error(`${file.name} is larger than 10 MB.`);
        const path = storagePath(userId, file.name);
        const { error } = await supabase.storage.from("teacher-documents").upload(path, file, { contentType: file.type });
        if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);
        added.push(path);
      }
      await save([...paths, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(path: string) {
    setBusy(true);
    setError(null);
    try {
      await supabase.storage.from("teacher-documents").remove([path]);
      await save(paths.filter((p) => p !== path));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove the file.");
    } finally {
      setBusy(false);
    }
  }

  async function open(path: string) {
    const { data, error } = await supabase.storage.from("teacher-documents").createSignedUrl(path, 120);
    if (error || !data) return setError("Could not open that file.");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <div className="mt-4 grid gap-3">
      {error && <Notice tone="error">{error}</Notice>}
      {paths.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {paths.map((p) => (
            <li key={p} className="flex items-center gap-3 px-4 py-3">
              <FileText className="size-5 text-adire-700" aria-hidden="true" />
              <button type="button" onClick={() => open(p)} className="min-w-0 flex-1 truncate text-left font-medium hover:underline">
                {p.split("/").pop()?.replace(/^\d+-/, "")}
              </button>
              <button type="button" onClick={() => remove(p)} disabled={busy} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-coral-100 hover:text-coral-700" aria-label="Remove file">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input ref={input} type="file" accept={ACCEPT.join(",")} multiple className="sr-only" id="docs" onChange={(e) => upload(e.target.files)} />
      <Button type="button" variant="outline" loading={busy} onClick={() => input.current?.click()} className="justify-self-start">
        {!busy && <Upload className="size-4" aria-hidden="true" />}{busy ? "Uploading" : "Upload documents"}
      </Button>
    </div>
  );
}
