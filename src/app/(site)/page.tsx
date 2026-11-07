import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Eye, Puzzle, Quote, Star } from "lucide-react";
import { HomeHero } from "@/components/landing/HomeHero";
import { ClassBlocks } from "@/components/landing/ClassBlocks";
import { PlayArcade } from "@/components/landing/PlayArcade";
import { CtaBand, SectionHeading } from "@/components/landing/Marketing";
import { SubjectArt } from "@/components/brand/SubjectArt";
import { Sparkle } from "@/components/brand/Mascot";
import { ButtonLink } from "@/components/ui/Button";
import { getCatalogue, getHomeHighlights, type TopicHighlight } from "@/lib/catalogue";
import { CORE_SUBJECTS, lookForSubject } from "@/config/subjects";
import { photos } from "@/config/photos";

export const revalidate = 300;

const nf = new Intl.NumberFormat("en-NG");

export default async function Home() {
  const [catalogue, { topics, stats, topicCounts }] = await Promise.all([getCatalogue(), getHomeHighlights()]);

  return (
    <>
      <HomeHero />

      <section aria-labelledby="subjects-title" className="container-page pb-6 pt-8 md:pt-10">
        <SectionHeading title="Start with a subject" intro="English and Maths first, the way parents asked. Basic Science is on its way." />
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {CORE_SUBJECTS.map((code) => {
            const look = lookForSubject(code);
            const count = topicCounts[code] ?? 0;
            return (
              <li key={code}>
                <Link href={count ? `/classes?subject=${code}` : "/signup"}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border-2 border-ink bg-white shadow-[4px_5px_0_var(--color-ink)] transition hover:-translate-y-1">
                  <span className={clsx("relative grid h-40 place-items-center", look.bg)}>
                    <SubjectArt code={code} className="h-28 w-auto transition-transform group-hover:scale-105" />
                    <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold text-ink">{count ? `${count} topics` : "Coming soon"}</span>
                  </span>
                  <span className="flex flex-1 items-center justify-between gap-3 p-5">
                    <span>
                      <span className="block font-display text-2xl font-semibold">{look.short}</span>
                      <span className="block text-sm text-muted">{look.tagline}</span>
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-grape-600 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="play" aria-labelledby="play-title" className="scroll-mt-20 py-14 sm:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title="Play and learn, free" intro="No sign-up needed. Pick a game and see how you do." />
            <p className="inline-flex items-center gap-2 rounded-full bg-sun-100 px-4 py-2 font-display font-semibold"><Sparkle className="size-5" />3 games to try</p>
          </div>
          <div className="mt-9"><PlayArcade /></div>
        </div>
      </section>

      <section id="classes" aria-labelledby="classes-title" className="container-page scroll-mt-20 py-10 sm:py-14">
        <SectionHeading title="Pick your class" />
        <div className="mt-8"><ClassBlocks classes={catalogue.classes} simple /></div>
      </section>

      {topics.length > 0 && <PopularLessons topics={topics} stats={stats} />}

      {catalogue.testimonials.length > 0 && (
        <section aria-labelledby="reviews-title" className="container-page py-14 sm:py-20">
          <SectionHeading title="What families say" />
          <ul className="mt-9 grid gap-5 md:grid-cols-3">
            {catalogue.testimonials.slice(0, 3).map((t, i) => (
              <li key={t.id} className={clsx("relative rounded-[1.75rem] border-2 border-line bg-white p-6", ["md:-rotate-1", "md:translate-y-3", "md:rotate-1"][i])}>
                <Quote className="size-8 text-grape-200" aria-hidden="true" />
                <p className="mt-3 text-lg leading-relaxed">{t.quote}</p>
                <p className="mt-4 font-display font-semibold">{t.author_name}</p>
                <p className="text-sm text-muted">{t.author_role}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="relative isolate overflow-hidden bg-grape-950 text-white">
        <span aria-hidden="true" className="absolute -right-40 top-0 -z-10 size-[30rem] rounded-full bg-grape-500/30 blur-3xl" />
        <div className="container-page grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2">
          <div className="relative grid grid-cols-[1.15fr_0.85fr] gap-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
              <Image src={photos.graduate.src} alt={photos.graduate.alt} fill sizes="(min-width: 1024px) 320px, 55vw" className="object-cover" />
            </div>
            <div className="grid gap-4">
              <div className="relative aspect-square overflow-hidden rounded-[2rem]">
                <Image src={photos.uniformGirl.src} alt={photos.uniformGirl.alt} fill sizes="(min-width: 1024px) 240px, 40vw" className="object-cover" />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-[2rem]">
                <Image src={photos.laptopGirl.src} alt={photos.laptopGirl.alt} fill sizes="(min-width: 1024px) 240px, 40vw" className="object-cover" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-semibold leading-tight md:text-5xl">Made for Nigerian classrooms, and for home.</h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-grape-100">Every topic follows the school term, so your child learns at home what the class is learning at school. You see every video watched and every quiz score.</p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <ButtonLink href="/signup?role=parent" size="lg" variant="accent">Create a pupil account</ButtonLink>
              <ButtonLink href="/parents" size="lg" variant="onDark">What parents get</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Ready for the first gold star?" text="Create a free account, pick a class and start the first topic in minutes.">
        <ButtonLink href="/signup" size="lg">Create a free account</ButtonLink>
        <ButtonLink href="#play" size="lg" variant="light">Play a free quiz</ButtonLink>
      </CtaBand>
    </>
  );
}

/** The most-used lessons, with their real ratings, views and quiz plays. Nothing here is made up. */
function PopularLessons({ topics, stats }: { topics: TopicHighlight[]; stats: { topics: number; video_views: number; quiz_plays: number; rating: number | null; ratings: number } | null }) {
  return (
    <section aria-labelledby="popular-title" className="bg-white py-14 sm:py-20">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading title="Lessons pupils are watching" intro="Each one has a video, notes and a quiz." />
          {stats && (
            <dl className="flex flex-wrap gap-x-8 gap-y-3">
              <Stat label="topics to learn" value={nf.format(stats.topics)} />
              {stats.video_views > 0 && <Stat label="lessons watched" value={nf.format(stats.video_views)} />}
              {stats.ratings > 0 && stats.rating != null && <Stat label={`from ${nf.format(stats.ratings)} ratings`} value={`${stats.rating}★`} />}
            </dl>
          )}
        </div>
        <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => {
            const look = lookForSubject(t.subject_code);
            return (
              <li key={t.code}>
                <Link href="/signup" className="group flex h-full gap-4 rounded-[1.6rem] border-2 border-line bg-paper p-3 pr-4 transition hover:border-ink hover:shadow-[4px_5px_0_var(--color-ink)]">
                  <span className={clsx("grid w-24 shrink-0 place-items-center rounded-[1.2rem] border-2 border-ink", look.bg)}>
                    <SubjectArt code={t.subject_code} className="h-14 w-auto" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col py-1">
                    <span className="text-xs font-bold uppercase tracking-[0.1em] text-faint">{t.class_name} · {look.short}</span>
                    <span className="mt-0.5 font-display text-xl font-semibold leading-tight">{t.title}</span>
                    <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-sm font-semibold text-ink-soft">
                      {t.ratings > 0 && t.stars != null ? (
                        <span className="inline-flex items-center gap-1"><Star className="size-4 fill-sun-400 text-sun-600" aria-hidden="true" />{t.stars} <span className="font-normal text-muted">({t.ratings})</span></span>
                      ) : <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs text-lime-600">New</span>}
                      {t.views > 0 && <span className="inline-flex items-center gap-1"><Eye className="size-4" aria-hidden="true" />{nf.format(t.views)} views</span>}
                      <span className="inline-flex items-center gap-1"><Puzzle className="size-4" aria-hidden="true" />Quiz</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-3xl font-semibold text-grape-700">{value}</dd>
      <dd className="text-sm text-muted">{label}</dd>
    </div>
  );
}
