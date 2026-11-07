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

/** Saves the pupil's star rating for a lesson (one per pupil per topic; rating again replaces it). */
export async function rateTopic(topicId: string, stars: number) {
  if (!(stars >= 1 && stars <= 5)) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("topic_ratings").upsert({ user_id: user.id, topic_id: topicId, stars: Math.round(stars) });
}
