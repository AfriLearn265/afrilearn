import { ReviewPage } from "@/components/exam/ReviewPage";

export const metadata = { title: "Result" };

export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <ReviewPage attemptId={attemptId} back="/student/results" backLabel="All results" />;
}
