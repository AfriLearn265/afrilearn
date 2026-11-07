import Link from "next/link";
import clsx from "clsx";
import { Check, Minus } from "lucide-react";
import { FIXED_WEEKS, weekLabel } from "@/config/subjects";

export type SchemeTopic = {
  code: string; title: string; theme: string | null; sub_theme: string | null; sort_order: number;
  week_start: number | null; week_end: number | null;
  hasVideo?: boolean; hasNotes?: boolean; hasQuiz?: boolean;
};

/**
 * One term's scheme of work: week by week, the theme and topic, with the fixed weeks
 * (resumption, revision, examination) in place. Prints cleanly on A4.
 */
export function SchemeTable({ topics, showResources, topicHref, accent = "bg-grape-600" }: {
  topics: SchemeTopic[]; showResources?: boolean; topicHref?: (code: string) => string; accent?: string;
}) {
  const sorted = [...topics].sort((a, b) => (a.week_start ?? 99) - (b.week_start ?? 99) || a.sort_order - b.sort_order);
  const fixed = (at: "start" | "end") => FIXED_WEEKS.filter((w) => w.at === at).map((w) => (
    <tr key={`w${w.week}`} className="bg-wash/70 print:bg-transparent">
      <td className="whitespace-nowrap px-4 py-3 font-display font-semibold">Week {w.week}</td>
      <td className="px-4 py-3 text-muted" colSpan={showResources ? 5 : 2}>{w.label}</td>
    </tr>
  ));
  return (
    <div className="overflow-x-auto rounded-[1.4rem] border-2 border-line bg-white print:overflow-visible print:rounded-none print:border-ink">
      <table className="w-full min-w-[34rem] text-left text-[0.97rem] print:min-w-0 print:text-[11pt]">
        <thead>
          <tr className={clsx("text-white print:bg-transparent print:text-ink", accent)}>
            <th scope="col" className="w-28 px-4 py-3 font-display font-semibold">Week</th>
            <th scope="col" className="px-4 py-3 font-display font-semibold">Theme</th>
            <th scope="col" className="px-4 py-3 font-display font-semibold">Topic</th>
            {showResources && (
              <>
                <th scope="col" className="w-16 px-2 py-3 text-center font-display text-sm font-semibold">Video</th>
                <th scope="col" className="w-16 px-2 py-3 text-center font-display text-sm font-semibold">Notes</th>
                <th scope="col" className="w-16 px-2 py-3 text-center font-display text-sm font-semibold">Quiz</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-line print:divide-ink/30">
          {fixed("start")}
          {sorted.map((t) => (
            <tr key={t.code} className="break-inside-avoid">
              <td className="whitespace-nowrap px-4 py-3 font-display font-semibold">{weekLabel(t.week_start, t.week_end) ?? "–"}</td>
              <td className="px-4 py-3 text-sm text-ink-soft">{t.theme}{t.sub_theme && t.sub_theme !== t.theme ? <span className="block text-xs text-muted">{t.sub_theme}</span> : null}</td>
              <td className="px-4 py-3 font-semibold">
                {topicHref ? <Link href={topicHref(t.code)} className="hover:text-grape-700 hover:underline print:no-underline">{t.title}</Link> : t.title}
              </td>
              {showResources && [t.hasVideo, t.hasNotes, t.hasQuiz].map((ok, i) => (
                <td key={i} className="px-2 py-3 text-center">
                  {ok ? <Check className="mx-auto size-5 text-leaf-700" aria-label="Ready" /> : <Minus className="mx-auto size-4 text-faint" aria-label="Not yet" />}
                </td>
              ))}
            </tr>
          ))}
          {fixed("end")}
        </tbody>
      </table>
    </div>
  );
}
