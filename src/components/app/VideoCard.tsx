import Link from "next/link";
import clsx from "clsx";
import { Eye, Play } from "lucide-react";
import { formatDuration, isNew, type VideoWithMedia } from "@/lib/videos";
import { formatDate } from "@/lib/format";

const fallbackTones = ["bg-tangerine-400", "bg-sky-400", "bg-lime-400", "bg-bubble-400", "bg-sun-400", "bg-grape-400"];

/** A video in a grid: poster frame (or a colourful tile), title, subject and class. */
export function VideoCard({ v, href, showClass, staff }: { v: VideoWithMedia; href: string; showClass?: boolean; staff?: boolean }) {
  const duration = formatDuration(v.duration_seconds);
  const tone = fallbackTones[v.title.length % fallbackTones.length];
  return (
    <li className="group">
      <Link href={href} className="block rounded-[1.4rem] focus-visible:outline-offset-4">
        <div className={clsx("relative aspect-video overflow-hidden rounded-[1.4rem] border-2 border-ink", !v.posterUrl && tone)}>
          {v.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- poster frames come from YouTube or short-lived signed links
            <img src={v.posterUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          ) : (
            <>
              <span aria-hidden="true" className="absolute -left-6 -top-8 size-28 rounded-full bg-white/25" />
              <span aria-hidden="true" className="absolute -bottom-10 right-4 size-24 rounded-full bg-black/10" />
              <span className="absolute inset-x-4 bottom-3 line-clamp-2 font-display text-xl font-semibold leading-tight text-ink/80">{v.title}</span>
            </>
          )}
          <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-ink bg-white shadow-[2px_3px_0_var(--color-ink)] transition-transform group-hover:scale-110">
            <Play className="ml-0.5 size-6 fill-ink text-ink" aria-hidden="true" />
          </span>
          {duration && <span className="absolute bottom-2 right-2 rounded-full bg-ink/85 px-2 py-0.5 text-xs font-bold text-white tabular">{duration}</span>}
          {isNew(v.created_at) && <span className="absolute left-2 top-2 rounded-full border-2 border-ink bg-sun-400 px-2.5 py-0.5 font-display text-xs font-semibold text-ink">New</span>}
          {staff && !v.is_published && <span className="absolute right-2 top-2 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-ink">Hidden</span>}
        </div>
        <div className="mt-3 px-1">
          <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug group-hover:text-grape-700">{v.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            {v.subjects && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink-soft">
                <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: v.subjects.color }} />{v.subjects.name}
              </span>
            )}
            {showClass && v.classes && <span className="font-semibold text-ink-soft">{v.classes.name}</span>}
            <span>{formatDate(v.created_at)}</span>
            {staff && <span className="inline-flex items-center gap-1"><Eye className="size-3.5" aria-hidden="true" />{v.view_count}<span className="sr-only">views</span></span>}
          </p>
        </div>
      </Link>
    </li>
  );
}
