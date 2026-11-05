"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CRITTERS, CritterFace, critterLabel, type Critter } from "@/components/brand/Critters";
import { saveAvatar } from "@/lib/profile-actions";

/** Pick a cartoon animal as your picture instead of a photo. */
export function CritterPicker({ current }: { current: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-semibold text-ink-soft">Or choose a character</legend>
      <div className="mt-2 flex flex-wrap gap-2.5">
        {CRITTERS.map((k: Critter) => {
          const on = current === `avatar:${k}`;
          return (
            <button key={k} type="button" disabled={pending} aria-pressed={on} title={critterLabel[k]}
              onClick={() => start(async () => { const r = await saveAvatar(`avatar:${k}`); if (r.error) setError(r.error); else router.refresh(); })}
              className={clsx("rounded-full p-1 transition-transform hover:scale-110 disabled:opacity-60", on ? "ring-4 ring-tangerine-500" : "ring-2 ring-line")}>
              <CritterFace kind={k} className="size-12" />
              <span className="sr-only">{critterLabel[k]}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-coral-700">{error}</p>}
    </fieldset>
  );
}
