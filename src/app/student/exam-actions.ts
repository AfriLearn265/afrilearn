"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/components/app/ActionForm";

export async function startExam(fd: FormData): Promise<ActionResult> {
  const examId = String(fd.get("exam_id") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_exam_attempt", { p_exam: examId });
  if (error) return { error: error.message };
  redirect(`/exam/${data}`);
}

export async function startPractice(fd: FormData): Promise<ActionResult> {
  const subject = String(fd.get("subject_id") ?? "");
  if (!subject) return { error: "Choose a subject." };
  const body = String(fd.get("exam_body") ?? "") || null;
  const topic = String(fd.get("topic") ?? "") || null;
  const mode = fd.get("mode") === "mock" ? "mock" : "practice";
  const count = Math.min(60, Math.max(5, Number(fd.get("count") ?? 20)));
  const minutes = Math.min(180, Math.max(5, Number(fd.get("minutes") ?? 20)));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_practice_session", {
    p_subject: subject, p_exam_body: body, p_topic: topic, p_count: count, p_minutes: minutes, p_mode: mode,
  });
  if (error) return { error: error.message };
  redirect(`/exam/${data}`);
}
