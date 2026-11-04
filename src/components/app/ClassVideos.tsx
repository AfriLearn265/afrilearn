import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, Clock, Eye, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VIDEO_FIELDS, formatDuration, withMedia, type ClassVideo } from "@/lib/videos";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/app/AppShell";
import { VideoCard } from "@/components/app/VideoCard";
import { VideoPlayer } from "@/components/app/VideoPlayer";
import { VideoAdminButtons } from "@/components/app/VideoAdminButtons";
import { Notice } from "@/components/ui/Field";

/** A class's videos, newest first, with subject filter chips. */
export async function ClassVideoGrid({ classIds, basePath, subject, showClass, staff, mineOnly, userId, emptyTitle, emptyText }: {
  classIds: string[] | null; basePath: string; subject?: string; showClass?: boolean; staff?: boolean; mineOnly?: boolean;
  userId?: string; emptyTitle: string; emptyText: string;
}) {
  const supabase = await createClient();
  let q = supabase.from("class_videos").select(VIDEO_FIELDS).order("created_at", { ascending: false }).limit(120);
  if (classIds) q = q.in("class_id", classIds.length ? classIds : ["00000000-0000-0000-0000-000000000000"]);
  if (mineOnly && userId) q = q.eq("uploaded_by", userId);
  if (!staff) q = q.eq("is_published", true);
  const { data } = await q;
  const all = (data ?? []) as unknown as ClassVideo[];
  const subjects = [...new Map(all.filter((v) => v.subjects && v.subject_id).map((v) => [v.subject_id!, v.subjects!])).entries()];
  const shown = subject ? all.filter((v) => v.subject_id === subject) : all;
  const videos = await withMedia(shown);
  const sep = basePath.includes("?") ? "&" : "?";

  return (
    <div className="grid gap-6">
      {subjects.length > 1 && (
        <nav aria-label="Filter by subject" className="-mx-4 overflow-x-auto px-4 scrollbar-none">
          <ul className="flex min-w-max gap-2">
            <li><Link href={basePath} aria-current={!subject ? "page" : undefined} className={chip(!subject)}>All subjects<span className="ml-1.5 opacity-70">{all.length}</span></Link></li>
            {subjects.map(([id, s]) => (
              <li key={id}>
                <Link href={`${basePath}${sep}subject=${id}`} aria-current={subject === id ? "page" : undefined} className={chip(subject === id)}>
                  <span aria-hidden="true" className="mr-2 size-2.5 rounded-full" style={{ background: s.color }} />{s.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {videos.length === 0 ? <EmptyState title={emptyTitle}>{emptyText}</EmptyState> : (
        <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((v) => <VideoCard key={v.id} v={v} href={`${basePath.split("?")[0]}/${v.id}`} showClass={showClass} staff={staff} />)}
        </ul>
      )}
    </div>
  );
}

function chip(active: boolean) {
  return clsx("inline-flex h-10 items-center rounded-full border-2 px-4 font-display text-sm font-semibold transition-colors",
    active ? "border-ink bg-sun-400 text-ink" : "border-line bg-white text-ink-soft hover:border-grape-300");
}

/** The watch page: the player, what to look out for, and more videos from the same class. */
export async function WatchVideo({ id, backHref, backLabel, staff, userId, isAdmin }: {
  id: string; backHref: string; backLabel: string; staff?: boolean; userId?: string; isAdmin?: boolean;
}) {
  const supabase = await createClient();
  const { data } = await supabase.from("class_videos").select(VIDEO_FIELDS).eq("id", id).maybeSingle();
  if (!data) {
    return (
      <div className="grid gap-4">
        <Notice tone="warning" title="This video isn't available.">It may have been removed, or it is for a different class.</Notice>
        <Link href={backHref} className="font-semibold text-grape-700">{backLabel}</Link>
      </div>
    );
  }
  const [v] = await withMedia([data as unknown as ClassVideo], { video: true });
  const { data: more } = await supabase.from("class_videos").select(VIDEO_FIELDS).eq("class_id", v.class_id).eq("is_published", true)
    .neq("id", v.id).order("created_at", { ascending: false }).limit(6);
  const others = await withMedia((more ?? []) as unknown as ClassVideo[]);
  const duration = formatDuration(v.duration_seconds);
  const canManage = staff && (isAdmin || v.uploaded_by === userId);

  return (
    <div className="grid gap-8">
      <Link href={backHref} className="inline-flex items-center gap-1 justify-self-start font-display font-semibold text-grape-700 hover:underline">
        <ChevronLeft className="size-4" aria-hidden="true" />{backLabel}
      </Link>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <VideoPlayer id={v.id} title={v.title} youtubeId={v.youtube_id} src={v.playUrl} poster={v.posterUrl} />
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {v.classes && <span className="rounded-full bg-grape-100 px-3 py-1 text-grape-800">{v.classes.name}</span>}
                {v.subjects && <span className="rounded-full px-3 py-1 text-white" style={{ background: v.subjects.color }}>{v.subjects.name}</span>}
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">{v.title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                {v.profiles && <span className="inline-flex items-center gap-1.5"><User className="size-4" aria-hidden="true" />{v.profiles.full_name}</span>}
                <span>Added {formatDate(v.created_at)}</span>
                {duration && <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden="true" />{duration}</span>}
                {staff && <span className="inline-flex items-center gap-1.5"><Eye className="size-4" aria-hidden="true" />{v.view_count} {v.view_count === 1 ? "view" : "views"}</span>}
              </p>
            </div>
            {canManage && <VideoAdminButtons id={v.id} published={v.is_published} afterDelete={backHref} />}
          </div>
          {v.description && <p className="mt-5 max-w-2xl whitespace-pre-line rounded-[1.4rem] bg-sun-100 p-5 text-lg leading-relaxed">{v.description}</p>}
        </div>
        <aside aria-label="More videos for this class">
          <h2 className="text-xl font-semibold">More for {v.classes?.name ?? "this class"}</h2>
          {others.length === 0 ? <p className="mt-3 text-sm text-muted">No other videos yet.</p> : (
            <ul className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
              {others.map((o) => <VideoCard key={o.id} v={o} href={`${backHref.split("?")[0]}/${o.id}`} staff={staff} />)}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
