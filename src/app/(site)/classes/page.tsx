import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { JourneyRail } from "@/components/landing/JourneyRail";
import { CtaBand, PageHero, Photo } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";
import { getCatalogue } from "@/lib/catalogue";
import type { PhotoKey } from "@/config/photos";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Classes and subjects",
  description: "Every Nigerian class from Nursery 1 to SS 3, plus WAEC, NECO, JAMB, NABTEB and entrance exam preparation.",
};

const levelDetail: Record<string, { photo: PhotoKey; text: string; arch?: boolean }> = {
  nursery: { photo: "nursery", arch: true, text: "Numbers, letters, sounds and the world around us, learnt in short lessons with a parent close by." },
  primary: { photo: "primary", text: "Literacy, numeracy, science and social studies from Primary 1 to Primary 6, building towards the Common Entrance." },
  junior_secondary: { photo: "junior", arch: true, text: "The Basic Education curriculum for JSS 1 to JSS 3, building towards the BECE." },
  senior_secondary: { photo: "senior", text: "Science, arts and commercial subjects for SS 1 to SS 3, building towards WAEC and NECO." },
  exam_prep: { photo: "exam", arch: true, text: "Timed CBT mocks and topic practice for WAEC, NECO, JAMB, NABTEB and entrance examinations." },
};

export default async function ClassesPage() {
  const { levels, classes } = await getCatalogue();
  const groups = levels.map((l) => ({ ...l, items: classes.filter((c) => c.level === l.key) })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHero id="classes" photo="reading" title="Every class from Nursery 1 to SS 3."
        intro="Pick your class to see its subjects. Each one comes with lessons, notes, assignments, tests and a teacher-led classroom.">
        <ButtonLink href="/signup" size="lg" variant="accent">Get started free</ButtonLink>
        <ButtonLink href="/courses" size="lg" variant="onDark">See courses</ButtonLink>
      </PageHero>

      <section aria-labelledby="pick-class" className="container-page relative z-10 -mt-10">
        <div className="rounded-[1.75rem] border border-line bg-white p-4 shadow-pop sm:p-5 md:rounded-[2rem] md:p-8">
          <h2 id="pick-class" className="text-2xl font-bold md:text-3xl">Pick a class</h2>
          <JourneyRail inset levels={levels} classes={classes} />
        </div>
      </section>

      <div className="container-page grid gap-16 py-14 sm:gap-20 sm:py-20 md:gap-28 md:py-28">
        {groups.map((g, i) => {
          const detail = levelDetail[g.key] ?? levelDetail.primary;
          const subjects = [...new Set(g.items.flatMap((c) => c.subjects))].sort();
          const shown = subjects.slice(0, 12);
          const exam = g.key === "exam_prep";
          return (
            <section key={g.key} id={g.key.replace("_", "-")} aria-labelledby={`${g.key}-title`}
              className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={clsx("relative aspect-[5/4] overflow-hidden", detail.arch ? "rounded-t-[12rem] rounded-b-[2rem]" : "rounded-[2rem]", i % 2 === 1 && "lg:order-2")}>
                <Photo name={detail.photo} sizes="(min-width: 1024px) 45vw, 100vw" />
              </div>
              <div>
                <h2 id={`${g.key}-title`} className="text-[2.1rem] font-bold leading-[1.08] md:text-5xl">{g.name}</h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{detail.text}</p>
                <ul className="mt-7 flex flex-wrap gap-2" aria-label={`Classes in ${g.name}`}>
                  {g.items.map((c) => (
                    <li key={c.code}>
                      <Link href={`/signup?class=${c.code}`}
                        className={clsx("inline-flex h-10 items-center rounded-full border-2 px-4 text-sm font-semibold transition-colors",
                          exam ? "border-sun-400 hover:bg-sun-100" : "border-adire-700 text-adire-800 hover:bg-adire-50")}>
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-7 text-sm font-semibold text-ink">{subjects.length} subjects, including</p>
                <p className="mt-2 max-w-xl leading-relaxed text-muted">
                  {shown.join(", ")}{subjects.length > shown.length ? ` and ${subjects.length - shown.length} more.` : "."}
                </p>
              </div>
            </section>
          );
        })}
      </div>

      <CtaBand title="Found your class?" text="Create a free account, choose your class and join your teacher's classroom with their code." photo="pupils">
        <ButtonLink href="/signup" size="lg" variant="accent">Create a free account</ButtonLink>
      </CtaBand>
    </>
  );
}
