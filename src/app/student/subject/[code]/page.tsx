import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, CircleCheck, MonitorPlay } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TOPIC_FIELDS, doneTopics, topicsWithVideos, type TopicRow } from "@/lib/curriculum";
import { TERM_NAMES, currentTerm, lookForSubject, weekLabel } from "@/config/subjects";
import { SubjectArt } from "@/components/brand/SubjectArt";

export const metadata = { title: "Topics" };

/** One subject for the pupil's class: pick a term, then a topic. Topics follow the curriculum order. */
export default async function SubjectPage({ params, searchParams }: {
  params: Promise<{ code: string }>; searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { userId } = await requireRole("student");
  const [{ code }, sp] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: subject }, { data: me }] = await Promise.all([
    supabase.from("subjects").select("id, code, name").eq("code", code).maybeSingle(),
    supabase.from("students").select("class_id, classes(name, code)").eq("profile_id", userId).single(),
  ]);
  if (!subject || !me?.class_id) notFound();
  const { data } = await supabase.from("curriculum_topics").select(TOPIC_FIELDS)
    .eq("class_id", me.class_id).eq("subject_id", subject.id).eq("is_published", true).order("sort_order");
  const topics = (data ?? []) as TopicRow[];
  const termNow = currentTerm();
  const asked = Number(sp.term);
  const term = asked >= 1 && asked <= 3 ? asked : termNow;
  const shown = topics.filter((t) => t.term === term).sort((a, b) => (a.week_start ?? 99) - (b.week_start ?? 99) || a.sort_order - b.sort_order);
  const [done, withVideo] = await Promise.all([doneTopics(userId, topics.map((t) => t.id)), topicsWithVideos(shown.map((t) => t.id))]);
  const look = lookForSubject(subject.code);
  const className = (me.classes as unknown as { name: string } | null)?.name;
  const termDone = shown.filter((t) => done.has(t.id)).length;

  return (
    <div className="grid gap-6">
      <Link href="/student" className="inline-flex items-center gap-1 justify-self-start font-display font-semibold text-grape-700 hover:underline">
        <ChevronLeft className="size-4" aria-hidden="true" />My subjects
      </Link>

      <header className={clsx("relative overflow-hidden rounded-[1.75rem] border-2 border-ink p-5 shadow-[4px_5px_0_var(--color-ink)] sm:p-7", look.bg)}>
        <div className="relative z-10 max-w-[65%]">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-ink/70">{className}</p>
          <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">{look.short === "Subject" ? subject.name : look.short}</h1>
          <p className="mt-2 font-semibold text-ink/80">{termDone} of {shown.length} topics done this term</p>
        </div>
        <SubjectArt code={subject.code} className="absolute -bottom-2 right-2 h-32 w-auto sm:right-6 sm:h-40" />
      </header>

      <nav aria-label="Terms" className="grid grid-cols-3 gap-2 rounded-full bg-wash p-1.5">
        {[1, 2, 3].map((t) => (
          <Link key={t} href={t === termNow ? `/student/subject/${subject.code}` : `/student/subject/${subject.code}?term=${t}`} aria-current={t === term ? "page" : undefined}
            className={clsx("rounded-full px-2 py-2.5 text-center font-display text-sm font-semibold transition-colors sm:text-base",
              t === term ? "bg-white text-ink shadow-[0_2px_0_var(--color-line)]" : "text-ink-soft hover:text-ink")}>
            {TERM_NAMES[t]}{t === termNow && <span className="ml-1 hidden text-xs text-grape-600 sm:inline">(now)</span>}
          </Link>
        ))}
      </nav>

      <Link href={`/scheme-of-work?class=${(me.classes as unknown as { code?: string } | null)?.code ?? ""}&subject=${subject.code}&term=${term}`}
        className="-mt-2 justify-self-end text-sm font-semibold text-grape-700 hover:underline">See the week-by-week scheme of work</Link>

      {shown.length === 0 ? (
        <p className="rounded-[1.4rem] bg-wash p-6 text-center text-ink-soft">Topics for this term are on their way.</p>
      ) : (
        <ol className="grid gap-3">
          {shown.map((t, i) => {
            const isDone = done.has(t.id);
            return (
              <li key={t.id}>
                <Link href={`/student/t/${t.code}`}
                  className="group flex items-center gap-4 rounded-[1.4rem] border-2 border-line bg-white p-3 pr-4 transition hover:border-ink hover:shadow-[3px_4px_0_var(--color-ink)]">
                  <span className={clsx("grid size-12 shrink-0 place-items-center rounded-2xl font-display text-xl font-bold",
                    isDone ? "bg-leaf-500 text-white" : clsx(look.soft, look.text))}>
                    {isDone ? <CircleCheck className="size-6" aria-label="Done" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold uppercase tracking-[0.1em] text-faint">{[weekLabel(t.week_start, t.week_end), t.theme].filter(Boolean).join(" · ")}</span>
                    <span className="block font-display text-lg font-semibold leading-snug">{t.title}</span>
                  </span>
                  {withVideo.has(t.id) && <MonitorPlay className="size-5 shrink-0 text-grape-500" aria-label="Has a video" />}
                  <ChevronRight className="size-5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
