import { requireRole } from "@/lib/auth";
import { StaffVideos } from "@/components/app/StaffVideos";

export const metadata = { title: "Class videos" };

export default async function AdminVideos({ searchParams }: { searchParams: Promise<{ class?: string; subject?: string }> }) {
  const { userId } = await requireRole("admin");
  const sp = await searchParams;
  return <StaffVideos userId={userId} basePath="/admin/videos" isAdmin cls={sp.class} subject={sp.subject} />;
}
