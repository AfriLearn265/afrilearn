import { createClient } from "@/lib/supabase/server";

/** Opt-in leaderboard: first name and initial only, top 20. */
export async function Leaderboard({ classroomId }: { classroomId: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("classroom_leaderboard", { p_classroom: classroomId });
  if (error) return <p className="text-sm text-muted">{error.message}</p>;
  const rows = (data ?? []) as { rank: number; display_name: string; points: number; is_me: boolean }[];
  if (rows.length === 0) return <p className="text-sm text-muted">No one has joined the leaderboard yet. Students choose to appear here from their profile.</p>;
  return (
    <ol className="grid gap-1.5 text-sm">
      {rows.map((r, i) => (
        <li key={i} className={`flex items-center gap-3 rounded-lg px-2.5 py-1.5 ${r.is_me ? "bg-sun-100 font-semibold" : ""}`}>
          <span className="w-6 font-display font-bold tabular text-muted">{r.rank}</span>
          <span className="flex-1">{r.display_name}{r.is_me ? " (you)" : ""}</span>
          <span className="tabular">{r.points} pts</span>
        </li>
      ))}
    </ol>
  );
}
