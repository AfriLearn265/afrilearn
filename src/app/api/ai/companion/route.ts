import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AiUnavailable, complete, isAiConfigured, levelGuidance } from "@/lib/ai";

export const maxDuration = 60;

const MODES: Record<string, string> = {
  ask: "Answer the learner's academic question.",
  simpler: "Explain the idea again more simply, with a fresh everyday example.",
  example: "Give one or two worked examples, step by step.",
  practice: "Give three practice questions on the topic, numbered, then the answers at the end under the heading 'Answers'.",
  summary: "Write a short topic summary with the key points as a list.",
  revise: "Recommend what to revise next and why, as a short plan.",
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return NextResponse.json({ error: "Log in to ask Tiko." }, { status: 401 });

  const { data: setting } = await supabase.from("platform_settings").select("value").eq("key", "ai_companion_enabled").maybeSingle();
  if (setting && setting.value === false) return NextResponse.json({ error: "Ask Tiko is switched off by your school administrator." }, { status: 403 });
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "Tiko isn't connected to an AI service yet. Ask your administrator to add an AI key. Everything else works as normal." }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { message?: string; mode?: string; subject?: string; history?: { role: "user" | "assistant"; content: string }[] };
  const message = String(body.message ?? "").trim().slice(0, 2000);
  if (!message) return NextResponse.json({ error: "Type a question first." }, { status: 400 });

  const { data: remaining, error: quota } = await supabase.rpc("ai_log_message", { p_role: "user", p_content: message, p_subject: null });
  if (quota) return NextResponse.json({ error: quota.message }, { status: 429 });

  const { data: me } = await supabase.from("students").select("classes(name, education_levels(key))").eq("profile_id", uid).single();
  const klass = me?.classes as unknown as { name: string; education_levels: { key: string } | null } | null;

  const system = [
    "You are Tiko, a friendly, clever tortoise who helps Nigerian primary school pupils learn on AfriLearn. You are patient, warm, cheerful and accurate. Speak simply, as a kind older friend would.",
    levelGuidance(klass?.education_levels?.key, klass?.name),
    "Follow the Nigerian curriculum and use Nigerian names, places and naira in examples.",
    "Only help with learning. If asked for anything unsafe, personal or unrelated to school, kindly steer back to learning and suggest talking to a parent or teacher.",
    "Never ask for or repeat personal information such as addresses or phone numbers.",
    "For homework, guide the learner to the answer step by step rather than only giving the final answer.",
    "If you are not sure, say so and suggest checking with their teacher.",
    body.subject ? `Current subject: ${String(body.subject).slice(0, 60)}.` : "",
    `Task: ${MODES[body.mode ?? "ask"] ?? MODES.ask}`,
    "Format with short paragraphs and simple Markdown lists where helpful. Keep it under 250 words unless giving practice questions.",
  ].filter(Boolean).join("\n");

  const history = (body.history ?? []).slice(-8).map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
  try {
    const reply = await complete({ system, messages: [...history, { role: "user", content: message }], maxTokens: 900 });
    await supabase.rpc("ai_log_message", { p_role: "assistant", p_content: reply, p_subject: null });
    return NextResponse.json({ reply, remaining });
  } catch (e) {
    const msg = e instanceof AiUnavailable ? e.message : "Something went wrong.";
    return NextResponse.json({ error: `${msg} Please try again in a moment.` }, { status: 502 });
  }
}
