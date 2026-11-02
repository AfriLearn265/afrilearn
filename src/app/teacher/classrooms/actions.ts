"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/components/app/ActionForm";

const lagosToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());

export async function postAnnouncement(fd: FormData): Promise<ActionResult> {
  const { userId } = await requireRole("teacher");
  const classroom = String(fd.get("classroom_id"));
  const title = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  if (!title || !body) return { error: "Add a title and a message." };
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({ classroom_id: classroom, author_id: userId, title, body });
  if (error) return { error: error.message };
  revalidatePath(`/teacher/classrooms/${classroom}`);
  return { message: "Posted. Students and their parents have been notified." };
}

export async function saveAttendance(fd: FormData): Promise<ActionResult> {
  const { userId } = await requireRole("teacher");
  const classroom = String(fd.get("classroom_id"));
  const date = String(fd.get("date") ?? "") || lagosToday();
  const rows = [...fd.entries()].filter(([k]) => k.startsWith("att_")).map(([k, v]) => ({
    classroom_id: classroom, student_id: k.slice(4), attended_on: date, live_class_id: null, status: String(v), marked_by: userId,
  }));
  if (rows.length === 0) return { error: "Mark at least one student." };
  const supabase = await createClient();
  const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "classroom_id,student_id,attended_on,live_class_id" });
  if (error) return { error: error.message };
  revalidatePath(`/teacher/classrooms/${classroom}`);
  return { message: `Attendance saved for ${rows.length} student${rows.length === 1 ? "" : "s"}.` };
}

export async function setMember(fd: FormData) {
  await requireRole("teacher");
  const supabase = await createClient();
  await supabase.from("enrollments").update({ status: String(fd.get("status")) }).eq("id", String(fd.get("enrollment_id")));
  revalidatePath(`/teacher/classrooms/${fd.get("classroom_id")}`);
}

export async function toggleLeaderboard(fd: FormData) {
  await requireRole("teacher");
  const supabase = await createClient();
  await supabase.from("classrooms").update({ leaderboard_enabled: fd.get("on") === "1" }).eq("id", String(fd.get("classroom_id")));
  revalidatePath(`/teacher/classrooms/${fd.get("classroom_id")}`);
}
