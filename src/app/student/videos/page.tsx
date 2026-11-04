import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/AppShell";
import { ClassVideoGrid } from "@/components/app/ClassVideos";
import { Mascot } from "@/components/brand/Mascot";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Class videos" };

export default async function StudentVideos({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { userId, profile } = await requireRole("student");
  const { subject } = await searchParams;
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("class_id, classes(name)").eq("profile_id", userId).maybeSingle();
  const klass = me?.classes as unknown as { name: string } | null;

  if (!me?.class_id) {
    return (
      <>
        <PageHeader title="Class videos" />
        <div className="grid justify-items-center gap-4 rounded-[2rem] bg-sun-100 p-8 text-center">
          <Mascot pose="stand" prop="book" className="w-48" />
          <p className="font-display text-2xl font-semibold">Choose your class first</p>
          <p className="max-w-md text-ink-soft">Your videos depend on your class. Pick it on your profile page, then come back here.</p>
          <ButtonLink href="/student/profile">Go to my profile</ButtonLink>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`${klass?.name ?? "Class"} videos`} intro={`Hi ${firstName(profile.full_name)}! Your teachers made these videos for your class. Watch them as many times as you like.`} />
      <ClassVideoGrid classIds={[me.class_id]} basePath="/student/videos" subject={subject}
        emptyTitle="No videos for your class yet." emptyText="Your teachers are making them now. You will get a message when the first one is ready." />
    </>
  );
}
