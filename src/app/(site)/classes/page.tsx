import type { Metadata } from "next";
import clsx from "clsx";
import { ClassBlocks } from "@/components/landing/ClassBlocks";
import { CtaBand, PageHero } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";
import { getCatalogue } from "@/lib/catalogue";
import { classNumber, lookFor } from "@/config/classLook";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Primary 1 to 6",
  description: "Every primary class from Primary 1 to Primary 6, with class videos, lessons, quizzes and live classes for each subject.",
};

const core = ["English Language", "Mathematics", "Basic Science", "Social Studies"];

export default async function ClassesPage() {
  const { classes } = await getCatalogue();
  const primary = classes.filter((c) => c.level === "primary");

  return (
    <>
      <PageHero id="classes" mascot={{ pose: "cheer", prop: "star" }} title="Primary 1 to Primary 6."
        intro="Every class has its own videos, lessons, quizzes and live classes, subject by subject, following the Nigerian curriculum.">
        <ButtonLink href="/signup" size="lg" variant="accent">Start learning free</ButtonLink>
        <ButtonLink href="/courses" size="lg" variant="onDark">See courses</ButtonLink>
      </PageHero>

      <section aria-label="Pick a class" className="container-page pb-6 pt-8 md:pt-10">
        <ClassBlocks classes={classes} />
      </section>

      <div className="container-page grid gap-10 py-14 sm:gap-14 sm:py-20">
        {primary.map((c, i) => {
          const look = lookFor(c.code);
          const main = c.subjects.filter((s) => core.includes(s));
          const rest = c.subjects.filter((s) => !core.includes(s));
          return (
            <section key={c.code} id={c.code.toLowerCase()} aria-labelledby={`${c.code}-title`}
              className={clsx("grid scroll-mt-28 overflow-hidden rounded-[2rem] border-2 border-line bg-white", i % 2 === 1 ? "md:grid-cols-[1fr_16rem]" : "md:grid-cols-[16rem_1fr]")}>
              <div className={clsx("relative flex min-h-48 flex-col justify-between overflow-hidden p-6 text-ink md:min-h-full", look.bg, i % 2 === 1 && "md:order-2")}>
                <span aria-hidden="true" className="absolute -bottom-14 -right-10 size-44 rounded-full bg-white/25" />
                <span className="font-display text-[7rem] font-semibold leading-[0.8]">{classNumber(c.name)}</span>
                <span className="relative font-semibold">{look.age}</span>
              </div>
              <div className="p-6 sm:p-8">
                <h2 id={`${c.code}-title`} className="text-3xl font-semibold md:text-4xl">{c.name}</h2>
                <p className="mt-2 text-lg text-ink-soft">{look.about}.</p>
                <h3 className="mt-6 text-sm font-bold text-muted">Main subjects</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {main.map((s) => <li key={s} className={clsx("rounded-full px-3.5 py-1.5 text-sm font-bold", look.soft)}>{s}</li>)}
                </ul>
                <h3 className="mt-5 text-sm font-bold text-muted">Also taught</h3>
                <p className="mt-1.5 leading-relaxed text-ink-soft">{rest.join(", ")}.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ButtonLink href={`/signup?class=${c.code}`}>Start {c.name}</ButtonLink>
                  {c.code === "P6" && <ButtonLink href="/resources" variant="outline">Common Entrance practice</ButtonLink>}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <CtaBand title="Found your class?" text="Create a free account, choose the class, and join your teacher's classroom with their code.">
        <ButtonLink href="/signup" size="lg">Create a free account</ButtonLink>
      </CtaBand>
    </>
  );
}
