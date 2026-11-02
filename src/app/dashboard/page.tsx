import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";

// Sends every signed-in user to the right place for their role and status.
export default async function DashboardRouter({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string")).toString();
  redirect(homeFor(session.profile) + (qs ? `?${qs}` : ""));
}
