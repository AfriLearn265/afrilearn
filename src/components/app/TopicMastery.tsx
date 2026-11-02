export type MasteryRow = { subject_name: string; topic: string; answered: number; correct: number; percent: number };

/** Topics sorted weakest first: green is mastered (70%+), coral needs revision. */
export function TopicMastery({ rows, limit = 10 }: { rows: MasteryRow[]; limit?: number }) {
  if (rows.length === 0) return <p className="text-sm text-muted">Answer some questions in tests or the CBT Centre to see which topics you have mastered.</p>;
  const sorted = [...rows].sort((a, b) => Number(a.percent) - Number(b.percent)).slice(0, limit);
  return (
    <ul className="grid gap-3">
      {sorted.map((r) => {
        const p = Number(r.percent);
        const tone = p >= 70 ? "bg-leaf-500" : p >= 50 ? "bg-sun-400" : "bg-coral-500";
        return (
          <li key={`${r.subject_name}-${r.topic}`} className="text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate"><span className="font-semibold">{r.topic}</span> <span className="text-muted">{r.subject_name}</span></p>
              <p className="shrink-0 tabular text-muted">{r.correct}/{r.answered}, {p >= 70 ? "mastered" : "revise"}</p>
            </div>
            <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-wash" aria-hidden="true">
              <span className={`block h-full rounded-full ${tone}`} style={{ width: `${Math.max(4, p)}%` }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
