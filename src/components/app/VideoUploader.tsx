"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Film, Link2, MonitorPlay, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";
import { createClassVideo } from "@/app/videos-actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui/Field";

export type UploaderClass = { id: string; name: string; subjects: { id: string; name: string }[] };

const MAX_MB = 50;
const TYPES: Record<string, string> = { mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime" };

type Source = "upload" | "youtube" | "link";

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

export function VideoUploader({ userId, classes, defaultClassId }: { userId: string; classes: UploaderClass[]; defaultClassId?: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<Source>("upload");
  const [classId, setClassId] = useState(defaultClassId ?? classes[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const subjects = useMemo(() => classes.find((c) => c.id === classId)?.subjects ?? [], [classes, classId]);

  function pick(f: File | null) {
    setMsg(null);
    if (!f) return setFile(null);
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!TYPES[ext] && !f.type.startsWith("video/")) return setMsg({ ok: false, text: "Choose an MP4, WebM or MOV video file." });
    if (f.size > MAX_MB * 1024 * 1024) {
      return setMsg({ ok: false, text: `${f.name} is ${(f.size / 1048576).toFixed(0)} MB. Videos can be up to ${MAX_MB} MB, so trim or compress it, or upload it to YouTube and use the YouTube option.` });
    }
    setFile(f);
  }

  async function submit(form: HTMLFormElement) {
    const fd = new FormData(form);
    setMsg(null);
    setBusy(true);
    try {
      const base = { classId, subjectId: String(fd.get("subject_id") ?? "") || null, title: String(fd.get("title") ?? ""), description: String(fd.get("description") ?? "") || null };
      if (base.title.trim().length < 2) throw new Error("Give the video a short title.");
      let result: { error?: string; id?: string };
      if (source === "upload") {
        if (!file) throw new Error("Choose a video file to upload.");
        const { data } = await createClient().auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Your session has ended. Log in again, then upload.");
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
        const type = file.type || TYPES[ext] || "video/mp4";
        const stem = `${userId}/${classId}/${Date.now()}-${file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(-60)}`;
        const info = await inspect(file);
        setProgress(0);
        await putFile(`${stem}.${ext}`, file, type, token, setProgress);
        let thumb: string | null = null;
        if (info.poster) {
          await putFile(`${stem}.jpg`, info.poster, "image/jpeg", token).then(() => { thumb = `${stem}.jpg`; }, () => null);
        }
        result = await createClassVideo({ ...base, source, storagePath: `${stem}.${ext}`, thumbnailPath: thumb, durationSeconds: info.duration, fileSize: file.size });
      } else {
        result = await createClassVideo({ ...base, source, link: String(fd.get("link") ?? "") });
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

  const tabs: { value: Source; label: string; icon: typeof Film }[] = [
    { value: "upload", label: "Upload a video", icon: UploadCloud },
    { value: "youtube", label: "YouTube link", icon: MonitorPlay },
    { value: "link", label: "Video file link", icon: Link2 },
  ];

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(e.currentTarget); }} className="grid gap-5" noValidate>
      {msg && <Notice tone={msg.ok ? "success" : "error"}>{msg.text}</Notice>}

      <div role="tablist" aria-label="Where is the video?" className="flex flex-wrap gap-2">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" role="tab" aria-selected={source === value} onClick={() => { setSource(value); setMsg(null); }}
            className={clsx("inline-flex h-10 items-center gap-2 rounded-full border-2 px-4 font-display text-sm font-semibold transition-colors",
              source === value ? "border-ink bg-sun-400 text-ink" : "border-line bg-white text-ink-soft hover:border-grape-300")}>
            <Icon className="size-4" aria-hidden="true" />{label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Class" htmlFor="v-class">
          <Select id="v-class" value={classId} onChange={(e) => setClassId(e.target.value)} required>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Subject" htmlFor="v-subject" hint="Optional">
          <Select id="v-subject" name="subject_id" defaultValue="" key={classId}>
            <option value="">Any subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Title" htmlFor="v-title" className="sm:col-span-2">
          <Input id="v-title" name="title" maxLength={140} required placeholder="e.g. Adding fractions with the same denominator" />
        </Field>
        <Field label="What pupils should look out for" htmlFor="v-desc" hint="Optional" className="sm:col-span-2">
          <Textarea id="v-desc" name="description" rows={2} maxLength={2000} placeholder="Watch before Thursday's live class. Pause at 2:30 and try the question yourself." />
        </Field>
      </div>

      {source === "upload" && (
        <div>
          <input ref={fileInput} type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.m4v,.webm,.mov" className="sr-only" aria-label="Video file"
            onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          <button type="button" onClick={() => fileInput.current?.click()} disabled={busy}
            className="grid w-full place-items-center gap-2 rounded-[1.4rem] border-2 border-dashed border-grape-300 bg-grape-50 px-4 py-8 text-center transition-colors hover:border-grape-500 hover:bg-grape-100">
            <UploadCloud className="size-9 text-grape-600" aria-hidden="true" />
            <span className="font-display text-lg font-semibold">{file ? file.name : "Choose a video from your device"}</span>
            <span className="text-sm text-muted">{file ? `${(file.size / 1048576).toFixed(1)} MB, tap to change` : `MP4, WebM or MOV, up to ${MAX_MB} MB. Short videos of 3 to 8 minutes work best.`}</span>
          </button>
          {progress !== null && (
            <div className="mt-3" role="status" aria-live="polite">
              <div className="h-3.5 overflow-hidden rounded-full bg-wash"><div className="h-full rounded-full bg-tangerine-400 transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
              <p className="mt-1.5 text-sm text-muted">Uploading, {Math.round(progress * 100)}%. Keep this page open.</p>
            </div>
          )}
        </div>
      )}
      {source === "youtube" && (
        <Field label="YouTube link" htmlFor="v-link" hint="Use the Share button on YouTube to copy it. Unlisted videos work too.">
          <Input id="v-link" name="link" type="url" inputMode="url" placeholder="https://youtu.be/…" required />
        </Field>
      )}
      {source === "link" && (
        <Field label="Link to the video file" htmlFor="v-link" hint="A direct https link ending in .mp4 or .webm, for videos stored elsewhere.">
          <Input id="v-link" name="link" type="url" inputMode="url" placeholder="https://…/lesson.mp4" required />
        </Field>
      )}

      <Button type="submit" loading={busy} size="lg" className="justify-self-start">{busy ? (progress !== null ? "Uploading" : "Saving") : "Add video for this class"}</Button>
    </form>
  );
}
