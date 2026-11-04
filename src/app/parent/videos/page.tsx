import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/app/AppShell";
import { ClassVideoGrid } from "@/components/app/ClassVideos";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Class videos" };

type Row = { students: { class_id: string | null; profiles: { full_name: string } | null; classes: { name: string } | null } | null };

export default async function ParentVideos({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { userId } = await requireRole("parent");
  const { subject } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("parent_children").select("students(class_id, profiles(full_name), classes(name))").eq("parent_id", userId);
  const kids = ((data ?? []) as unknown as Row[]).map((r) => r.students).filter((s): s is NonNullable<Row["students"]> => !!s?.class_id);
  const classIds = [...new Set(kids.map((k) => k.class_id!))];
  const who = kids.map((k) => `${k.profiles?.full_name?.split(" ")[0]} (${k.classes?.name})`).join(", ");

  return (
    <>
      <PageHeader title="Class videos" intro={kids.length ? `The videos teachers have shared with your children's classes: ${who}. Watch together and talk about them.` : undefined} />
      {kids.length === 0 ? (
        <EmptyState title="Add a child to see their class videos." action={<ButtonLink href="/parent">Go to my children</ButtonLink>}>
          Once a child is linked, every video for their class shows up here.
        </EmptyState>
      ) : (
        <ClassVideoGrid classIds={classIds} basePath="/parent/videos" subject={subject} showClass={classIds.length > 1}
          emptyTitle="No videos for these classes yet." emptyText="Teachers are adding them now. Check back soon." />
      )}
    </>
  );
}
