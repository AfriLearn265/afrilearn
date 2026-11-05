"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/components/app/ActionForm";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPupilAccount } from "@/lib/pupils";

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

export type AddChildResult = { error?: string; pupil?: { fullName: string; loginId: string; password: string; className: string } };

/** A parent creates a pupil account for their child (no email needed) and is linked to it straight away. */
export async function addChild(fd: FormData): Promise<AddChildResult> {
  const { userId, profile } = await requireRole("parent");
  const fullName = String(fd.get("full_name") ?? "").trim();
  const classCode = String(fd.get("class_code") ?? "");
  const relationship = String(fd.get("relationship") ?? "parent");
  if (fullName.length < 2) return { error: "Enter your child's full name." };
  if (fd.get("consent") !== "on") return { error: "Tick the box to confirm you are this child's parent or guardian." };
  const supabase = await createClient();
  const { data: klass } = await supabase.from("classes").select("name").eq("code", classCode).eq("is_active", true).maybeSingle();
  if (!klass) return { error: "Choose your child's class." };
  const { data: me } = await supabase.auth.getUser();

  const made = await createPupilAccount({
    fullName, classCode, guardianName: profile.full_name, guardianEmail: me.user?.email ?? null,
    password: String(fd.get("password") ?? "") || null,
  }, `parent:${userId}`);
  if (made.error || !made.pupil) return { error: made.error ?? "We couldn't create the account." };

  const admin = createAdminClient()!;
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    admin.from("students").update({ managed_by_parent: userId }).eq("profile_id", made.pupil.id),
    admin.from("parent_children").insert({ parent_id: userId, student_id: made.pupil.id, relationship }),
  ]);
  if (e1 || e2) return { error: `The account was created (login ID ${made.pupil.loginId}) but linking it failed: ${(e1 ?? e2)!.message}` };
  await admin.from("activity_logs").insert({ actor_id: userId, action: "parent.linked_child", entity_type: "profile", entity_id: made.pupil.id, metadata: { created: true } });
  revalidatePath("/parent", "layout");
  return { pupil: { ...made.pupil, className: klass.name } };
}
