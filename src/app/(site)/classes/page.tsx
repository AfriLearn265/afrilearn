import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { ClassBlocks } from "@/components/landing/ClassBlocks";
import { CtaBand, PageHero } from "@/components/landing/Marketing";
import { SubjectArt } from "@/components/brand/SubjectArt";
import { ButtonLink } from "@/components/ui/Button";
import { getCatalogue } from "@/lib/catalogue";
import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { classNumber, lookFor } from "@/config/classLook";
import { CORE_SUBJECTS, TERM_NAMES, lookForSubject, type CoreSubject } from "@/config/subjects";

export const metadata: Metadata = {
  title: "Primary 1 to 6",
  description: "What every primary class learns in English, Mathematics and Basic Science, term by term, following the Nigerian curriculum.",
};

type Row = { class_id: string; term: number; title: string; classes: { code: string } | null };

/** Every class and what it learns in one subject, term by term. Pick the subject at the top. */
export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const sp = await searchParams;
  const subject: CoreSubject = (CORE_SUBJECTS as readonly string[]).includes(sp.subject ?? "") ? (sp.subject as CoreSubject) : "mathematics";
  const { classes } = await getCatalogue();
  const primary = classes.filter((c) => c.level === "primary");
  let rows: Row[] = [];
  if (isSupabaseConfigured) {
    const db = createPublicClient();
    const { data: subj } = await db.from("subjects").select("id").eq("code", subject).maybeSingle();
    if (subj) {
      const { data } = await db.from("curriculum_topics").select("class_id, term, title, classes(code)").eq("subject_id", subj.id).eq("is_published", true).order("sort_order");
      rows = (data ?? []) as unknown as Row[];
    }
  }
  const look = lookForSubject(subject);

  return (
    <>
      <PageHero theme="sun" art={{ kind: "numbers" }} title="Primary 1 to Primary 6."
        intro="Every class learns English, Maths and Basic Science term by term, following the Nigerian curriculum.">
        <ButtonLink href="/signup" size="lg">Start learning free</ButtonLink>
        <ButtonLink href="/#play" size="lg" variant="light">Play a free quiz</ButtonLink>
      </PageHero>

      <section aria-label="Pick a class" className="container-page pb-4 pt-8 md:pt-10">
        <ClassBlocks classes={classes} simple />
      </section>

      <section aria-labelledby="topics-title" className="container-page py-12 sm:py-16">
        <h2 id="topics-title" className="text-[2.2rem] font-semibold leading-[1.05] md:text-5xl">What each class learns</h2>
        <nav aria-label="Subject" className="mt-6 flex flex-wrap gap-3">
          {CORE_SUBJECTS.map((code) => {
            const l = lookForSubject(code);
            return (
              <Link key={code} href={code === "mathematics" ? "/classes" : `/classes?subject=${code}`} scroll={false} aria-current={code === subject ? "page" : undefined}
                className={clsx("inline-flex h-12 items-center gap-2 rounded-full border-2 pl-1.5 pr-5 font-display font-semibold transition",
                  code === subject ? "border-ink bg-white shadow-[3px_4px_0_var(--color-ink)]" : "border-line bg-white/70 text-ink-soft hover:border-grape-300")}>
                <span className={clsx("grid size-9 place-items-center rounded-full", l.bg)}><SubjectArt code={code} className="h-6 w-auto" /></span>{l.short}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 grid gap-6">
          {primary.map((c) => {
            const cl = lookFor(c.code);
            const list = rows.filter((r) => r.classes?.code === c.code);
            return (
              <article key={c.code} id={c.code.toLowerCase()} aria-labelledby={`${c.code}-title`}
                className="grid scroll-mt-28 overflow-hidden rounded-[2rem] border-2 border-line bg-white md:grid-cols-[11rem_1fr]">
                <div className={clsx("relative flex items-center gap-4 overflow-hidden p-5 text-ink md:flex-col md:items-start md:justify-between", cl.bg)}>
                  <span aria-hidden="true" className="absolute -bottom-12 -right-10 size-36 rounded-full bg-white/25" />
                  <span className="font-display text-[4.5rem] font-semibold leading-[0.8] md:text-[6rem]">{classNumber(c.name)}</span>
                  <span className="relative">
                    <span id={`${c.code}-title`} className="block font-display text-xl font-semibold">{c.name}</span>
                    <span className="block text-sm font-semibold text-ink/70">{cl.age}</span>
                  </span>
                </div>
                <div className="p-5 sm:p-7">
                  {list.length === 0 ? (
                    <p className="text-ink-soft">{look.short} topics for {c.name} are being added. <Link href="/signup" className="font-semibold text-grape-700 underline">Sign up</Link> to be told when they&apos;re ready.</p>
                  ) : (
                    <div className="grid gap-5 lg:grid-cols-3">
                      {[1, 2, 3].map((term) => {
                        const items = list.filter((r) => r.term === term);
                        return (
                          <div key={term}>
                            <h3 className={clsx("inline-flex rounded-full px-3 py-1 text-sm font-bold", look.soft, look.text)}>{TERM_NAMES[term]}</h3>
                            <ul className="mt-3 grid gap-1.5 text-[0.98rem]">
                              {items.slice(0, 6).map((r) => <li key={r.title} className="flex gap-2"><span aria-hidden="true" className={clsx("mt-2 size-2 shrink-0 rounded-full", look.bg)} />{r.title}</li>)}
                              {items.length > 6 && <li className="pl-4 text-sm font-semibold text-muted">and {items.length - 6} more</li>}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-6"><ButtonLink href={`/signup?class=${c.code}`} variant="outline">Start {c.name}</ButtonLink></div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <CtaBand title="Found your class?" text="Create a free account, choose the class, and start the first topic of this term.">
        <ButtonLink href="/signup" size="lg">Create a free account</ButtonLink>
      </CtaBand>
    </>
  );
}
