import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ClassVideo = {
  id: string; title: string; description: string | null; source: "upload" | "youtube" | "link";
  storage_path: string | null; youtube_id: string | null; external_url: string | null; thumbnail_path: string | null;
  duration_seconds: number | null; view_count: number; created_at: string; is_published: boolean; uploaded_by: string | null;
  class_id: string; subject_id: string | null;
  classes: { name: string; code: string } | null;
  subjects: { name: string; color: string } | null;
  profiles: { full_name: string } | null;
};

export const VIDEO_FIELDS =
  "id, title, description, source, storage_path, youtube_id, external_url, thumbnail_path, duration_seconds, view_count, created_at, is_published, uploaded_by, class_id, subject_id, classes(name, code), subjects(name, color), profiles:uploaded_by(full_name)";

/** Signed links for uploaded videos and their poster frames (valid for three hours). */
export async function withMedia<T extends ClassVideo>(videos: T[], opts: { video?: boolean } = {}) {
  const supabase = await createClient();
  const paths = videos.flatMap((v) => [v.thumbnail_path, opts.video ? v.storage_path : null]).filter((p): p is string => !!p);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from("class-videos").createSignedUrls(paths, 60 * 60 * 3);
    (data ?? []).forEach((d) => { if (d.signedUrl && d.path) signed.set(d.path, d.signedUrl); });
  }
  return videos.map((v) => ({
    ...v,
    posterUrl: v.youtube_id ? `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg` : (v.thumbnail_path ? signed.get(v.thumbnail_path) ?? null : null),
    playUrl: v.source === "upload" ? (v.storage_path ? signed.get(v.storage_path) ?? null : null) : v.source === "link" ? v.external_url : null,
  }));
}

export type VideoWithMedia = Awaited<ReturnType<typeof withMedia<ClassVideo>>>[number];

export function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function isNew(createdAt: string, days = 3, now = Date.now()) {
  return now - new Date(createdAt).getTime() < days * 86400000;
}
