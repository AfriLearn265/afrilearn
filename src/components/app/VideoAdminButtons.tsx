"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye, Trash2 } from "lucide-react";
import { deleteClassVideo, setVideoPublished } from "@/app/videos-actions";
import { Button } from "@/components/ui/Button";

/** Hide, show or delete a class video (for the teacher who added it, or an administrator). */
export function VideoAdminButtons({ id, published, afterDelete }: { id: string; published: boolean; afterDelete: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid justify-items-end gap-1.5">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={pending}
          onClick={() => start(async () => { const r = await setVideoPublished(id, !published); if (r.error) setError(r.error); else router.refresh(); })}>
          {published ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}{published ? "Hide from pupils" : "Show to pupils"}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={pending} className="text-coral-700 hover:border-coral-500 hover:bg-coral-100"
          onClick={() => {
            if (!window.confirm("Delete this video for everyone? This can't be undone.")) return;
            start(async () => { const r = await deleteClassVideo(id); if (r.error) setError(r.error); else router.push(afterDelete); });
          }}>
          <Trash2 className="size-4" aria-hidden="true" />Delete
        </Button>
      </div>
      {error && <p className="text-sm text-coral-700">{error}</p>}
    </div>
  );
}
