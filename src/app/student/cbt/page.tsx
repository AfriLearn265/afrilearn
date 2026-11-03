import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, pct } from "@/lib/format";
import { PageHeader, Panel, EmptyState, Stat } from "@/components/app/AppShell";
import { CbtLauncher, type CatalogueRow } from "./CbtLauncher";

export const metadata = { title: "CBT Centre" };

type Session = {
  id: string; status: string; percentage: number | null; started_at: string;
  examinations: { title: string; exam_type: string; exam_body: string | null; owner_student_id: string | null; subjects: { name: string } | null } | null;
};

export default async function CbtCentre({ searchParams }: { searchParams: Promise<{ body?: string }> }) {
  const { userId } = await requireRole("student");
  const { body } = await searchParams;
  const supabase = await createClient();
  const [{ data: catalogue }, { data: sessions }] = await Promise.all([
    supabase.rpc("cbt_catalogue"),
    supabase.from("exam_attempts")
      .select("id, status, percentage, started_at, examinations!inner(title, exam_type, exam_body, owner_student_id, subjects(name))")
      .eq("student_id", userId).not("examinations.owner_student_id", "is", null)
      .order("started_at", { ascending: false }).limit(30),
  ]);
  const rows = (catalogue ?? []) as CatalogueRow[];
  const past = (sessions ?? []) as unknown as Session[];
  const graded = past.filter((s) => s.status === "graded" && s.percentage != null);
  const avg = graded.length ? graded.reduce((n, s) => n + Number(s.percentage), 0) / graded.length : null;
  const bySubject = Object.values(graded.reduce<Record<string, { name: string; total: number; n: number }>>((acc, s) => {
    const k = s.examinations?.subjects?.name ?? "Other";
    acc[k] ??= { name: k, total: 0, n: 0 };
    acc[k].total += Number(s.percentage);
    acc[k].n += 1;
    return acc;
  }, {})).map((x) => ({ ...x, avg: x.total / x.n })).sort((a, b) => a.avg - b.avg);

  return (
    <>
      <PageHeader title="CBT Examination Centre" intro="Build a fresh paper from our question banks. Practice mode shows the answer after each question; mock mode is timed and marked at the end, like the real hall." />
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <Stat label="Sessions completed" value={graded.length} />
        <Stat label="Average score" value={pct(avg)} />
        <Stat label="Questions available" value={rows.reduce((n, r) => n + Number(r.question_count), 0)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="Start a session">
          {rows.length === 0 ? (
            <EmptyState title="Question banks are being prepared.">Teachers are writing and reviewing questions. Subjects appear here as soon as their questions are approved.</EmptyState>
          ) : (
            <CbtLauncher rows={rows} initialBody={body} />
          )}
        </Panel>
        <div className="grid content-start gap-6">
          <Panel title="Your weakest subjects first">
            {bySubject.length === 0 ? <p className="text-sm text-muted">Complete a session to see how you are doing in each subject.</p> : (
              <ul className="grid gap-3">
                {bySubject.map((s) => (
                  <li key={s.name} className="grid grid-cols-[1fr_auto] gap-1 text-sm">
                    <span className="font-medium">{s.name}</span><span className="tabular text-muted">{pct(s.avg)} over {s.n}</span>
                    <span className="col-span-2 h-2 overflow-hidden rounded-full bg-wash" aria-hidden="true">
                      <span className={`block h-full rounded-full ${s.avg >= 70 ? "bg-leaf-500" : s.avg >= 50 ? "bg-sun-400" : "bg-coral-500"}`} style={{ width: `${s.avg}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Recent sessions">
            {past.length === 0 ? <p className="text-sm text-muted">Your practice and mock sessions will be listed here.</p> : (
              <ul className="divide-y divide-line">
                {past.slice(0, 8).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.examinations?.title}</p>
                      <p className="text-muted">{formatDate(s.started_at)}</p>
                    </div>
                    {s.status === "in_progress"
                      ? <Link href={`/exam/${s.id}`} className="font-semibold text-adire-700 hover:underline">Continue</Link>
                      : <Link href={`/student/results/${s.id}`} className="font-semibold text-adire-700 hover:underline tabular">{pct(s.percentage)}</Link>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
