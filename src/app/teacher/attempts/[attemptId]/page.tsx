import { ReviewPage } from "@/components/exam/ReviewPage";

export const metadata = { title: "Mark attempt" };

export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <ReviewPage attemptId={attemptId} back="/teacher/exams" backLabel="All examinations" showStudent />;
}
