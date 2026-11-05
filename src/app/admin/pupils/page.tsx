import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import { PageHeader, Panel } from "@/components/app/AppShell";
import { BulkPupilsForm } from "./BulkPupilsForm";

export const metadata = { title: "Add pupils" };

export default async function AddPupilsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const [{ data: classes }, { data: rooms }] = await Promise.all([
    supabase.from("classes").select("code, name").eq("is_active", true).order("sort_order"),
    supabase.from("classrooms").select("id, name, classes(code)").eq("is_archived", false).order("name"),
  ]);
  const roomList = ((rooms ?? []) as unknown as { id: string; name: string; classes: { code: string } | null }[])
    .map((r) => ({ id: r.id, name: r.name, class_code: r.classes?.code ?? null }));
  return (
    <>
      <PageHeader title="Add a whole class" intro="Paste the names from your class register. Every pupil gets a simple login ID and password, ready to print on a card. No email addresses are needed." />
      <Panel>
        <BulkPupilsForm classes={classes ?? []} rooms={roomList} site={siteUrl().replace(/^https?:\/\//, "")} />
      </Panel>
    </>
  );
}
