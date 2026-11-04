import { Check, Play, Radio } from "lucide-react";
import { Sparkle } from "@/components/brand/Mascot";

const videoRows = [
  { title: "What are equivalent fractions?", subject: "Maths", tone: "bg-tangerine-400" },
  { title: "Parts of a plant and their functions", subject: "Basic Science", tone: "bg-lime-400" },
  { title: "Let's learn about nouns", subject: "English", tone: "bg-grape-300" },
];

/** What a pupil gets, shown as small, real-looking pieces of the product rather than icons. */
export function FeatureShowcase() {
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <article className="relative isolate overflow-hidden rounded-[2rem] bg-grape-700 p-6 text-white sm:p-8 lg:col-span-7 lg:row-span-2">
        <div aria-hidden="true" className="sky-dots absolute inset-0 -z-10 opacity-60" />
        <h3 className="text-3xl font-semibold sm:text-4xl">Videos for every class</h3>
        <p className="mt-2 max-w-md text-grape-100">Teachers upload short videos for Primary 1 to 6, subject by subject. Pupils watch at home, as often as they like.</p>
        <div className="sticker mt-7 overflow-hidden rounded-[1.4rem] bg-white text-ink" aria-hidden="true">
          <div className="relative grid aspect-[16/8] place-items-center overflow-hidden bg-tangerine-400">
            <span className="absolute -left-10 -top-12 size-44 rounded-full bg-sun-400" />
            <span className="absolute -bottom-16 right-6 size-40 rounded-full bg-bubble-400" />
            <span className="absolute left-[7%] top-[10%] font-display text-4xl font-semibold text-ink/85 sm:text-5xl">½ = 2/4</span>
            <span className="relative grid size-16 place-items-center rounded-full border-[3px] border-ink bg-white shadow-[3px_4px_0_var(--color-ink)]">
              <Play className="ml-1 size-7 fill-ink text-ink" />
            </span>
            <span className="absolute bottom-0 left-0 h-1.5 w-[38%] bg-grape-600" />
          </div>
          <ul className="divide-y divide-line">
            {videoRows.map((v, i) => (
              <li key={v.title} className="flex items-center gap-3 px-4 py-3">
                <span className={`grid h-9 w-14 shrink-0 place-items-center rounded-lg ${v.tone}`}><Play className="size-4 fill-ink text-ink" /></span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate font-semibold">{v.title}</span>
                  <span className="text-sm text-muted">Primary 5 {v.subject}</span>
                </span>
                {i === 0 && <span className="rounded-full bg-leaf-100 px-2.5 py-0.5 text-xs font-bold text-leaf-700">Watching</span>}
              </li>
            ))}
          </ul>
        </div>
      </article>

      <article className="relative overflow-hidden rounded-[2rem] bg-sky-300 p-6 sm:p-8 lg:col-span-5">
        <h3 className="text-2xl font-semibold sm:text-3xl">Quizzes that feel like games</h3>
        <p className="mt-2 max-w-sm text-ink-soft">Every answer is marked at once, with a short explanation. Points and badges keep pupils coming back.</p>
        <div className="sticker mt-6 rounded-[1.25rem] bg-white p-4" aria-hidden="true">
          <p className="font-display text-lg font-semibold">1/2 + 1/4 = ?</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
            <li className="rounded-xl border-2 border-line px-3 py-2">2/6</li>
            <li className="flex items-center justify-between rounded-xl border-2 border-leaf-500 bg-leaf-100 px-3 py-2 text-leaf-700">3/4 <Check className="size-4" strokeWidth={3} /></li>
            <li className="rounded-xl border-2 border-line px-3 py-2">1/6</li>
            <li className="rounded-xl border-2 border-line px-3 py-2">2/4</li>
          </ul>
        </div>
        <Sparkle className="absolute right-5 top-5 hidden size-9 sm:block" color="#FFCB2E" />
      </article>

      <article className="rounded-[2rem] bg-bubble-300 p-6 sm:p-8 lg:col-span-5">
        <h3 className="text-2xl font-semibold sm:text-3xl">Live classes with real teachers</h3>
        <p className="mt-2 max-w-sm text-ink-soft">Approved teachers teach live on any phone or laptop. Attendance is taken for you.</p>
        <div className="sticker mt-6 flex items-center gap-3 rounded-[1.25rem] bg-white p-3.5" aria-hidden="true">
          <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-coral-500 text-white"><Radio className="size-5" /></span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block font-semibold">Plants around our school</span>
            <span className="text-sm text-muted">Primary 5 Basic Science, starts in 10 min</span>
          </span>
          <span className="rounded-full border-2 border-ink bg-sun-400 px-3 py-1 font-display text-sm font-semibold">Join</span>
        </div>
      </article>
    </div>
  );
}
