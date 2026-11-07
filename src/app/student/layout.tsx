import { PupilShell } from "@/components/app/PupilShell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("student");
  const supabase = await createClient();
  const { data } = await supabase.from("students").select("classes(name)").eq("profile_id", session.userId).maybeSingle();
  const className = (data?.classes as unknown as { name: string } | null)?.name ?? null;
  return <PupilShell session={session} className={className}>{children}</PupilShell>;
}
