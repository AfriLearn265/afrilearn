import "server-only";
import { createClient } from "@/lib/supabase/server";
import { vdoPlayback, vdocipherReady } from "@/lib/vdocipher";

export type ClassVideo = {
  id: string; title: string; description: string | null; source: "upload" | "youtube" | "link" | "vdocipher";
  provider_video_id: string | null; topic_id: string | null;
  storage_path: string | null; youtube_id: string | null; external_url: string | null; thumbnail_path: string | null;
  duration_seconds: number | null; view_count: number; created_at: string; is_published: boolean; uploaded_by: string | null;
  class_id: string; subject_id: string | null;
  classes: { name: string; code: string } | null;
  subjects: { name: string; color: string } | null;
  profiles: { full_name: string } | null;
};

export const VIDEO_FIELDS =
  "id, title, description, source, provider_video_id, topic_id, storage_path, youtube_id, external_url, thumbnail_path, duration_seconds, view_count, created_at, is_published, uploaded_by, class_id, subject_id, classes(name, code), subjects(name, color), profiles:uploaded_by(full_name)";

/** Signed links for poster frames (three hours) and, when asked, uploaded video files (twenty minutes). */
export async function withMedia<T extends ClassVideo>(videos: T[], opts: { video?: boolean } = {}) {
  const supabase = await createClient();
  const bucket = supabase.storage.from("class-videos");
  const posters = videos.map((v) => v.thumbnail_path).filter((p): p is string => !!p);
  const files = opts.video ? videos.map((v) => (v.source === "upload" ? v.storage_path : null)).filter((p): p is string => !!p) : [];
  const signed = new Map<string, string>();
  const [a, b] = await Promise.all([
    posters.length ? bucket.createSignedUrls(posters, 60 * 60 * 3) : Promise.resolve({ data: [] }),
    files.length ? bucket.createSignedUrls(files, 60 * 20) : Promise.resolve({ data: [] }),
  ]);
  [...(a.data ?? []), ...(b.data ?? [])].forEach((d) => { if (d.signedUrl && d.path) signed.set(d.path, d.signedUrl); });
  return videos.map((v) => ({
    ...v,
    posterUrl: v.youtube_id ? `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg` : (v.thumbnail_path ? signed.get(v.thumbnail_path) ?? null : null),
    playUrl: v.source === "upload" ? (v.storage_path ? signed.get(v.storage_path) ?? null : null) : v.source === "link" ? v.external_url : null,
  }));
}

/** How the player should play a video. DRM videos get a one-time pass with the viewer's name as a watermark. */
export type Playback =
  | { kind: "drm"; otp: string; playbackInfo: string }
  | { kind: "file"; src: string }
  | { kind: "youtube"; id: string }
  | { kind: "none"; reason: string };

export async function playbackFor(v: { source: ClassVideo["source"]; provider_video_id: string | null; youtube_id: string | null; playUrl: string | null }, viewerLabel: string): Promise<Playback> {
  if (v.source === "vdocipher" && v.provider_video_id) {
    if (!vdocipherReady()) return { kind: "none", reason: "Protected playback isn't switched on yet." };
    try {
      const pass = await vdoPlayback(v.provider_video_id, viewerLabel);
      return { kind: "drm", ...pass };
    } catch {
      return { kind: "none", reason: "The video service didn't answer. Refresh the page to try again." };
    }
  }
  if (v.source === "youtube" && v.youtube_id) return { kind: "youtube", id: v.youtube_id };
  if (v.playUrl) return { kind: "file", src: v.playUrl };
  return { kind: "none", reason: "This video can't be played right now. Refresh the page, or ask your teacher to check the upload." };
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
