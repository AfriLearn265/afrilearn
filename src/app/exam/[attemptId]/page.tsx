import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Notice } from "@/components/ui/Field";
import { ButtonLink } from "@/components/ui/Button";
import { ExamRunner } from "./ExamRunner";

export const metadata = { title: "Examination" };

export default async function ExamPage({ params }: { params: Promise<{ attemptId: string }> }) {
  await requireRole("student");
  const { attemptId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_attempt", { p_attempt: attemptId });
  if (error || !data) {
    return (
      <main className="container-page grid min-h-dvh max-w-lg content-center gap-4">
        <Notice tone="error" title="This examination couldn't be opened.">{error?.message}</Notice>
        <ButtonLink href="/student/exams" variant="outline">Back to examinations</ButtonLink>
      </main>
    );
  }
  if ((data as { attempt: { status: string } }).attempt.status !== "in_progress") redirect(`/student/results/${attemptId}`);
  return <ExamRunner initial={data} />;
}
