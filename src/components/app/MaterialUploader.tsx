"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { recordMaterial } from "@/app/teacher/courses/actions";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Field";

const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.mp3,.png,.jpg,.jpeg,.webp,.txt";
const MAX_MB = 50;

function uploadPath(userId: string, scope: string, name: string) {
  return `${userId}/${scope}/${Date.now()}-${name.replace(/[^\w.-]+/g, "-").slice(-80)}`;
}

/** Uploads PDFs, slides, Word documents, videos or images to private storage and records them. */
export function MaterialUploader({ userId, scope, courseId, lessonId, classroomId, subjectId, classId, category, audience, label = "Upload materials" }: {
  userId: string; scope: string; courseId?: string | null; lessonId?: string | null; classroomId?: string | null;
  subjectId?: string | null; classId?: string | null; category?: string; audience?: string; label?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_MB * 1024 * 1024) throw new Error(`${file.name} is larger than ${MAX_MB} MB.`);
        const path = uploadPath(userId, scope, file.name);
        const { error } = await supabase.storage.from("materials").upload(path, file, { contentType: file.type || undefined });
        if (error) throw new Error(`${file.name}: ${error.message}`);
        const r = await recordMaterial({ title: file.name.replace(/\.[^.]+$/, ""), path, mime: file.type, size: file.size, courseId, lessonId, classroomId, subjectId, classId, category, audience });
        if (r.error) throw new Error(r.error);
      }
      setMsg({ ok: true, text: `${files.length} file${files.length === 1 ? "" : "s"} uploaded.` });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      {msg && <Notice tone={msg.ok ? "success" : "error"}>{msg.text}</Notice>}
      <input ref={input} type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => upload(e.target.files)} aria-label={label} />
      <Button type="button" variant="outline" onClick={() => input.current?.click()} loading={busy} className="justify-self-start">
        {!busy && <Upload className="size-4" aria-hidden="true" />}{busy ? "Uploading" : label}
      </Button>
      <p className="text-xs text-muted">PDF, Word, PowerPoint, video, audio or images, up to {MAX_MB} MB each.</p>
    </div>
  );
}
