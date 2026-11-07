"use client";

import { useRef, useState } from "react";
import { Play, ShieldCheck } from "lucide-react";
import { recordVideoView } from "@/app/videos-actions";
import type { Playback } from "@/lib/videos";

/**
 * Plays a class video.
 * - Protected (VdoCipher DRM): encrypted stream in VdoCipher's player, with the viewer's name drifting across it.
 *   Nothing in the page or the network tab can be saved and played elsewhere, and the apps block screen recording.
 * - Uploaded files: a short-lived private link, no download button, no picture-in-picture, no right-click menu,
 *   and the viewer's name drifting across the picture to discourage screen recording.
 * - Older sample videos from YouTube still play through YouTube's privacy-enhanced player.
 * The view is counted once, when play is first pressed.
 */
export function VideoPlayer({ id, title, playback, poster, watermark }: {
  id: string; title: string; playback: Playback; poster: string | null; watermark?: string;
}) {
  const counted = useRef(false);
  const [started, setStarted] = useState(false);
  const count = () => {
    if (counted.current) return;
    counted.current = true;
    void recordVideoView(id).catch(() => {});
  };

  const frame = "sticker relative aspect-video w-full overflow-hidden rounded-[1.75rem] bg-ink select-none";

  if (playback.kind === "none") {
    return (
      <div className={`${frame} grid place-items-center p-6 text-center text-white`}>
        <p className="max-w-sm">{playback.reason}</p>
      </div>
    );
  }

  if (!started && playback.kind !== "file") {
    return (
      <button type="button" onClick={() => { setStarted(true); count(); }} className={`${frame} group block`} aria-label={`Play video: ${title}`}>
        {poster
          // eslint-disable-next-line @next/next/no-img-element -- poster frame from storage or YouTube
          ? <img src={poster} alt="" className="size-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
          : <span className="sky-dots absolute inset-0 bg-grape-800" />}
        <span className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-ink bg-sun-400 shadow-[3px_5px_0_var(--color-ink)] transition-transform group-hover:scale-110">
          <Play className="ml-1 size-9 fill-ink text-ink" aria-hidden="true" />
        </span>
        {playback.kind === "drm" && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white">
            <ShieldCheck className="size-3.5" aria-hidden="true" />Protected lesson
          </span>
        )}
      </button>
    );
  }

  if (playback.kind === "drm") {
    return (
      <div className={frame}>
        <iframe src={`https://player.vdocipher.com/v2/?otp=${encodeURIComponent(playback.otp)}&playbackInfo=${encodeURIComponent(playback.playbackInfo)}&autoplay=true`}
          title={title} allow="encrypted-media; autoplay; fullscreen" allowFullScreen className="absolute inset-0 size-full border-0" />
      </div>
    );
  }

  if (playback.kind === "youtube") {
    return (
      <div className={frame}>
        <iframe src={`https://www.youtube-nocookie.com/embed/${playback.id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`} title={title}
          allow="autoplay; encrypted-media" allowFullScreen className="absolute inset-0 size-full" />
      </div>
    );
  }

  return (
    <div className={frame} onContextMenu={(e) => e.preventDefault()}>
      <video controls playsInline preload="metadata" poster={poster ?? undefined} onPlay={count}
        controlsList="nodownload noremoteplayback noplaybackrate" disablePictureInPicture disableRemotePlayback
        className="absolute inset-0 size-full bg-ink">
        <source src={playback.src} />
        Your browser can&apos;t play this video.
      </video>
      {watermark && (
        <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 animate-[drift_18s_linear_infinite] whitespace-nowrap rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white/70">
          {watermark}
        </span>
      )}
    </div>
  );
}
