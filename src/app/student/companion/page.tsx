import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai";
import { PageHeader } from "@/components/app/AppShell";
import { Companion } from "./Companion";

export const metadata = { title: "Ask Tiko" };

export default async function CompanionPage() {
  const { userId } = await requireRole("student");
  const supabase = await createClient();
  const [{ data: history }, { data: me }] = await Promise.all([
    supabase.from("ai_messages").select("role, content").eq("student_id", userId).order("created_at", { ascending: false }).limit(12),
    supabase.from("students").select("classes(name, class_subjects(subjects(name)))").eq("profile_id", userId).single(),
  ]);
  const klass = me?.classes as unknown as { name: string; class_subjects: { subjects: { name: string } | null }[] } | null;
  const subjects = (klass?.class_subjects ?? []).map((c) => c.subjects?.name).filter((s): s is string => !!s).sort();
  return (
    <>
      <PageHeader title="Ask Tiko" intro={`Ask Tiko the tortoise anything about your lessons. You get simple explanations, examples and practice${klass ? ` for ${klass.name}` : ""}. Your school can check these chats to keep everyone safe.`} />
      <Companion initial={((history ?? []) as { role: "user" | "assistant"; content: string }[]).reverse()} configured={isAiConfigured()} subjects={subjects} />
    </>
  );
}
