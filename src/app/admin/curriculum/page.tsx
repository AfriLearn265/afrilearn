import { requireRole } from "@/lib/auth";
import { CurriculumManager } from "@/components/app/CurriculumManager";

export const metadata = { title: "Topics by term" };

export default async function AdminCurriculum({ searchParams }: { searchParams: Promise<{ class?: string; subject?: string; open?: string }> }) {
  await requireRole("admin");
  const sp = await searchParams;
  return <CurriculumManager basePath="/admin/curriculum" isAdmin cls={sp.class} subject={sp.subject} open={sp.open} />;
}
