"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ActionResult } from "@/components/app/ActionForm";

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/**
 * Picks an image, uploads it straight to the public "avatars" bucket in the person's own
 * folder, then asks the server to save the new address. Used for profile photos and the site logo.
 */
export function ImageUpload({ userId, kind, hasImage, save, label, removeLabel = "Remove" }: {
  userId: string; kind: "avatar" | "logo"; hasImage: boolean; save: (url: string | null) => Promise<ActionResult>;
  label: string; removeLabel?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    setError(null);
    if (!file) return;
    const ext = TYPES[file.type];
    if (!ext) { setError("Choose a PNG, JPG or WebP image."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Choose an image under 2 MB."); return; }
    setBusy(true);
    const path = `${userId}/${kind}-${Date.now()}.${ext}`;
    const supabase = createClient();
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
    if (upErr) { setBusy(false); setError(`Upload failed: ${upErr.message}`); return; }
    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    startTransition(async () => {
      const r = await save(url);
      setBusy(false);
      if (r?.error) setError(r.error); else router.refresh();
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const r = await save(null);
      if (r?.error) setError(r.error); else router.refresh();
    });
  }

  const working = busy || pending;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={working}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold text-ink hover:border-adire-300 hover:bg-adire-50 disabled:opacity-60">
          {working ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
          {working ? "Saving" : label}
        </button>
        {hasImage && !working && (
          <button type="button" onClick={remove} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-wash hover:text-ink">
            <Trash2 className="size-4" aria-hidden="true" />{removeLabel}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label={label}
        onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      {error && <p role="alert" className="mt-2 text-sm text-coral-700">{error}</p>}
    </div>
  );
}
