import { Award, ClipboardCheck, Flame, GraduationCap, Sparkles, Star, Trophy } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, timeAgo } from "@/lib/format";
import { PageHeader, Panel, EmptyState, Stat } from "@/components/app/AppShell";

export const metadata = { title: "Achievements" };

const icons: Record<string, typeof Award> = { sparkles: Sparkles, trophy: Trophy, "graduation-cap": GraduationCap, flame: Flame, "clipboard-check": ClipboardCheck, star: Star, award: Award };

export default async function Achievements() {
  const { userId } = await requireRole("student");
  const supabase = await createClient();
  const [{ data: me }, { data: badges }, { data: mine }, { data: certs }, { data: ledger }] = await Promise.all([
    supabase.from("students").select("points, streak_days").eq("profile_id", userId).single(),
    supabase.from("badges").select("id, key, name, description, icon").order("name"),
    supabase.from("student_badges").select("badge_id, awarded_at").eq("student_id", userId),
    supabase.from("certificates").select("id, title, certificate_no, issued_at").eq("student_id", userId).order("issued_at", { ascending: false }),
    supabase.from("points_ledger").select("id, points, reason, created_at").eq("student_id", userId).order("created_at", { ascending: false }).limit(15),
  ]);
  const earned = new Map((mine ?? []).map((b) => [b.badge_id, b.awarded_at]));

  return (
    <>
      <PageHeader title="Achievements" intro="Points come from finishing lessons, handing in work and completing tests. Badges mark milestones along the way." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Learning points" value={me?.points ?? 0} />
        <Stat label="Day streak" value={me?.streak_days ?? 0} />
        <Stat label="Badges" value={`${earned.size}/${(badges ?? []).length}`} />
        <Stat label="Certificates" value={(certs ?? []).length} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title="Badges">
            <ul className="grid gap-3 sm:grid-cols-2">
              {(badges ?? []).map((b) => {
                const Icon = icons[b.icon] ?? Award;
                const at = earned.get(b.id);
                return (
                  <li key={b.id} className={`flex gap-3 rounded-xl border p-4 ${at ? "border-sun-400 bg-sun-100/50" : "border-line opacity-60"}`}>
                    <span className={`grid size-11 shrink-0 place-items-center rounded-full ${at ? "bg-sun-400 text-ink" : "bg-wash text-muted"}`}><Icon className="size-5" aria-hidden="true" /></span>
                    <div><p className="font-semibold">{b.name}</p><p className="text-sm text-muted">{b.description}</p>{at && <p className="text-xs text-ink-soft">Earned {formatDate(at)}</p>}</div>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel title="Certificates">
            {(certs ?? []).length === 0 ? <EmptyState title="No certificates yet.">Complete every lesson in a course to earn one.</EmptyState> : (
              <ul className="grid gap-3">
                {(certs ?? []).map((c) => (
                  <li key={c.id} className="rounded-xl border-2 border-adire-700 p-5">
                    <p className="text-sm text-muted">Certificate of completion</p>
                    <p className="font-display text-xl font-bold">{c.title}</p>
                    <p className="mt-1 text-sm">Issued {formatDate(c.issued_at)}. Number <strong>{c.certificate_no}</strong>.</p>
                    <a href={`/verify?no=${c.certificate_no}`} target="_blank" className="mt-2 inline-block text-sm font-semibold text-adire-700 hover:underline">Public verification link</a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <Panel title="Recent points">
          {(ledger ?? []).length === 0 ? <p className="text-sm text-muted">Finish a lesson to earn your first points.</p> : (
            <ul className="divide-y divide-line text-sm">
              {(ledger ?? []).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span><span className="block">{l.reason}</span><span className="text-xs text-muted">{timeAgo(l.created_at)}</span></span>
                  <span className="font-display font-bold text-leaf-700 tabular">+{l.points}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
