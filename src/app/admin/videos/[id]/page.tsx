import { requireRole } from "@/lib/auth";
import { WatchVideo } from "@/components/app/ClassVideos";

export const metadata = { title: "Class video" };

export default async function AdminWatch({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireRole("admin");
  const { id } = await params;
  return <WatchVideo id={id} backHref="/admin/videos" backLabel="All class videos" staff isAdmin userId={userId} />;
}
