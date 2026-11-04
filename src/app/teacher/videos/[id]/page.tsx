import { requireRole } from "@/lib/auth";
import { WatchVideo } from "@/components/app/ClassVideos";

export const metadata = { title: "Class video" };

export default async function TeacherWatch({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireRole("teacher");
  const { id } = await params;
  return <WatchVideo id={id} backHref="/teacher/videos" backLabel="All class videos" staff userId={userId} />;
}
