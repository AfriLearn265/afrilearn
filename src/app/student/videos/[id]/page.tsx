import { requireRole } from "@/lib/auth";
import { WatchVideo } from "@/components/app/ClassVideos";

export const metadata = { title: "Watch" };

export default async function StudentWatch({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireRole("student");
  const { id } = await params;
  return <WatchVideo id={id} backHref="/student/videos" backLabel="All my class videos" studentId={userId} />;
}
