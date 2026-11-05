"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPupilAccount } from "@/lib/pupils";

export type BulkResult = {
  error?: string;
  made?: { fullName: string; loginId: string; password: string; className: string }[];
  failed?: { line: string; reason: string }[];
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Creates pupil accounts for a whole class from a pasted list, one pupil per line:
 * "Full name" or "Full name, parent's name, parent's email" (commas or tabs, as copied from a spreadsheet).
 */
export async function addPupils(fd: FormData): Promise<BulkResult> {
  const { userId } = await requireRole("admin");
  const classCode = String(fd.get("class_code") ?? "");
  const classroomId = String(fd.get("classroom_id") ?? "") || null;
  const lines = String(fd.get("pupils") ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .filter((l, i) => !(i === 0 && /^(full\s*)?name\b/i.test(l))); // skip a header row
  if (!lines.length) return { error: "Paste at least one pupil's name." };
  if (lines.length > 60) return { error: `That's ${lines.length} pupils. Add up to 60 at a time.` };

  const supabase = await createClient();
  const { data: klass } = await supabase.from("classes").select("name").eq("code", classCode).eq("is_active", true).maybeSingle();
  if (!klass) return { error: "Choose the class these pupils are in." };
  const admin = createAdminClient();
  if (!admin) return { error: "Pupil accounts can't be created yet: the server's Supabase secret key is missing." };

  const made: NonNullable<BulkResult["made"]> = [];
  const failed: NonNullable<BulkResult["failed"]> = [];
  for (const line of lines) {
    const [name = "", guardianName = "", guardianEmail = ""] = line.split(/\t|,/).map((x) => x.trim());
    if (name.length < 2) { failed.push({ line, reason: "No name on this line." }); continue; }
    if (guardianEmail && !EMAIL.test(guardianEmail)) { failed.push({ line, reason: "The parent's email doesn't look right." }); continue; }
    const r = await createPupilAccount({ fullName: name, classCode, guardianName: guardianName || null, guardianEmail: guardianEmail.toLowerCase() || null }, `admin:${userId}`);
    if (r.error || !r.pupil) { failed.push({ line, reason: r.error ?? "Not created." }); continue; }
    if (classroomId) {
      await admin.from("enrollments").insert({ classroom_id: classroomId, student_id: r.pupil.id }).then(() => null, () => null);
    }
    made.push({ fullName: r.pupil.fullName, loginId: r.pupil.loginId, password: r.pupil.password, className: klass.name });
  }
  if (made.length) {
    await admin.from("activity_logs").insert({ actor_id: userId, action: "pupils.bulk_created", entity_type: "class", metadata: { class: classCode, count: made.length } });
  }
  revalidatePath("/admin");
  return { made, failed };
}
