"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { attachToAssignment } from "../actions";
import { Button } from "@/components/ui/Button";

function attachmentPath(userId: string, assignmentId: string, name: string) {
  return `${userId}/assignments/${assignmentId}/${Date.now()}-${name.replace(/[^\w.-]+/g, "-").slice(-80)}`;
}

export function AttachFile({ userId, assignmentId }: { userId: string; assignmentId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setError(null);
    const path = attachmentPath(userId, assignmentId, f.name);
    const { error } = await createClient().storage.from("materials").upload(path, f, { contentType: f.type || undefined });
    if (error) { setBusy(false); return setError(error.message); }
    const r = await attachToAssignment(assignmentId, path);
    setBusy(false);
    if (r.error) return setError(r.error);
    router.refresh();
  }

  return (
    <div className="grid gap-1">
      <input ref={input} type="file" className="sr-only" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg" onChange={(e) => upload(e.target.files?.[0])} aria-label="Attach a reference document" />
      <Button type="button" variant="outline" size="sm" loading={busy} onClick={() => input.current?.click()} className="justify-self-start"><Paperclip className="size-4" aria-hidden="true" />Attach a reference document</Button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
    </div>
  );
}
