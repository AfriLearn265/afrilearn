import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Megaphone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, timeAgo } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { Leaderboard } from "@/components/app/Leaderboard";

export const metadata = { title: "Classroom" };

export default async function StudentClassroom({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("student");
  const { id } = await params;
  const supabase = await createClient();
  const { data: room } = await supabase.from("classrooms").select("id, name, description, leaderboard_enabled, subjects(name), classes(name), profiles(full_name)").eq("id", id).maybeSingle();
  if (!room) notFound();
  const [{ data: news }, { data: work }, { data: tests }, { data: live }, { data: files }, { data: courses }] = await Promise.all([
    supabase.from("announcements").select("id, title, body, created_at").eq("classroom_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("assignments").select("id, title, due_at").eq("classroom_id", id).order("due_at", { ascending: false }).limit(8),
    supabase.from("examinations").select("id, title, duration_minutes").eq("classroom_id", id).eq("is_published", true).limit(8),
    supabase.from("live_classes").select("id, title, starts_at").eq("classroom_id", id).neq("status", "cancelled").gte("starts_at", new Date(Date.UTC(2000, 0)).toISOString()).order("starts_at", { ascending: false }).limit(5),
    supabase.from("learning_materials").select("id, title, storage_path, external_url").eq("classroom_id", id).order("created_at", { ascending: false }),
    supabase.from("courses").select("id, title, slug").eq("classroom_id", id).eq("is_published", true),
  ]);
  const one = <T,>(x: unknown) => x as T | null;
  const teacher = one<{ full_name: string }>(room.profiles)?.full_name;

  return (
    <>
      <PageHeader title={room.name} intro={[one<{ name: string }>(room.subjects)?.name, one<{ name: string }>(room.classes)?.name, teacher && `taught by ${teacher}`].filter(Boolean).join(", ")} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Announcements">
          {(news ?? []).length === 0 ? <EmptyState title="No announcements yet." /> : (
            <ul className="grid gap-4">
              {(news ?? []).map((n) => (
                <li key={n.id} className="flex gap-3">
                  <Megaphone className="mt-1 size-4 shrink-0 text-adire-700" aria-hidden="true" />
                  <div><p className="font-semibold">{n.title}</p><p className="whitespace-pre-line text-ink-soft">{n.body}</p><p className="text-xs text-muted">{timeAgo(n.created_at)}</p></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="grid content-start gap-6">
          <Panel title="Assignments">
            {(work ?? []).length === 0 ? <p className="text-sm text-muted">None yet.</p> : (
              <ul className="grid gap-2 text-sm">{(work ?? []).map((w) => <li key={w.id}><Link href={`/student/assignments/${w.id}`} className="font-semibold hover:underline">{w.title}</Link> <span className="text-muted">due {formatDateTime(w.due_at)}</span></li>)}</ul>
            )}
          </Panel>
          <Panel title="Tests">
            {(tests ?? []).length === 0 ? <p className="text-sm text-muted">None published.</p> : (
              <ul className="grid gap-2 text-sm">{(tests ?? []).map((t) => <li key={t.id}><Link href="/student/exams" className="font-semibold hover:underline">{t.title}</Link> <span className="text-muted">{t.duration_minutes} min</span></li>)}</ul>
            )}
          </Panel>
          {((courses ?? []).length > 0 || (files ?? []).length > 0) && (
            <Panel title="Courses and materials">
              <ul className="grid gap-2 text-sm">
                {(courses ?? []).map((c) => <li key={c.id}><Link href={`/student/courses/${c.slug}`} className="font-semibold hover:underline">{c.title}</Link></li>)}
                {(files ?? []).map((f) => <li key={f.id}><a href={f.storage_path ? `/api/files/materials?path=${encodeURIComponent(f.storage_path)}` : f.external_url ?? "#"} target="_blank" className="flex items-center gap-2 hover:underline"><FileText className="size-4 text-adire-700" aria-hidden="true" />{f.title}</a></li>)}
              </ul>
            </Panel>
          )}
          {(live ?? []).length > 0 && (
            <Panel title="Live classes"><ul className="grid gap-2 text-sm">{(live ?? []).map((l) => <li key={l.id}><Link href="/student/live" className="font-semibold hover:underline">{l.title}</Link> <span className="text-muted">{formatDateTime(l.starts_at)}</span></li>)}</ul></Panel>
          )}
          {room.leaderboard_enabled && <Panel title="Class leaderboard"><Leaderboard classroomId={room.id} /></Panel>}
        </div>
      </div>
    </>
  );
}
