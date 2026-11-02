"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/components/app/ActionForm";

export async function linkChild(fd: FormData): Promise<ActionResult> {
  const code = String(fd.get("code") ?? "").trim();
  const relationship = String(fd.get("relationship") ?? "guardian");
  if (code.length < 6) return { error: "Enter the 8-character link code from your child's profile page." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("link_child", { p_code: code, p_relationship: relationship });
  if (error) return { error: error.message };
  revalidatePath("/parent", "layout");
  return { message: `${(data as { name: string }).name} is now linked to your account.` };
}
