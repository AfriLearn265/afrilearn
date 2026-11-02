import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/AppShell";
import { Messages } from "@/components/app/Messages";

export const metadata = { title: "Messages" };

export default async function TeacherMessages({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { userId } = await requireRole("teacher");
  const { t } = await searchParams;
  const supabase = await createClient();
  const { data: rooms } = await supabase.from("classrooms").select("id").eq("teacher_id", userId);
  const { data: members } = (rooms ?? []).length
    ? await supabase.from("enrollments").select("student_id").in("classroom_id", (rooms ?? []).map((r) => r.id)).eq("status", "active")
    : { data: [] };
  const studentIds = [...new Set((members ?? []).map((m) => m.student_id))];
  const { data: links } = studentIds.length ? await supabase.from("parent_children").select("parent_id, student_id").in("student_id", studentIds) : { data: [] };
  const ids = [...new Set((links ?? []).flatMap((l) => [l.parent_id, l.student_id]))];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const name = new Map((people ?? []).map((p) => [p.id, p.full_name]));
  const pairs = (links ?? []).map((l) => ({ value: `${l.student_id}:${l.parent_id}`, label: `${name.get(l.parent_id)}, parent of ${name.get(l.student_id)}` }));
  return (
    <>
      <PageHeader title="Messages" intro="Talk with the parents and guardians of your students. Teachers never message students privately." />
      <Messages basePath="/teacher/messages" threadId={t} pairs={pairs} />
    </>
  );
}
