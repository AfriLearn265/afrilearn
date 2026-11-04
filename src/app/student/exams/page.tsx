import Link from "next/link";
import { Clock3, FileQuestion } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, pct } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { ButtonLink } from "@/components/ui/Button";
import { startExam } from "../exam-actions";

export const metadata = { title: "Examinations" };

type Exam = {
  id: string; title: string; exam_type: string; duration_minutes: number; max_attempts: number | null;
  available_from: string | null; available_until: string | null; instructions: string | null;
  subjects: { name: string } | null; classrooms: { name: string } | null; exam_questions: { count: number }[];
};
type Attempt = { id: string; exam_id: string; status: string; percentage: number | null; submitted_at: string | null; started_at: string; expires_at: string };

const clock = () => Date.now();

export default async function StudentExams() {
  const { userId } = await requireRole("student");
  const supabase = await createClient();
  const [{ data: exams }, { data: attempts }] = await Promise.all([
    supabase.from("examinations")
      .select("id, title, exam_type, duration_minutes, max_attempts, available_from, available_until, instructions, subjects(name), classrooms(name), exam_questions(count)")
      .eq("is_published", true).is("owner_student_id", null)
      .order("created_at", { ascending: false }),
    supabase.from("exam_attempts").select("id, exam_id, status, percentage, submitted_at, started_at, expires_at")
      .eq("student_id", userId).order("started_at", { ascending: false }),
  ]);
  const list = (exams ?? []) as unknown as Exam[];
  const mine = (attempts ?? []) as Attempt[];
  const now = clock();

  return (
    <>
      <PageHeader title="Tests" intro="Tests your teachers set for your classrooms. For extra practice at your own pace, try the practice quizzes."
        actions={<ButtonLink href="/student/cbt" variant="accent">Practice quizzes</ButtonLink>} />
      {list.length === 0 ? (
        <EmptyState title="No tests have been set for your classrooms yet.">When a teacher publishes a test, it appears here and you get a notification.</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((e) => {
            const tries = mine.filter((a) => a.exam_id === e.id);
            const running = tries.find((a) => a.status === "in_progress" && new Date(a.expires_at).getTime() > now);
            const done = tries.filter((a) => a.status !== "in_progress");
            const best = done.reduce<number | null>((b, a) => (a.percentage != null && (b == null || Number(a.percentage) > b) ? Number(a.percentage) : b), null);
            const used = e.max_attempts != null && tries.length >= e.max_attempts && !running;
            const notYet = e.available_from && new Date(e.available_from).getTime() > now;
            const closed = e.available_until && new Date(e.available_until).getTime() < now;
            return (
              <li key={e.id}>
                <Panel>
                  <p className="text-sm text-muted">{[e.classrooms?.name ?? "Open to all students", e.subjects?.name].filter(Boolean).join(", ")}</p>
                  <h2 className="mt-1 text-xl font-bold">{e.title}</h2>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                    <span className="inline-flex items-center gap-1.5"><FileQuestion className="size-4" aria-hidden="true" />{e.exam_questions?.[0]?.count ?? 0} questions</span>
                    <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" aria-hidden="true" />{e.duration_minutes} minutes</span>
                    <span>{e.max_attempts ? `${e.max_attempts} attempt${e.max_attempts > 1 ? "s" : ""} allowed` : "Unlimited attempts"}</span>
                  </p>
                  {e.available_until && <p className="mt-1 text-sm text-muted">Closes {formatDateTime(e.available_until)}</p>}
                  {e.instructions && <p className="mt-3 text-sm text-muted">{e.instructions}</p>}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {running ? (
                      <ButtonLink href={`/exam/${running.id}`} variant="accent">Continue test</ButtonLink>
                    ) : notYet ? (
                      <p className="text-sm font-semibold">Opens {formatDateTime(e.available_from!)}</p>
                    ) : closed ? (
                      <p className="text-sm font-semibold text-muted">Closed</p>
                    ) : used ? (
                      <p className="text-sm font-semibold text-muted">All attempts used</p>
                    ) : (
                      <ActionForm action={startExam} submitLabel={done.length ? "Try again" : "Start test"} pendingLabel="Preparing your paper" resetOnSuccess={false}>
                        <input type="hidden" name="exam_id" value={e.id} />
                      </ActionForm>
                    )}
                    {done[0] && (
                      <Link href={`/student/results/${done[0].id}`} className="text-sm font-semibold text-adire-700 hover:underline">
                        {done[0].status === "graded" ? `Best score ${pct(best)}, see result` : "Awaiting marking"}
                      </Link>
                    )}
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
