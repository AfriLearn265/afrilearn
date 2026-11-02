import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/AppShell";
import { Messages } from "@/components/app/Messages";

export const metadata = { title: "Messages" };

type Row = { student_id: string; classrooms: { name: string; teacher_id: string; profiles: { full_name: string } | null } | null };

export default async function ParentMessages({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { userId } = await requireRole("parent");
  const { t } = await searchParams;
  const supabase = await createClient();
  const { data: kids } = await supabase.from("parent_children").select("student_id").eq("parent_id", userId);
  const kidIds = (kids ?? []).map((k) => k.student_id);
  const [{ data: rows }, { data: kidNames }] = await Promise.all([
    kidIds.length ? supabase.from("enrollments").select("student_id, classrooms(name, teacher_id, profiles(full_name))").in("student_id", kidIds).eq("status", "active") : Promise.resolve({ data: [] }),
    kidIds.length ? supabase.from("profiles").select("id, full_name").in("id", kidIds) : Promise.resolve({ data: [] }),
  ]);
  const kidName = new Map((kidNames ?? []).map((k) => [k.id, k.full_name]));
  const seen = new Set<string>();
  const pairs = ((rows ?? []) as unknown as Row[]).filter((r) => r.classrooms).map((r) => ({
    value: `${r.student_id}:${r.classrooms!.teacher_id}`,
    label: `${r.classrooms!.profiles?.full_name ?? "Teacher"} (${r.classrooms!.name}), about ${kidName.get(r.student_id)}`,
  })).filter((p) => (seen.has(p.value) ? false : (seen.add(p.value), true)));
  return (
    <>
      <PageHeader title="Messages" intro="Write to your children's teachers. Conversations are moderated to keep everyone safe." />
      <Messages basePath="/parent/messages" threadId={t} pairs={pairs} />
    </>
  );
}
