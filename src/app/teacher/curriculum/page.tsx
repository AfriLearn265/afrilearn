import { requireRole } from "@/lib/auth";
import { CurriculumManager } from "@/components/app/CurriculumManager";

export const metadata = { title: "Topics and notes" };

export default async function TeacherCurriculum({ searchParams }: { searchParams: Promise<{ class?: string; subject?: string; open?: string }> }) {
  await requireRole("teacher");
  const sp = await searchParams;
  return <CurriculumManager basePath="/teacher/curriculum" isAdmin={false} cls={sp.class} subject={sp.subject} open={sp.open} />;
}
