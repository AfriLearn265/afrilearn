import { Video } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Live classes" };

type Live = { id: string; title: string; description: string | null; starts_at: string; duration_minutes: number; status: string; classrooms: { name: string } | null };
const clock = () => Date.now();

export default async function StudentLive() {
  const { userId } = await requireRole("student");
  const supabase = await createClient();
  const now = clock();
  const [{ data }, { data: attended }] = await Promise.all([
    supabase.from("live_classes").select("id, title, description, starts_at, duration_minutes, status, classrooms(name)")
      .gte("starts_at", new Date(now - 7 * 86400000).toISOString()).order("starts_at"),
    supabase.from("attendance").select("live_class_id, status").eq("student_id", userId).not("live_class_id", "is", null),
  ]);
  const seen = new Map((attended ?? []).map((a) => [a.live_class_id, a.status]));
  const list = (data ?? []) as unknown as Live[];
  const live = (l: Live) => l.status === "live";
  // A class the teacher is running stays joinable for an hour past its slot.
  const endsAt = (l: Live) => new Date(l.starts_at).getTime() + (l.duration_minutes + (live(l) ? 60 : 0)) * 60000;
  const upcoming = list.filter((l) => endsAt(l) > now && l.status !== "cancelled" && l.status !== "ended")
    .sort((a, b) => Number(live(b)) - Number(live(a)));
  const past = list.filter((l) => !upcoming.includes(l)).reverse();

  return (
    <>
      <PageHeader title="Live classes" intro="A Join button appears here as soon as your teacher starts the class. Your attendance is recorded when you join." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Upcoming">
          {upcoming.length === 0 ? <EmptyState title="No live classes scheduled.">You&apos;ll get a notification when your teacher schedules one.</EmptyState> : (
            <ul className="divide-y divide-line">
              {upcoming.map((l) => {
                const start = new Date(l.starts_at).getTime();
                const open = live(l) || now >= start - 15 * 60000;
                return (
                  <li key={l.id} className="flex flex-wrap items-center gap-4 py-4">
                    <span className={`grid size-11 place-items-center rounded-xl ${open ? "bg-coral-500 text-white" : "bg-wash text-adire-700"}`}><Video className="size-5" aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{l.title}{live(l) && <span className="ml-2 inline-flex rounded-full bg-coral-500 px-2 py-0.5 align-middle text-xs font-bold text-white">Live now</span>}</p>
                      <p className="text-sm text-muted">{l.classrooms?.name}, {formatDateTime(l.starts_at)}, {l.duration_minutes} min</p>
                    </div>
                    {open ? <ButtonLink href={`/live/${l.id}`} variant="accent">Join now</ButtonLink> : <span className="text-sm text-muted">Opens when your teacher starts</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="Recent">
          {past.length === 0 ? <p className="text-sm text-muted">No past classes this week.</p> : (
            <ul className="divide-y divide-line text-sm">
              {past.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span><span className="block font-medium">{l.title}</span><span className="text-muted">{formatDateTime(l.starts_at)}</span></span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${seen.get(l.id) ? "bg-leaf-100 text-leaf-700" : "bg-coral-100 text-coral-700"}`}>{seen.get(l.id) ? `Attended (${seen.get(l.id)})` : "Missed"}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
