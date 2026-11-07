"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Star } from "lucide-react";
import { rateTopic } from "@/app/student/topic-actions";

/** "How was this lesson?" Five big stars. The rating is real and feeds the stars shown on the homepage. */
export function StarRating({ topicId, initial }: { topicId: string; initial: number | null }) {
  const [stars, setStars] = useState(initial ?? 0);
  const [hover, setHover] = useState(0);
  const [saved, setSaved] = useState(false);
  const [, start] = useTransition();
  const shown = hover || stars;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[1.4rem] bg-sun-100 px-4 py-3">
      <p className="font-display font-semibold">How was this lesson?</p>
      <div role="radiogroup" aria-label="Rate this lesson" className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => { setStars(n); setSaved(false); start(async () => { await rateTopic(topicId, n); setSaved(true); }); }}
            className="p-1 transition-transform hover:scale-110">
            <Star className={clsx("size-7", n <= shown ? "fill-sun-400 text-sun-600" : "text-ink/25")} aria-hidden="true" />
          </button>
        ))}
      </div>
      <p aria-live="polite" className="text-sm font-semibold text-sun-600">{saved ? "Thank you!" : ""}</p>
    </div>
  );
}
