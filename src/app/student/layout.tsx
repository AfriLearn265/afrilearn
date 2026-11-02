import { AppShell } from "@/components/app/AppShell";
import { requireRole } from "@/lib/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("student");
  return <AppShell session={session}>{children}</AppShell>;
}
