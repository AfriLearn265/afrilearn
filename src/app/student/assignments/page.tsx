import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";

export const metadata = { title: "Assignments" };

type Row = { id: string; title: string; due_at: string; total_marks: number; classrooms: { name: string } | null;
  assignment_submissions: { status: string; score: number | null; submitted_at: string }[] };

const statusBadge = (s: string) => ({
  Pending: "bg-wash text-ink-soft", Overdue: "bg-coral-100 text-coral-700", Submitted: "bg-adire-100 text-adire-800",
  "Late submission": "bg-sun-100 text-ink", Graded: "bg-leaf-100 text-leaf-700",
}[s] ?? "bg-wash");

const clock = () => Date.now();

export default async function StudentAssignments() {
  const { userId } = await requireRole("student");
  const supabase = await createClient();
  const { data } = await supabase.from("assignments")
    .select("id, title, due_at, total_marks, classrooms(name), assignment_submissions(status, score, submitted_at)")
    .eq("assignment_submissions.student_id", userId).order("due_at", { ascending: false });
  const now = clock();
  const rows = ((data ?? []) as unknown as Row[]).map((a) => {
    const s = a.assignment_submissions?.[0];
    const label = s ? (s.status === "graded" ? "Graded" : s.status === "late" ? "Late submission" : "Submitted")
      : new Date(a.due_at).getTime() < now ? "Overdue" : "Pending";
    return { ...a, sub: s, label };
  });

  return (
    <>
      <PageHeader title="Assignments" intro="Everything your teachers have set, with deadlines, your submissions and their feedback." />
      <Panel>
        {rows.length === 0 ? <EmptyState title="No assignments yet.">Join a classroom to receive assignments from your teacher.</EmptyState> : (
          <ul className="divide-y divide-line">
            {rows.map((a) => (
              <li key={a.id}>
                <Link href={`/student/assignments/${a.id}`} className="flex flex-wrap items-center gap-3 py-3.5 hover:opacity-80">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm text-muted">{a.classrooms?.name}, due {formatDateTime(a.due_at)}{a.sub ? `, handed in ${formatDateTime(a.sub.submitted_at)}` : ""}</p>
                  </div>
                  {a.sub?.status === "graded" && <span className="font-display font-bold tabular">{Number(a.sub.score)}/{Number(a.total_marks)}</span>}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge(a.label)}`}>{a.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
