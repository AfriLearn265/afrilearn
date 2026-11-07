"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { vdoDelete, vdoUploadTicket, vdocipherReady, type VdoUploadTicket } from "@/lib/vdocipher";

export type VideoInput = {
  classId: string; subjectId: string | null; topicId: string | null; title: string; description: string | null;
  source: "upload" | "vdocipher"; storagePath?: string | null; thumbnailPath?: string | null;
  providerVideoId?: string | null; durationSeconds?: number | null; fileSize?: number | null;
};

/** Asks VdoCipher for a one-off upload slot, so the teacher's browser can send the file straight to protected storage. */
export async function startProtectedUpload(title: string): Promise<{ error?: string; ticket?: VdoUploadTicket }> {
  await requireRole("teacher", "admin");
  if (!vdocipherReady()) return { error: "Protected video hosting isn't switched on yet." };
  try {
    return { ticket: await vdoUploadTicket(title.trim() || "AfriLearn lesson") };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The video service didn't answer. Try again." };
  }
}

export async function createClassVideo(input: VideoInput): Promise<{ error?: string; id?: string }> {
  const { userId } = await requireRole("teacher", "admin");
  const title = input.title.trim();
  if (!input.classId) return { error: "Choose the class this video is for." };
  if (title.length < 2) return { error: "Give the video a short title." };
  if (title.length > 140) return { error: "Keep the title under 140 characters." };

  const supabase = await createClient();
  let subjectId = input.subjectId || null;
  if (input.topicId) {
    const { data: topic } = await supabase.from("curriculum_topics").select("class_id, subject_id").eq("id", input.topicId).maybeSingle();
    if (!topic || topic.class_id !== input.classId) return { error: "That topic belongs to a different class. Choose the topic again." };
    subjectId = topic.subject_id;
  }

  const row: Record<string, unknown> = {
    class_id: input.classId, subject_id: subjectId, topic_id: input.topicId || null, title,
    description: input.description?.trim() || null, source: input.source, uploaded_by: userId,
    duration_seconds: input.durationSeconds ? Math.round(input.durationSeconds) : null, file_size_bytes: input.fileSize ?? null,
  };
  if (input.source === "vdocipher") {
    if (!/^[\w-]{8,64}$/.test(input.providerVideoId ?? "")) return { error: "The upload did not finish. Try again." };
    row.provider_video_id = input.providerVideoId;
  } else {
    if (!input.storagePath?.startsWith(`${userId}/`)) return { error: "The upload did not finish. Try again." };
    row.storage_path = input.storagePath;
  }
  row.thumbnail_path = input.thumbnailPath?.startsWith(`${userId}/`) ? input.thumbnailPath : null;

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
  const { data: v } = await supabase.from("class_videos").select("source, provider_video_id, storage_path, thumbnail_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("class_videos").delete().eq("id", id);
  if (error) return { error: error.message };
  const files = [v?.storage_path, v?.thumbnail_path].filter((p): p is string => !!p);
  if (files.length) await supabase.storage.from("class-videos").remove(files);
  if (v?.source === "vdocipher" && v.provider_video_id && vdocipherReady()) await vdoDelete([v.provider_video_id]).catch(() => {});
  revalidatePath("/teacher/videos");
  revalidatePath("/admin/videos");
  return {};
}

/** Counts a view when a pupil or parent presses play. */
export async function recordVideoView(id: string) {
  const supabase = await createClient();
  await supabase.rpc("record_video_view", { p_video: id });
}
