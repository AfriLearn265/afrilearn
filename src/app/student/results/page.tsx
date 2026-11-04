import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, pct } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { TopicMastery } from "@/components/app/TopicMastery";

export const metadata = { title: "Results" };

type Row = {
  id: string; status: string; percentage: number | null; score: number | null; max_score: number | null; submitted_at: string | null;
  examinations: { title: string; exam_type: string; owner_student_id: string | null; subjects: { name: string } | null } | null;
  results: { grade: string; passed: boolean } | null;
};

export default async function Results() {
  const { userId } = await requireRole("student");
  const supabase = await createClient();
  const [{ data }, { data: mastery }] = await Promise.all([
    supabase.from("exam_attempts")
      .select("id, status, percentage, score, max_score, submitted_at, examinations(title, exam_type, owner_student_id, subjects(name)), results(grade, passed)")
      .eq("student_id", userId).neq("status", "in_progress").order("submitted_at", { ascending: false }),
    supabase.rpc("student_topic_mastery", { p_student: userId }),
  ]);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader title="Results" intro="Every test and practice quiz you have finished, with a full review of each." />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel>
          {rows.length === 0 ? (
            <EmptyState title="No results yet.">Take a test from your classroom or a practice quiz.</EmptyState>
          ) : (
            <div className="-mx-5 overflow-x-auto md:-mx-6">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="text-muted"><tr className="border-b border-line">
                  <th className="px-5 py-2.5 font-medium md:px-6">Assessment</th><th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Score</th><th className="px-3 py-2.5 font-medium">Grade</th><th className="px-5 md:px-6" />
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-5 py-3 md:px-6">
                        <p className="font-semibold">{r.examinations?.title}</p>
                        <p className="text-muted">{r.examinations?.subjects?.name}{r.examinations?.owner_student_id ? ", practice quiz" : ""}</p>
                      </td>
                      <td className="px-3 py-3 text-muted">{r.submitted_at ? formatDate(r.submitted_at) : "–"}</td>
                      <td className="px-3 py-3 font-semibold tabular">{r.status === "graded" ? pct(r.percentage) : "Marking"}</td>
                      <td className="px-3 py-3">{r.results ? <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${r.results.passed ? "bg-leaf-100 text-leaf-700" : "bg-coral-100 text-coral-700"}`}>{r.results.grade}</span> : "–"}</td>
                      <td className="px-5 py-3 text-right md:px-6"><Link href={`/student/results/${r.id}`} className="font-semibold text-adire-700 hover:underline">Review</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Topics to revise">
          <TopicMastery rows={(mastery ?? []) as { subject_name: string; topic: string; answered: number; correct: number; percent: number }[]} />
        </Panel>
      </div>
    </>
  );
}
