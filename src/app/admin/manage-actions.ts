"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/components/app/ActionForm";
import { SUPABASE_URL } from "@/lib/env";

async function db() {
  await requireRole("admin");
  return createClient();
}
const done = (path: string, message: string): ActionResult => { revalidatePath(path); return { message }; };

export async function setUserStatus(fd: FormData) {
  const s = await db();
  await s.rpc("admin_set_user_status", { p_user: String(fd.get("user_id")), p_status: String(fd.get("status")) });
  revalidatePath("/admin/users");
}

export async function setUserRole(fd: FormData): Promise<ActionResult> {
  const s = await db();
  const { error } = await s.rpc("admin_set_user_role", { p_user: String(fd.get("user_id")), p_role: String(fd.get("role")) });
  return error ? { error: error.message } : done("/admin/users", "Role updated.");
}

export async function addSubject(fd: FormData): Promise<ActionResult> {
  const s = await db();
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Enter a subject name." };
  const code = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { error } = await s.from("subjects").insert({ name, code, color: String(fd.get("color") ?? "#4A1FB8") });
  return error ? { error: error.code === "23505" ? "That subject already exists." : error.message } : done("/admin/academics", `${name} added.`);
}

export async function toggleSubject(fd: FormData) {
  const s = await db();
  await s.from("subjects").update({ is_active: fd.get("on") === "1" }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/academics");
}

export async function saveClassSubjects(fd: FormData): Promise<ActionResult> {
  const s = await db();
  const classId = String(fd.get("class_id"));
  const chosen = fd.getAll("subject_id").map(String);
  const compulsory = new Set(fd.getAll("compulsory").map(String));
  const { error: delErr } = await s.from("class_subjects").delete().eq("class_id", classId);
  if (delErr) return { error: delErr.message };
  if (chosen.length) {
    const { error } = await s.from("class_subjects").insert(chosen.map((id) => ({ class_id: classId, subject_id: id, is_compulsory: compulsory.has(id) })));
    if (error) return { error: error.message };
  }
  return done("/admin/academics", `Saved ${chosen.length} subjects for this class.`);
}

export async function setCourseFlags(fd: FormData) {
  const s = await db();
  const patch: Record<string, boolean> = {};
  if (fd.has("is_published")) patch.is_published = fd.get("is_published") === "1";
  if (fd.has("is_featured")) patch.is_featured = fd.get("is_featured") === "1";
  await s.from("courses").update(patch).eq("id", String(fd.get("id")));
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function setMaterialApproved(fd: FormData) {
  const s = await db();
  await s.from("learning_materials").update({ is_approved: fd.get("on") === "1" }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/content");
}

export async function setBankShared(fd: FormData) {
  const s = await db();
  await s.from("question_banks").update({ is_shared: fd.get("on") === "1" }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/content");
}

export async function saveTestimonial(fd: FormData): Promise<ActionResult> {
  const s = await db();
  const row = { author_name: String(fd.get("author_name") ?? "").trim(), author_role: String(fd.get("author_role") ?? "").trim(), quote: String(fd.get("quote") ?? "").trim(), is_published: fd.get("is_published") === "on" };
  if (!row.author_name || !row.quote) return { error: "Add the person's name and their words." };
  const { error } = await s.from("testimonials").insert(row);
  revalidatePath("/");
  return error ? { error: error.message } : done("/admin/content", "Testimonial saved.");
}

export async function deleteTestimonial(fd: FormData) {
  const s = await db();
  await s.from("testimonials").delete().eq("id", String(fd.get("id")));
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function saveSettings(fd: FormData): Promise<ActionResult> {
  const s = await db();
  const { userId } = await requireRole("admin");
  const flags = ["registration_open", "paid_features_enabled", "leaderboards_enabled", "ai_companion_enabled", "live_classes_enabled"];
  const rows = flags.map((k) => ({ key: k, value: fd.get(k) === "on", updated_by: userId }));
  rows.push({ key: "ai_daily_limit", value: Math.max(0, Math.min(500, Number(fd.get("ai_daily_limit") ?? 40))) as unknown as boolean, updated_by: userId });
  for (const r of rows) {
    const { error } = await s.from("platform_settings").update({ value: r.value, updated_by: r.updated_by, updated_at: new Date().toISOString() }).eq("key", r.key);
    if (error) return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { message: "Settings saved." };
}

export async function savePlan(fd: FormData): Promise<ActionResult> {
  const s = await db();
  const price = String(fd.get("price") ?? "").trim();
  const { error } = await s.from("subscription_plans").update({
    name: String(fd.get("name") ?? "").trim(),
    price_kobo: price === "" ? null : Math.round(Number(price) * 100),
    is_active: fd.get("is_active") === "on",
    is_featured: fd.get("is_featured") === "on",
    features: String(fd.get("features") ?? "").split("\n").map((x) => x.trim()).filter(Boolean),
  }).eq("id", String(fd.get("id")));
  revalidatePath("/");
  return error ? { error: error.message } : done("/admin/settings", "Plan saved.");
}

export async function broadcast(fd: FormData): Promise<ActionResult> {
  const s = await db();
  const role = String(fd.get("role") ?? "") || null;
  const { data, error } = await s.rpc("admin_broadcast", { p_role: role, p_title: String(fd.get("title") ?? ""), p_body: String(fd.get("body") ?? ""), p_link: null });
  return error ? { error: error.message } : { message: `Sent to ${data} people.` };
}

export async function resolveReport(fd: FormData) {
  const s = await db();
  const { userId } = await requireRole("admin");
  await s.from("reports").update({ status: String(fd.get("status")), resolved_by: userId, resolved_at: new Date().toISOString() }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/activity");
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Site name, tagline, contact address and the banner at the top of the public website. */
export async function saveBrand(fd: FormData): Promise<ActionResult> {
  const s = await db();
  const { userId } = await requireRole("admin");
  const name = String(fd.get("name") ?? "").trim().slice(0, 40);
  const tagline = String(fd.get("tagline") ?? "").trim().slice(0, 90);
  const email = String(fd.get("support_email") ?? "").trim().toLowerCase();
  const text = String(fd.get("announcement_text") ?? "").trim().slice(0, 160);
  const link = String(fd.get("announcement_link") ?? "").trim();
  const enabled = fd.get("announcement_enabled") === "on";
  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Enter the site name.";
  if (email && !EMAIL.test(email)) fieldErrors.support_email = "Enter a valid email address.";
  if (link && !(link.startsWith("/") || link.startsWith("https://"))) fieldErrors.announcement_link = "Use a page on this site (starting with /) or an https:// address.";
  if (enabled && !text) fieldErrors.announcement_text = "Write the banner message, or switch the banner off.";
  if (Object.keys(fieldErrors).length) return { error: "Check the highlighted fields.", fieldErrors };

  const { data: current } = await s.from("platform_settings").select("value").eq("key", "brand").maybeSingle();
  const now = new Date().toISOString();
  const rows = [
    { key: "brand", value: { ...((current?.value as object) ?? {}), name, tagline }, description: "Brand name, tagline and logo", is_public: true },
    { key: "support_email", value: email || "support@afrilearn.ng", description: "Contact address shown to users", is_public: true },
    { key: "announcement", value: { enabled, text, link }, description: "Banner shown at the top of the public website", is_public: true },
  ];
  for (const r of rows) {
    const { error } = await s.from("platform_settings").upsert({ ...r, updated_by: userId, updated_at: now }, { onConflict: "key" });
    if (error) return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { message: "Saved. The website now uses these details." };
}

/** Saves (or clears) the uploaded logo, which must sit in the administrator's own avatars folder. */
export async function saveBrandLogo(url: string | null): Promise<ActionResult> {
  const s = await db();
  const { userId } = await requireRole("admin");
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/avatars/${userId}/`;
  if (url !== null && (!url.startsWith(prefix) || url.includes(".."))) return { error: "That logo couldn't be saved." };
  const { data: current } = await s.from("platform_settings").select("value").eq("key", "brand").maybeSingle();
  const { error } = await s.from("platform_settings").update({
    value: { ...((current?.value as object) ?? {}), logo_url: url }, updated_by: userId, updated_at: new Date().toISOString(),
  }).eq("key", "brand");
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { message: url ? "Logo updated." : "Logo removed. The built-in mark is back." };
}
