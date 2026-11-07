"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type QuizResult = { score: number; total: number; items: { id: string; correct: boolean; answer: number; explanation: string | null }[] } | { error: string };

/** Marks the pupil's answers on the server, where the correct answers live, and saves the score. */
export async function checkTopicQuiz(topicId: string, answers: Record<string, number>): Promise<QuizResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_topic_quiz", { p_topic: topicId, p_answers: answers });
  if (error) return { error: "We couldn't check your answers. Try again." };
  revalidatePath("/student", "layout");
  return data as QuizResult;
}

export async function markTopicDone(topicId: string) {
  const supabase = await createClient();
  await supabase.rpc("mark_topic_done", { p_topic: topicId });
  revalidatePath("/student", "layout");
}
