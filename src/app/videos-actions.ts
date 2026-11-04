"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export type VideoInput = {
  classId: string; subjectId: string | null; title: string; description: string | null;
  source: "upload" | "youtube" | "link"; storagePath?: string | null; thumbnailPath?: string | null;
  link?: string | null; durationSeconds?: number | null; fileSize?: number | null;
};

/** Finds the 11-character video id in any common YouTube link. */
function youtubeId(url: string) {
  return url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)?.[1] ?? null;
}

export async function createClassVideo(input: VideoInput): Promise<{ error?: string; id?: string }> {
  const { userId } = await requireRole("teacher", "admin");
  const title = input.title.trim();
  if (!input.classId) return { error: "Choose the class this video is for." };
  if (title.length < 2) return { error: "Give the video a short title." };
  if (title.length > 140) return { error: "Keep the title under 140 characters." };

  const row: Record<string, unknown> = {
    class_id: input.classId, subject_id: input.subjectId || null, title,
    description: input.description?.trim() || null, source: input.source, uploaded_by: userId,
    duration_seconds: input.durationSeconds ? Math.round(input.durationSeconds) : null, file_size_bytes: input.fileSize ?? null,
  };
  if (input.source === "upload") {
    if (!input.storagePath?.startsWith(`${userId}/`)) return { error: "The upload did not finish. Try again." };
    row.storage_path = input.storagePath;
    row.thumbnail_path = input.thumbnailPath?.startsWith(`${userId}/`) ? input.thumbnailPath : null;
  } else if (input.source === "youtube") {
    const id = youtubeId(input.link ?? "");
    if (!id) return { error: "That doesn't look like a YouTube link. Copy it from the Share button on YouTube." };
    row.youtube_id = id;
  } else {
    const link = (input.link ?? "").trim();
    if (!/^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i.test(link)) return { error: "Paste a direct https link to an .mp4 or .webm file, or use the YouTube option." };
    row.external_url = link;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("class_videos").insert(row).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/teacher/videos");
  revalidatePath("/admin/videos");
  return { id: data.id };
}

export async function setVideoPublished(id: string, published: boolean): Promise<{ error?: string }> {
  await requireRole("teacher", "admin");
  const supabase = await createClient();
  const { error } = await supabase.from("class_videos").update({ is_published: published }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/teacher/videos");
  revalidatePath("/admin/videos");
  return {};
}

export async function deleteClassVideo(id: string): Promise<{ error?: string }> {
  await requireRole("teacher", "admin");
  const supabase = await createClient();
  const { data: v } = await supabase.from("class_videos").select("storage_path, thumbnail_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("class_videos").delete().eq("id", id);
  if (error) return { error: error.message };
  const files = [v?.storage_path, v?.thumbnail_path].filter((p): p is string => !!p);
  if (files.length) await supabase.storage.from("class-videos").remove(files);
  revalidatePath("/teacher/videos");
  revalidatePath("/admin/videos");
  return {};
}

/** Counts a view when a pupil or parent presses play. */
export async function recordVideoView(id: string) {
  const supabase = await createClient();
  await supabase.rpc("record_video_view", { p_video: id });
}
