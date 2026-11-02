"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/components/app/ActionForm";

export async function joinClassroom(fd: FormData): Promise<ActionResult> {
  const code = String(fd.get("code") ?? "").trim();
  if (code.length < 4) return { error: "Enter the class code your teacher gave you." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_classroom", { p_code: code });
  if (error) return { error: error.message };
  revalidatePath("/student", "layout");
  return { message: `You joined ${(data as { name: string }).name}.` };
}

export async function regenerateLinkCode(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("regenerate_link_code");
  if (error) return { error: error.message };
  revalidatePath("/student");
  return { message: "New link code created. The old one no longer works." };
}
