import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, timeAgo } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { CopyButton } from "@/components/app/CopyButton";
import { MaterialUploader } from "@/components/app/MaterialUploader";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { postAnnouncement, saveAttendance, setMember, toggleLeaderboard } from "../actions";

export const metadata = { title: "Classroom" };

type Member = { id: string; status: string; enrolled_at: string; student_id: string; students: { points: number; streak_days: number; profiles: { full_name: string } | null } | null };

export default async function TeacherClassroom({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string }> }) {
  const { userId } = await requireRole("teacher");
  const { id } = await params;
  const { date } = await searchParams;
  const day = date ?? new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
  const supabase = await createClient();
  const { data: room } = await supabase.from("classrooms").select("id, name, join_code, leaderboard_enabled, subject_id, class_id, subjects(name), classes(name)").eq("id", id).eq("teacher_id", userId).maybeSingle();
  if (!room) notFound();
  const [{ data: members }, { data: news }, { data: att }, { data: files }] = await Promise.all([
    supabase.from("enrollments").select("id, status, enrolled_at, student_id, students(points, streak_days, profiles(full_name))").eq("classroom_id", id).order("enrolled_at"),
    supabase.from("announcements").select("id, title, body, created_at").eq("classroom_id", id).order("created_at", { ascending: false }).limit(6),
    supabase.from("attendance").select("student_id, status").eq("classroom_id", id).eq("attended_on", day).is("live_class_id", null),
    supabase.from("learning_materials").select("id, title, storage_path").eq("classroom_id", id).order("created_at", { ascending: false }),
  ]);
  const list = (members ?? []) as unknown as Member[];
  const active = list.filter((m) => m.status === "active");
  const marked = new Map((att ?? []).map((a) => [a.student_id, a.status]));
  const one = <T,>(x: unknown) => x as T | null;

  return (
    <>
      <PageHeader title={room.name} intro={[one<{ name: string }>(room.subjects)?.name, one<{ name: string }>(room.classes)?.name, `${active.length} students`].filter(Boolean).join(", ")}
        actions={<div className="flex items-center gap-2"><span className="rounded-xl bg-wash px-3 py-2 font-display font-bold tracking-[0.2em] text-adire-800">{room.join_code}</span><CopyButton value={room.join_code} label="Copy class code" /></div>} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title={`Attendance for ${formatDate(day)}`} action={
            <form className="flex items-center gap-2" action={`/teacher/classrooms/${id}`}>
              <label htmlFor="date" className="sr-only">Date</label>
              <input id="date" type="date" name="date" defaultValue={day} className="h-9 rounded-lg border border-line px-2 text-sm" />
              <button className="h-9 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-wash" type="submit">Go</button>
            </form>}>
            {active.length === 0 ? <EmptyState title="No students yet.">Share the class code {room.join_code}. Students enter it on their dashboard.</EmptyState> : (
              <ActionForm action={saveAttendance} submitLabel="Save attendance" resetOnSuccess={false}>
                <input type="hidden" name="classroom_id" value={id} /><input type="hidden" name="date" value={day} />
                <ul className="divide-y divide-line">
                  {active.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                      <span className="font-medium">{m.students?.profiles?.full_name}</span>
                      <fieldset className="flex gap-1" aria-label={`Attendance for ${m.students?.profiles?.full_name}`}>
                        {(["present", "late", "absent", "excused"] as const).map((s) => (
                          <label key={s} className="cursor-pointer">
                            <input type="radio" name={`att_${m.student_id}`} value={s} defaultChecked={(marked.get(m.student_id) ?? "present") === s} className="peer sr-only" />
                            <span className="inline-flex rounded-lg border border-line px-2.5 py-1 text-xs font-semibold capitalize peer-checked:border-adire-700 peer-checked:bg-adire-700 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-sun-300">{s}</span>
                          </label>
                        ))}
                      </fieldset>
                    </li>
                  ))}
                </ul>
              </ActionForm>
            )}
          </Panel>
          <Panel title="Students">
            {list.length === 0 ? <p className="text-sm text-muted">No one has joined yet.</p> : (
              <ul className="divide-y divide-line text-sm">
                {list.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1"><span className="block font-semibold">{m.students?.profiles?.full_name}</span><span className="text-muted">Joined {formatDate(m.enrolled_at)}, {m.students?.points ?? 0} points, {m.students?.streak_days ?? 0}-day streak</span></span>
                    <form action={setMember}>
                      <input type="hidden" name="enrollment_id" value={m.id} /><input type="hidden" name="classroom_id" value={id} />
                      <input type="hidden" name="status" value={m.status === "active" ? "removed" : "active"} />
                      <button type="submit" className={`font-semibold hover:underline ${m.status === "active" ? "text-coral-700" : "text-leaf-700"}`}>{m.status === "active" ? "Remove" : "Restore"}</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="grid content-start gap-6">
          <Panel title="Post an announcement">
            <ActionForm action={postAnnouncement} submitLabel="Post to class" pendingLabel="Posting">
              <input type="hidden" name="classroom_id" value={id} />
              <Field label="Title" htmlFor="a-title"><Input id="a-title" name="title" /></Field>
              <Field label="Message" htmlFor="a-body"><Textarea id="a-body" name="body" rows={3} /></Field>
            </ActionForm>
            {(news ?? []).length > 0 && (
              <ul className="mt-5 grid gap-3 border-t border-line pt-4 text-sm">
                {(news ?? []).map((n) => <li key={n.id}><p className="font-semibold">{n.title}</p><p className="text-ink-soft">{n.body}</p><p className="text-xs text-muted">{timeAgo(n.created_at)}</p></li>)}
              </ul>
            )}
          </Panel>
          <Panel title="Class materials">
            {(files ?? []).length > 0 && (
              <ul className="mb-4 grid gap-2 text-sm">{(files ?? []).map((f) => <li key={f.id}><a href={`/api/files/materials?path=${encodeURIComponent(f.storage_path ?? "")}`} target="_blank" className="flex items-center gap-2 hover:underline"><FileText className="size-4 text-adire-700" aria-hidden="true" />{f.title}</a></li>)}</ul>
            )}
            <MaterialUploader userId={userId} scope={`classrooms/${id}`} classroomId={id} subjectId={room.subject_id} classId={room.class_id} />
          </Panel>
          <Panel title="Quick links">
            <ul className="grid gap-2 text-sm font-semibold text-adire-700">
              <li><Link href={`/teacher/assignments?classroom=${id}`} className="hover:underline">Assignments for this class</Link></li>
              <li><Link href={`/teacher/gradebook?classroom=${id}`} className="hover:underline">Gradebook</Link></li>
              <li><Link href="/teacher/exams" className="hover:underline">Tests and examinations</Link></li>
              <li><Link href="/teacher/live" className="hover:underline">Schedule a live class</Link></li>
            </ul>
            <form action={toggleLeaderboard} className="mt-4 border-t border-line pt-4">
              <input type="hidden" name="classroom_id" value={id} /><input type="hidden" name="on" value={room.leaderboard_enabled ? "0" : "1"} />
              <p className="text-sm text-muted">Leaderboard is <strong>{room.leaderboard_enabled ? "on" : "off"}</strong>. Students choose whether to appear; only first names show.</p>
              <button type="submit" className="mt-2 text-sm font-semibold text-adire-700 hover:underline">{room.leaderboard_enabled ? "Turn leaderboard off" : "Turn leaderboard on"}</button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
