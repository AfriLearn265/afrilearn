import { requireRole } from "@/lib/auth";
import { WatchVideo } from "@/components/app/ClassVideos";

export const metadata = { title: "Watch" };

export default async function ParentWatch({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("parent");
  const { id } = await params;
  return <WatchVideo id={id} backHref="/parent/videos" backLabel="All class videos" />;
}
