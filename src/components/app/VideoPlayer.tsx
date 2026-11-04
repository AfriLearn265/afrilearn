"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { recordVideoView } from "@/app/videos-actions";

/**
 * Plays a class video: YouTube through its privacy-enhanced player, or an uploaded file in the browser's own player.
 * The view is counted once, when play is first pressed.
 */
export function VideoPlayer({ id, title, youtubeId, src, poster }: {
  id: string; title: string; youtubeId: string | null; src: string | null; poster: string | null;
}) {
  const counted = useRef(false);
  const [started, setStarted] = useState(false);
  const count = () => {
    if (counted.current) return;
    counted.current = true;
    void recordVideoView(id).catch(() => {});
  };

  const frame = "sticker relative aspect-video w-full overflow-hidden rounded-[1.75rem] bg-ink";

  if (youtubeId) {
    if (!started) {
      return (
        <button type="button" onClick={() => { setStarted(true); count(); }} className={`${frame} group block`} aria-label={`Play video: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube poster frame */}
          <img src={poster ?? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" className="size-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
          <span className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-ink bg-sun-400 shadow-[3px_5px_0_var(--color-ink)] transition-transform group-hover:scale-110">
            <Play className="ml-1 size-9 fill-ink text-ink" aria-hidden="true" />
          </span>
        </button>
      );
    }
    return (
      <div className={frame}>
        <iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`} title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
          className="absolute inset-0 size-full" />
      </div>
    );
  }

  if (!src) {
    return (
      <div className={`${frame} grid place-items-center p-6 text-center text-white`}>
        <p>This video can&apos;t be played right now. Refresh the page, or ask your teacher to check the upload.</p>
      </div>
    );
  }
  return (
    <div className={frame}>
      <video controls playsInline preload="metadata" poster={poster ?? undefined} onPlay={count} className="absolute inset-0 size-full bg-ink">
        <source src={src} />
        Your browser can&apos;t play this video.
      </video>
    </div>
  );
}
