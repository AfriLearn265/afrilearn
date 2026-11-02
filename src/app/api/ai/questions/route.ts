import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AiUnavailable, complete, isAiConfigured } from "@/lib/ai";

export const maxDuration = 60;

// Drafts objective questions for a teacher to review. Nothing is saved here:
// the teacher adds each draft to a bank only after checking it.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_user_role");
  if (role !== "teacher" && role !== "admin") return NextResponse.json({ error: "Only approved teachers can generate questions." }, { status: 403 });
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "AI question generation isn't set up yet. Add an AI API key in the server settings to turn it on." }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { subject?: string; level?: string; topic?: string; count?: number; difficulty?: string };
  const topic = String(body.topic ?? "").slice(0, 120).trim();
  if (!topic) return NextResponse.json({ error: "Enter a topic." }, { status: 400 });
  const count = Math.min(10, Math.max(1, Number(body.count) || 5));

  const system = "You write original multiple-choice questions for Nigerian school assessments. Never copy past-paper questions. Output only valid JSON.";
  const prompt = `Write ${count} original multiple-choice questions.
Subject: ${body.subject ?? "General"}
Class or exam: ${body.level ?? "Secondary school"}
Topic: ${topic}
Difficulty: ${body.difficulty ?? "medium"}
Each question has exactly 4 options and exactly one correct answer, plus a one or two sentence explanation.
Return JSON only, in this shape:
{"questions":[{"body":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."}]}`;

  try {
    const text = await complete({ system, messages: [{ role: "user", content: prompt }], maxTokens: 2500 });
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as {
      questions: { body: string; options: string[]; correct: number; explanation: string }[];
    };
    const questions = (json.questions ?? [])
      .filter((q) => q.body && Array.isArray(q.options) && q.options.length >= 2 && q.correct >= 0 && q.correct < q.options.length)
      .slice(0, count);
    if (questions.length === 0) throw new AiUnavailable("No usable questions came back.");
    return NextResponse.json({ questions });
  } catch (e) {
    const message = e instanceof AiUnavailable ? e.message : "The AI response couldn't be read.";
    return NextResponse.json({ error: `${message} Try again, or write the questions yourself.` }, { status: 502 });
  }
}
