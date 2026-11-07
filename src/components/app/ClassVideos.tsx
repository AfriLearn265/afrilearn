import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, Clock, Eye, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VIDEO_FIELDS, formatDuration, playbackFor, withMedia, type ClassVideo } from "@/lib/videos";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/app/AppShell";
import { VideoCard } from "@/components/app/VideoCard";
import { VideoPlayer } from "@/components/app/VideoPlayer";
import { VideoAdminButtons } from "@/components/app/VideoAdminButtons";
import { Notice } from "@/components/ui/Field";

/** A class's videos, newest first, with subject filter chips. */
export async function ClassVideoGrid({ classIds, basePath, subject, showClass, staff, mineOnly, userId, studentId, emptyTitle, emptyText }: {
  classIds: string[] | null; basePath: string; subject?: string; showClass?: boolean; staff?: boolean; mineOnly?: boolean;
  userId?: string; studentId?: string; emptyTitle: string; emptyText: string;
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
  const watched = studentId ? await watchedBy(studentId, videos.map((v) => v.id)) : new Set<string>();
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
          {videos.map((v) => <VideoCard key={v.id} v={v} href={`${basePath.split("?")[0]}/${v.id}`} showClass={showClass} staff={staff} watched={watched.has(v.id)} />)}
        </ul>
      )}
    </div>
  );
}

/** Which of these videos a pupil has watched. */
export async function watchedBy(studentId: string, videoIds: string[]) {
  if (!videoIds.length) return new Set<string>();
  const supabase = await createClient();
  const { data } = await supabase.from("video_views").select("video_id").eq("student_id", studentId).in("video_id", videoIds);
  return new Set((data ?? []).map((r) => r.video_id as string));
}

type WatchRow = { student_id: string; full_name: string; plays: number; last_viewed_at: string | null };

/** For teachers: who in the class has watched this video, and who still needs to. */
async function WatchReport({ videoId, className }: { videoId: string; className: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("video_watch_report", { p_video: videoId });
  if (error) return null;
  const rows = (data ?? []) as WatchRow[];
  const seen = rows.filter((r) => r.plays > 0);
  const notYet = rows.filter((r) => r.plays === 0);
  const pct = rows.length ? Math.round((seen.length / rows.length) * 100) : 0;
  return (
    <section aria-labelledby="who-watched" className="mt-8 rounded-[1.6rem] border-2 border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="who-watched" className="text-xl font-semibold">Who has watched</h2>
        <p className="text-sm font-semibold text-ink-soft">{seen.length} of {rows.length} pupils in {className}</p>
      </div>
      <div className="mt-3 h-3.5 overflow-hidden rounded-full bg-wash" role="progressbar" aria-label="Pupils who watched" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-lime-400" style={{ width: `${Math.max(pct, rows.length ? 2 : 0)}%` }} />
      </div>
      {rows.length === 0 ? <p className="mt-4 text-sm text-muted">No pupils are in this class yet.</p> : (
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold text-leaf-700">Watched</h3>
            {seen.length === 0 ? <p className="mt-1.5 text-sm text-muted">Nobody yet.</p> : (
              <ul className="mt-2 grid gap-1.5 text-sm">
                {seen.map((r) => (
                  <li key={r.student_id} className="flex justify-between gap-3">
                    <span className="font-semibold">{r.full_name}</span>
                    <span className="text-muted">{r.plays > 1 ? `${r.plays} times, last ` : ""}{r.last_viewed_at ? formatDate(r.last_viewed_at) : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-coral-700">Not watched yet</h3>
            {notYet.length === 0 ? <p className="mt-1.5 text-sm text-muted">Everyone has watched it.</p> : (
              <ul className="mt-2 grid gap-1.5 text-sm">{notYet.map((r) => <li key={r.student_id}>{r.full_name}</li>)}</ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function chip(active: boolean) {
  return clsx("inline-flex h-10 items-center rounded-full border-2 px-4 font-display text-sm font-semibold transition-colors",
    active ? "border-ink bg-sun-400 text-ink" : "border-line bg-white text-ink-soft hover:border-grape-300");
}

/** The watch page: the player, what to look out for, and more videos from the same class. */
export async function WatchVideo({ id, backHref, backLabel, staff, userId, isAdmin, studentId }: {
  id: string; backHref: string; backLabel: string; staff?: boolean; userId?: string; isAdmin?: boolean; studentId?: string;
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
  const viewer = (await getSession())?.profile.full_name ?? "AfriLearn";
  const playback = await playbackFor(v, viewer);
  const { data: more } = await supabase.from("class_videos").select(VIDEO_FIELDS).eq("class_id", v.class_id).eq("is_published", true)
    .neq("id", v.id).order("created_at", { ascending: false }).limit(6);
  const others = await withMedia((more ?? []) as unknown as ClassVideo[]);
  const watched = studentId ? await watchedBy(studentId, others.map((o) => o.id)) : new Set<string>();
  const duration = formatDuration(v.duration_seconds);
  const canManage = staff && (isAdmin || v.uploaded_by === userId);

  return (
    <div className="grid gap-8">
      <Link href={backHref} className="inline-flex items-center gap-1 justify-self-start font-display font-semibold text-grape-700 hover:underline">
        <ChevronLeft className="size-4" aria-hidden="true" />{backLabel}
      </Link>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <VideoPlayer id={v.id} title={v.title} playback={playback} poster={v.posterUrl} watermark={viewer} />
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
          {staff && <WatchReport videoId={v.id} className={v.classes?.name ?? "this class"} />}
        </div>
        <aside aria-label="More videos for this class">
          <h2 className="text-xl font-semibold">More for {v.classes?.name ?? "this class"}</h2>
          {others.length === 0 ? <p className="mt-3 text-sm text-muted">No other videos yet.</p> : (
            <ul className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
              {others.map((o) => <VideoCard key={o.id} v={o} href={`${backHref.split("?")[0]}/${o.id}`} staff={staff} watched={watched.has(o.id)} />)}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
