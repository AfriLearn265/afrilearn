import "server-only";

/**
 * Provider-agnostic AI helper. Configure with environment variables only:
 *   AI_PROVIDER=anthropic + ANTHROPIC_API_KEY (+ AI_MODEL, default claude-haiku-5-5)
 *   AI_PROVIDER=openai    + OPENAI_API_KEY    (+ AI_MODEL, default gpt-4o-mini)
 * Keys never reach the browser: every call goes through a server route.
 */
type Msg = { role: "user" | "assistant"; content: string };

export function aiProvider(): "anthropic" | "openai" | null {
  const p = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();
  if (p === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export const isAiConfigured = () => aiProvider() !== null;

export class AiUnavailable extends Error {}

export async function complete({ system, messages, maxTokens = 900 }: { system: string; messages: Msg[]; maxTokens?: number }) {
  const provider = aiProvider();
  if (!provider) throw new AiUnavailable("The AI service is not configured.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model: process.env.AI_MODEL || "claude-haiku-5-5", max_tokens: maxTokens, system, messages }),
      });
      if (!res.ok) throw new AiUnavailable(`The AI service returned ${res.status}.`);
      const json = (await res.json()) as { content?: { type: string; text?: string }[] };
      return (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
    }
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.AI_MODEL || "gpt-4o-mini", max_tokens: maxTokens, messages: [{ role: "system", content: system }, ...messages] }),
    });
    if (!res.ok) throw new AiUnavailable(`The AI service returned ${res.status}.`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content?.trim() ?? "";
  } catch (e) {
    if (e instanceof AiUnavailable) throw e;
    throw new AiUnavailable("The AI service did not respond in time.");
  } finally {
    clearTimeout(timeout);
  }
}

/** How the companion should speak to each stage of school. */
export function levelGuidance(level: string | null | undefined, className: string | null | undefined) {
  switch (level) {
    case "nursery":
      return `The learner is in ${className ?? "Nursery"} (about 3 to 5 years old) and a parent is probably reading with them. Use very short sentences, everyday Nigerian examples (oranges, buses, market), counting with objects, and lots of encouragement. Never more than 4 short sentences.`;
    case "primary":
      return `The learner is in ${className ?? "Primary school"} (about 6 to 11 years old). Use simple words, short paragraphs, friendly examples from Nigerian daily life, and one idea at a time. Check understanding with a small question.`;
    case "junior_secondary":
      return `The learner is in ${className ?? "Junior Secondary"} (about 11 to 14). Explain clearly in steps, define new terms, and use worked examples that follow the Nigerian Basic Education curriculum.`;
    case "senior_secondary":
      return `The learner is in ${className ?? "Senior Secondary"} (about 14 to 18). Be precise, show full working, and connect explanations to WAEC and NECO expectations.`;
    case "exam_prep":
      return `The learner is preparing for ${className ?? "WAEC, NECO or JAMB"}. Be exam-focused: give the method, common traps, quick checks, and how marks are usually awarded.`;
    default:
      return "Adapt to a secondary school learner in Nigeria.";
  }
}
