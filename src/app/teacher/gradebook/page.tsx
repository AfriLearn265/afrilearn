import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";

export const metadata = { title: "Gradebook" };

type Member = { student_id: string; students: { profiles: { full_name: string } | null } | null };

export default async function Gradebook({ searchParams }: { searchParams: Promise<{ classroom?: string }> }) {
  const { userId } = await requireRole("teacher");
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: rooms } = await supabase.from("classrooms").select("id, name").eq("teacher_id", userId).eq("is_archived", false).order("name");
  const roomId = sp.classroom ?? rooms?.[0]?.id;
  if (!roomId) return (<><PageHeader title="Gradebook" /><EmptyState title="Create a classroom to start your gradebook." /></>);

  const [{ data: members }, { data: work }, { data: exams }, { data: att }] = await Promise.all([
    supabase.from("enrollments").select("student_id, students(profiles(full_name))").eq("classroom_id", roomId).eq("status", "active"),
    supabase.from("assignments").select("id, title, total_marks, due_at, assignment_submissions(student_id, score, status)").eq("classroom_id", roomId).order("due_at"),
    supabase.from("examinations").select("id, title, exam_attempts(student_id, percentage, status)").eq("classroom_id", roomId).order("created_at"),
    supabase.from("attendance").select("student_id, status").eq("classroom_id", roomId),
  ]);
  const students = ((members ?? []) as unknown as Member[]).map((m) => ({ id: m.student_id, name: m.students?.profiles?.full_name ?? "Student" })).sort((a, b) => a.name.localeCompare(b.name));
  type Col = { id: string; label: string; kind: "a" | "e"; max: number; cell: Map<string, number | null> };
  const cols: Col[] = [
    ...(work ?? []).map((w) => ({
      id: w.id, label: w.title, kind: "a" as const, max: Number(w.total_marks),
      cell: new Map((w.assignment_submissions as { student_id: string; score: number | null; status: string }[]).map((s) => [s.student_id, s.status === "graded" ? Number(s.score) : null])),
    })),
    ...(exams ?? []).map((e) => {
      const best = new Map<string, number | null>();
      (e.exam_attempts as { student_id: string; percentage: number | null; status: string }[]).forEach((t) => {
        if (t.status !== "graded") { if (!best.has(t.student_id)) best.set(t.student_id, null); return; }
        best.set(t.student_id, Math.max(best.get(t.student_id) ?? 0, Number(t.percentage)));
      });
      return { id: e.id, label: e.title, kind: "e" as const, max: 100, cell: best };
    }),
  ];
  const attendance = (att ?? []).reduce<Record<string, { p: number; n: number }>>((acc, r) => {
    acc[r.student_id] ??= { p: 0, n: 0 };
    acc[r.student_id].n += 1;
    if (r.status === "present" || r.status === "late") acc[r.student_id].p += 1;
    return acc;
  }, {});
  const avg = (sid: string) => {
    const vals = cols.map((c) => { const v = c.cell.get(sid); return v == null ? null : (v / c.max) * 100; }).filter((v): v is number => v !== null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  const tone = (p: number | null) => (p == null ? "" : p >= 70 ? "text-leaf-700" : p >= 50 ? "" : "text-coral-700");

  return (
    <>
      <PageHeader title="Gradebook" intro="Assignment scores, best test results and attendance for every student, in one table."
        actions={
          <form action="/teacher/gradebook" className="flex gap-2">
            <label htmlFor="classroom" className="sr-only">Classroom</label>
            <select id="classroom" name="classroom" defaultValue={roomId} className="h-10 rounded-xl border border-line bg-white px-3 text-sm">{(rooms ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
            <button type="submit" className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-semibold hover:bg-wash">Show</button>
          </form>
        } />
      <Panel>
        {students.length === 0 ? <EmptyState title="No students in this classroom yet." /> : (
          <div className="-mx-5 overflow-x-auto md:-mx-6">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Gradebook</caption>
              <thead><tr className="border-b border-line text-muted">
                <th scope="col" className="sticky left-0 bg-white px-5 py-3 font-medium md:px-6">Student</th>
                {cols.map((c) => (
                  <th key={c.id} scope="col" className="max-w-36 px-3 py-3 font-medium">
                    <Link href={c.kind === "a" ? `/teacher/assignments/${c.id}` : `/teacher/exams/${c.id}`} className="line-clamp-2 hover:text-ink">{c.label}</Link>
                    <span className="text-xs">{c.kind === "a" ? `/${c.max}` : "%"}</span>
                  </th>
                ))}
                <th scope="col" className="px-3 py-3 font-medium">Average</th>
                <th scope="col" className="px-3 py-3 font-medium">Attendance</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {students.map((s) => {
                  const a = avg(s.id);
                  const at = attendance[s.id];
                  return (
                    <tr key={s.id}>
                      <th scope="row" className="sticky left-0 bg-white px-5 py-3 font-semibold md:px-6">{s.name}</th>
                      {cols.map((c) => {
                        const v = c.cell.get(s.id);
                        return <td key={c.id} className={`px-3 py-3 tabular ${tone(v == null ? null : (v / c.max) * 100)}`}>{v === undefined ? <span className="text-faint">–</span> : v === null ? <span className="text-sun-600">to mark</span> : c.kind === "e" ? `${Math.round(v)}%` : v}</td>;
                      })}
                      <td className={`px-3 py-3 font-semibold tabular ${tone(a)}`}>{a == null ? "–" : `${a}%`}</td>
                      <td className="px-3 py-3 tabular">{at ? `${Math.round((at.p / at.n) * 100)}%` : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
