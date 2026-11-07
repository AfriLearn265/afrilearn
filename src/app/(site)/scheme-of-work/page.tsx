import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { PageHero } from "@/components/landing/Marketing";
import { SubjectArt } from "@/components/brand/SubjectArt";
import { SchemeTable, type SchemeTopic } from "@/components/app/SchemeTable";
import { PrintButton } from "@/components/ui/PrintButton";
import { ButtonLink } from "@/components/ui/Button";
import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { lookFor } from "@/config/classLook";
import { CORE_SUBJECTS, TERM_NAMES, currentTerm, lookForSubject, type CoreSubject } from "@/config/subjects";

export const metadata: Metadata = {
  title: "Scheme of work",
  description: "Week-by-week scheme of work for English and Mathematics, Primary 1 to 6, first to third term, following the Nigerian curriculum.",
};

const CLASS_CODES = ["P1", "P2", "P3", "P4", "P5", "P6"];

/** The week-by-week plan for any class, subject and term. Parents can follow along; teachers can print it. */
export default async function SchemeOfWorkPage({ searchParams }: { searchParams: Promise<{ class?: string; subject?: string; term?: string }> }) {
  const sp = await searchParams;
  const cls = CLASS_CODES.includes(sp.class ?? "") ? sp.class! : "P1";
  const subject: CoreSubject = (CORE_SUBJECTS as readonly string[]).includes(sp.subject ?? "") ? (sp.subject as CoreSubject) : "english";
  const term = [1, 2, 3].includes(Number(sp.term)) ? Number(sp.term) : currentTerm();
  const look = lookForSubject(subject);
  const href = (o: Partial<{ class: string; subject: string; term: number }>) => {
    const p = new URLSearchParams({ class: o.class ?? cls, subject: o.subject ?? subject, term: String(o.term ?? term) });
    return `/scheme-of-work?${p.toString()}`;
  };

  let topics: SchemeTopic[] = [];
  let className = `Primary ${cls.slice(1)}`;
  if (isSupabaseConfigured) {
    const db = createPublicClient();
    const [{ data: c }, { data: s }] = await Promise.all([
      db.from("classes").select("id, name").eq("code", cls).maybeSingle(),
      db.from("subjects").select("id").eq("code", subject).maybeSingle(),
    ]);
    if (c) className = c.name;
    if (c && s) {
      const { data } = await db.from("curriculum_topics").select("code, title, theme, sub_theme, sort_order, week_start, week_end")
        .eq("class_id", c.id).eq("subject_id", s.id).eq("term", term).eq("is_published", true).order("sort_order");
      topics = (data ?? []) as SchemeTopic[];
    }
  }

  return (
    <>
      <PageHero theme="coral" art={{ kind: "sheets" }} title="Scheme of work"
        intro="What every class learns each week of the term, in English and Mathematics. Follow along at home, or print it for the classroom." />

      <section className="container-page py-10 sm:py-14">
        <div className="grid gap-4 print:hidden">
          <nav aria-label="Class" className="-mx-4 overflow-x-auto px-4 scrollbar-none">
            <ul className="flex min-w-max gap-2">
              {CLASS_CODES.map((c) => (
                <li key={c}>
                  <Link href={href({ class: c })} aria-current={c === cls ? "page" : undefined} scroll={false}
                    className={clsx("grid h-12 min-w-12 place-items-center rounded-2xl border-2 px-3 font-display text-lg font-semibold transition",
                      c === cls ? clsx("border-ink shadow-[3px_4px_0_var(--color-ink)]", lookFor(c).bg) : "border-line bg-white text-ink-soft hover:border-grape-300")}>
                    <span><span className="hidden sm:inline">Primary </span>{c.slice(1)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-wrap gap-2">
            {CORE_SUBJECTS.map((code) => (
              <Link key={code} href={href({ subject: code })} aria-current={code === subject ? "page" : undefined} scroll={false}
                className={clsx("inline-flex h-11 items-center gap-2 rounded-full border-2 pl-1.5 pr-4 font-display font-semibold transition",
                  code === subject ? "border-ink bg-white shadow-[3px_4px_0_var(--color-ink)]" : "border-line bg-white/70 text-ink-soft hover:border-grape-300")}>
                <span className={clsx("grid size-8 place-items-center rounded-full", lookForSubject(code).bg)}><SubjectArt code={code} className="h-5 w-auto" /></span>
                {lookForSubject(code).short}
              </Link>
            ))}
          </div>
          <nav aria-label="Term" className="grid max-w-xl grid-cols-3 gap-2 rounded-full bg-wash p-1.5">
            {[1, 2, 3].map((t) => (
              <Link key={t} href={href({ term: t })} aria-current={t === term ? "page" : undefined} scroll={false}
                className={clsx("rounded-full px-2 py-2.5 text-center font-display text-sm font-semibold sm:text-base", t === term ? "bg-white text-ink shadow-[0_2px_0_var(--color-line)]" : "text-ink-soft hover:text-ink")}>
                {TERM_NAMES[t]}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={clsx("text-sm font-bold uppercase tracking-[0.12em]", look.text)}>{TERM_NAMES[term]}</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{className} {look.short}</h2>
          </div>
          {topics.length > 0 && <PrintButton />}
        </div>

        <div className="mt-5">
          {topics.length === 0 ? (
            <p className="rounded-[1.4rem] bg-wash p-6 text-ink-soft">
              The {look.short} scheme of work for {className} is being prepared. <Link href="/signup" className="font-semibold text-grape-700 underline">Create a free account</Link> to be told when it&apos;s ready.
            </p>
          ) : (
            <SchemeTable topics={topics} accent={subject === "english" ? "bg-sky-600" : subject === "mathematics" ? "bg-tangerine-600" : "bg-lime-600"} />
          )}
        </div>
        <p className="mt-4 text-sm text-muted print:text-ink">
          Topics follow the Nigerian national curriculum. Schools may teach some topics a week earlier or later.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 print:hidden">
          <ButtonLink href={`/signup?class=${cls}`}>Learn these topics on AfriLearn</ButtonLink>
          <ButtonLink href="/classes" variant="outline">All classes</ButtonLink>
        </div>
      </section>
    </>
  );
}
