"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { SUPABASE_URL } from "@/lib/env";
import type { ActionResult } from "@/components/app/ActionForm";

/** Only accept photo addresses in the person's own folder of the public avatars bucket. */
async function ownImageUrl(url: string, userId: string) {
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/avatars/${userId}/`;
  return url.startsWith(prefix) && !url.slice(prefix.length).includes("..");
}

export async function saveAvatar(url: string | null): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Log in again to change your photo." };
  if (url !== null && !(await ownImageUrl(url, session.userId))) return { error: "That photo couldn't be saved." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", session.userId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { message: url ? "Photo updated." : "Photo removed." };
}
