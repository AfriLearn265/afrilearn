import { requireRole } from "@/lib/auth";
import { StaffVideos } from "@/components/app/StaffVideos";

export const metadata = { title: "Class videos" };

export default async function TeacherVideos({ searchParams }: { searchParams: Promise<{ class?: string; subject?: string; mine?: string }> }) {
  const { userId } = await requireRole("teacher");
  const sp = await searchParams;
  return <StaffVideos userId={userId} basePath="/teacher/videos" isAdmin={false} cls={sp.class} subject={sp.subject} mine={sp.mine === "1"} />;
}
