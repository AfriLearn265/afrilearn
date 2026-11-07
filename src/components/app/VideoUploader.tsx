"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";
import { createClassVideo, startProtectedUpload } from "@/app/videos-actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui/Field";

export type UploaderClass = { id: string; name: string; subjects: { id: string; name: string }[] };
export type UploaderTopic = { id: string; class_id: string; subject_id: string; term: number; title: string };

const STORAGE_MAX_MB = 50;
const PROTECTED_MAX_MB = 2048;
const TYPES: Record<string, string> = { mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime" };
const TERMS = ["", "First term", "Second term", "Third term"];

/** Reads the length of a video file and grabs a frame for its poster, in the browser, before uploading. */
async function inspect(file: File): Promise<{ duration: number | null; poster: Blob | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    let duration: number | null = null;
    const done = (poster: Blob | null) => { URL.revokeObjectURL(url); resolve({ duration, poster }); };
    const timer = window.setTimeout(() => done(null), 8000);
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      duration = Number.isFinite(v.duration) ? v.duration : null;
      v.currentTime = Math.min(2, (duration ?? 4) / 3);
    };
    v.onseeked = () => {
      const w = 640;
      const h = Math.round((v.videoHeight / Math.max(1, v.videoWidth)) * w) || 360;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(v, 0, 0, w, h);
      canvas.toBlob((b) => { window.clearTimeout(timer); done(b); }, "image/jpeg", 0.82);
    };
    v.onerror = () => { window.clearTimeout(timer); done(null); };
    v.src = url;
  });
}

/** Uploads straight to private storage with a progress bar (the server never has to hold the file). */
function putFile(path: string, body: Blob, type: string, token: string, onProgress?: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/class-videos/${path.split("/").map(encodeURIComponent).join("/")}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
    xhr.setRequestHeader("Content-Type", type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = `Upload failed (${xhr.status}).`;
      try { msg = JSON.parse(xhr.responseText).message ?? msg; } catch { /* keep the generic message */ }
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("The connection dropped during the upload. Check your internet and try again."));
    xhr.send(body);
  });
}

/** Sends the file straight to VdoCipher's encrypted storage using the one-off slot the server asked for. */
function postProtected(payload: Record<string, string>, file: File, onProgress?: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const { uploadLink, ...fields } = payload;
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    fd.append("success_action_status", "201");
    fd.append("success_action_redirect", "");
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadLink);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}). Try again.`)));
    xhr.onerror = () => reject(new Error("The connection dropped during the upload. Check your internet and try again."));
    xhr.send(fd);
  });
}

/**
 * Adds a lesson video for a class and topic. With protected hosting switched on, the file goes straight to
 * VdoCipher (encrypted, can't be downloaded); until then it goes to private storage and plays through a
 * short-lived link. YouTube links are no longer accepted, because YouTube videos can be downloaded.
 */
export function VideoUploader({ userId, classes, topics, defaultClassId, protectedHosting }: {
  userId: string; classes: UploaderClass[]; topics: UploaderTopic[]; defaultClassId?: string; protectedHosting: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const MAX_MB = protectedHosting ? PROTECTED_MAX_MB : STORAGE_MAX_MB;
  const [classId, setClassId] = useState(defaultClassId ?? classes[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const subjects = useMemo(() => classes.find((c) => c.id === classId)?.subjects ?? [], [classes, classId]);
  const classTopics = useMemo(() => topics.filter((t) => t.class_id === classId && (!subjectId || t.subject_id === subjectId)), [topics, classId, subjectId]);

  function pick(f: File | null) {
    setMsg(null);
    if (!f) return setFile(null);
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!TYPES[ext] && !f.type.startsWith("video/")) return setMsg({ ok: false, text: "Choose an MP4, WebM or MOV video file." });
    if (f.size > MAX_MB * 1024 * 1024) {
      return setMsg({ ok: false, text: `${f.name} is ${(f.size / 1048576).toFixed(0)} MB. Videos can be up to ${MAX_MB} MB, so trim or compress it first.` });
    }
    setFile(f);
  }

  async function submit(form: HTMLFormElement) {
    const fd = new FormData(form);
    setMsg(null);
    setBusy(true);
    try {
      const base = {
        classId, subjectId: subjectId || null, topicId: String(fd.get("topic_id") ?? "") || null,
        title: String(fd.get("title") ?? ""), description: String(fd.get("description") ?? "") || null,
      };
      if (base.title.trim().length < 2) throw new Error("Give the video a short title.");
      if (!file) throw new Error("Choose a video file to upload.");
      const { data } = await createClient().auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Your session has ended. Log in again, then upload.");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
      const type = file.type || TYPES[ext] || "video/mp4";
      const stem = `${userId}/${classId}/${Date.now()}-${file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(-60)}`;
      const info = await inspect(file);
      let thumb: string | null = null;
      if (info.poster) {
        await putFile(`${stem}.jpg`, info.poster, "image/jpeg", token).then(() => { thumb = `${stem}.jpg`; }, () => null);
      }
      let result: { error?: string; id?: string };
      setProgress(0);
      if (protectedHosting) {
        const slot = await startProtectedUpload(base.title);
        if (!slot.ticket) throw new Error(slot.error ?? "The video service didn't answer. Try again.");
        await postProtected(slot.ticket.clientPayload, file, setProgress);
        result = await createClassVideo({ ...base, source: "vdocipher", providerVideoId: slot.ticket.videoId, thumbnailPath: thumb, durationSeconds: info.duration, fileSize: file.size });
      } else {
        await putFile(`${stem}.${ext}`, file, type, token, setProgress);
        result = await createClassVideo({ ...base, source: "upload", storagePath: `${stem}.${ext}`, thumbnailPath: thumb, durationSeconds: info.duration, fileSize: file.size });
      }
      if (result.error) throw new Error(result.error);
      form.reset();
      setFile(null);
      setMsg({ ok: true, text: "Video added. Pupils in this class can watch it now, and they have been told about it." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong. Try again." });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(e.currentTarget); }} className="grid gap-5" noValidate>
      {msg && <Notice tone={msg.ok ? "success" : "error"}>{msg.text}</Notice>}
      <p className="flex items-start gap-2 rounded-2xl bg-leaf-100 px-4 py-3 text-sm text-leaf-700">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {protectedHosting
          ? "Videos are encrypted on our protected video server. Pupils can watch them here, but can't download or share them."
          : "Videos are kept in private storage and play through a link that expires, with no download button."}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Class" htmlFor="v-class">
          <Select id="v-class" value={classId} onChange={(e) => { setClassId(e.target.value); setSubjectId(""); }} required>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Subject" htmlFor="v-subject" hint="Optional">
          <Select id="v-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Any subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Topic" htmlFor="v-topic" hint="Pupils find the video on this topic's page" className="sm:col-span-2">
          <Select id="v-topic" name="topic_id" defaultValue="" key={`${classId}-${subjectId}`}>
            <option value="">{classTopics.length ? "Not linked to a topic" : "No topics for this class and subject yet"}</option>
            {[1, 2, 3].map((term) => {
              const list = classTopics.filter((t) => t.term === term);
              return list.length ? (
                <optgroup key={term} label={TERMS[term]}>
                  {list.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </optgroup>
              ) : null;
            })}
          </Select>
        </Field>
        <Field label="Title" htmlFor="v-title" className="sm:col-span-2">
          <Input id="v-title" name="title" maxLength={140} required placeholder="e.g. Adding fractions with the same denominator" />
        </Field>
        <Field label="What pupils should look out for" htmlFor="v-desc" hint="Optional" className="sm:col-span-2">
          <Textarea id="v-desc" name="description" rows={2} maxLength={2000} placeholder="Watch before Thursday's live class. Pause at 2:30 and try the question yourself." />
        </Field>
      </div>

      <div>
        <input ref={fileInput} type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.m4v,.webm,.mov" className="sr-only" aria-label="Video file"
          onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <button type="button" onClick={() => fileInput.current?.click()} disabled={busy}
          className="grid w-full place-items-center gap-2 rounded-[1.4rem] border-2 border-dashed border-grape-300 bg-grape-50 px-4 py-8 text-center transition-colors hover:border-grape-500 hover:bg-grape-100">
          <UploadCloud className="size-9 text-grape-600" aria-hidden="true" />
          <span className="font-display text-lg font-semibold">{file ? file.name : "Choose a video from your device"}</span>
          <span className="text-sm text-muted">{file ? `${(file.size / 1048576).toFixed(1)} MB, tap to change` : `MP4, WebM or MOV, up to ${MAX_MB >= 1024 ? `${MAX_MB / 1024} GB` : `${MAX_MB} MB`}. Short videos of 3 to 8 minutes work best.`}</span>
        </button>
        {progress !== null && (
          <div className="mt-3" role="status" aria-live="polite">
            <div className="h-3.5 overflow-hidden rounded-full bg-wash"><div className="h-full rounded-full bg-tangerine-400 transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <p className="mt-1.5 text-sm text-muted">Uploading, {Math.round(progress * 100)}%. Keep this page open.</p>
          </div>
        )}
      </div>
      <Button type="submit" loading={busy} size="lg" className="justify-self-start">{busy ? (progress !== null ? "Uploading" : "Saving") : "Add video"}</Button>
    </form>
  );
}
