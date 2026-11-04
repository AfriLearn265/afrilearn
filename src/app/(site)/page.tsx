import { Check, Download, ShieldCheck } from "lucide-react";
import { HeroScene } from "@/components/landing/HeroScene";
import { ClassBlocks } from "@/components/landing/ClassBlocks";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { CourseTile } from "@/components/landing/CourseTile";
import { AdirePattern, CtaBand, SectionHeading, Steps } from "@/components/landing/Marketing";
import { Sparkle, Squiggle, WaveEdge } from "@/components/brand/Mascot";
import { ButtonLink } from "@/components/ui/Button";
import { getCatalogue, getPublicResources, type Catalogue, type PublicResource } from "@/lib/catalogue";
import { getBrand } from "@/lib/brand";

export const revalidate = 300;

export default async function Home() {
  const brand = await getBrand();
  const [catalogue, resources] = await Promise.all([getCatalogue(), getPublicResources()]);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-grape-700 text-white">
        <div aria-hidden="true" className="sky-dots absolute inset-0 -z-10" />
        <AdirePattern id="home-pattern" className="-z-10 text-grape-500/40 [mask-image:radial-gradient(60%_80%_at_80%_40%,black,transparent)]" />
        <div className="container-page grid items-center gap-6 pb-24 pt-10 sm:pb-28 md:pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-32">
          <div className="animate-hero-in">
            <h1 className="max-w-[12ch] text-[3.1rem] font-semibold leading-[0.95] tracking-[-0.02em] sm:text-[4.4rem] lg:text-[5.4rem]">
              Big learning for little champions.
            </h1>
            <Squiggle className="mt-4 w-32 sm:w-40" color="#FFCB2E" />
            <p className="mt-5 max-w-[33rem] text-lg leading-relaxed text-grape-100 md:text-xl">
              Video lessons for every class from Primary 1 to Primary 6, live classes with real teachers,
              and quizzes that feel like games. Parents see every result.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <ButtonLink href="/signup" size="lg" variant="accent">Start learning free</ButtonLink>
              <ButtonLink href="#classes" size="lg" variant="onDark">Pick a class</ButtonLink>
            </div>
            <p className="mt-5 text-sm text-grape-200">Free for every pupil during the pilot term.</p>
          </div>
          <HeroScene />
        </div>
        <WaveEdge className="absolute inset-x-0 -bottom-px" />
      </section>

      <section id="classes" aria-labelledby="classes-title" className="container-page scroll-mt-20 pb-14 pt-8 sm:pb-20 md:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <SectionHeading title="Pick your class" intro="Six classes, one happy journey. Every class has its own videos, lessons, quizzes and teachers." />
        </div>
        <div className="mt-9"><ClassBlocks classes={catalogue.classes} /></div>
      </section>

      <section aria-labelledby="inside-title" className="container-page py-14 sm:py-20">
        <SectionHeading title="Everything a primary pupil needs" intro={`${brand.name} brings the classroom home, in short, colourful pieces that young learners can manage on their own.`} />
        <div className="mt-10"><FeatureShowcase /></div>
      </section>

      <section className="relative bg-white py-16 sm:py-20 md:py-24">
        <div className="container-page">
          <SectionHeading title="How it works" intro="Three steps from sign-up to your child's first gold star." />
          <Steps className="mt-12" steps={[
            ["Choose your class", "A parent or guardian creates the account and picks the class, from Primary 1 to Primary 6."],
            ["Watch, learn and play", "Pupils watch class videos, read short lessons and try quizzes that mark themselves."],
            ["Celebrate progress", "Results, badges and teacher feedback show up on the pupil's and the parent's dashboard."],
          ]} />
        </div>
      </section>

      <FeaturedCourses courses={catalogue.courses.slice(0, 6)} />

      <ParentsSection name={brand.name} />

      <FreeDownloads items={resources.filter((r) => r.material_type === "pdf").slice(0, 4)} />

      <CtaBand title="Ready for the first gold star?" text="Create a free account, pick a class and watch the first video in minutes.">
        <ButtonLink href="/signup" size="lg">Create a free account</ButtonLink>
        <ButtonLink href="/faq" size="lg" variant="light">Read common questions</ButtonLink>
      </CtaBand>
    </>
  );
}

function FeaturedCourses({ courses }: { courses: Catalogue["courses"] }) {
  return (
    <section className="container-page py-14 sm:py-20 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading title="Courses pupils love" intro="Short, step-by-step courses written by approved teachers for each class." />
        <ButtonLink href="/courses" variant="outline">See all courses</ButtonLink>
      </div>
      {courses.length === 0 ? (
        <div className="mt-10 rounded-[1.75rem] border-2 border-dashed border-grape-200 bg-grape-50 px-6 py-12 text-center">
          <p className="font-display text-2xl font-semibold">The first courses are being written now.</p>
          <p className="mx-auto mt-2 max-w-md text-muted">Approved teachers publish courses from their dashboard. They appear here the moment they go live.</p>
          <ButtonLink href="/teachers" className="mt-6">Apply to teach a course</ButtonLink>
        </div>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => <CourseTile key={c.id} course={c} />)}
        </ul>
      )}
    </section>
  );
}

const report = [
  { subject: "Mathematics", score: 80, tone: "bg-tangerine-400" },
  { subject: "Basic Science", score: 83, tone: "bg-lime-400" },
  { subject: "English", score: 72, tone: "bg-grape-400" },
];

function ParentsSection({ name }: { name: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-lime-100">
      <WaveEdge flip fill="var(--color-paper)" className="absolute inset-x-0 -top-px" />
      <div className="container-page grid items-center gap-12 py-24 sm:py-28 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <SectionHeading title="Parents see everything. Children stay safe."
            intro={`${name} was built for young children first, so the safety rules are part of the platform, not an afterthought.`} />
          <ul className="mt-8 grid gap-4">
            {[
              "A parent or guardian sets up and consents to every pupil account",
              "No private messages between adults and children",
              "Leaderboards are switched off unless a parent agrees, and show first names only",
              "Every teacher is checked and approved before they can teach",
            ].map((t) => (
              <li key={t} className="flex gap-3 text-lg">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun-400"><Check className="size-4" strokeWidth={3} /></span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-9 grid gap-3 sm:flex sm:flex-wrap">
            <ButtonLink href="/parents" size="lg">See what parents get</ButtonLink>
            <ButtonLink href="/privacy" size="lg" variant="outline">Child safety policy</ButtonLink>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
          <Sparkle className="absolute -right-3 -top-6 z-10 size-12" color="#FF6BAA" />
          <div className="sticker rotate-2 rounded-[1.75rem] bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full border-2 border-ink bg-bubble-400 font-display text-lg font-semibold">AY</span>
              <div className="leading-tight">
                <p className="font-display text-xl font-semibold">Amina&apos;s week</p>
                <p className="text-sm text-muted">Primary 5, sent to her mum every Friday</p>
              </div>
            </div>
            <ul className="mt-6 grid gap-4">
              {report.map((r) => (
                <li key={r.subject}>
                  <div className="flex justify-between text-sm font-semibold"><span>{r.subject}</span><span className="tabular">{r.score}%</span></div>
                  <div className="mt-1.5 h-3.5 overflow-hidden rounded-full bg-wash">
                    <div className={`h-full rounded-full ${r.tone}`} style={{ width: `${r.score}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-sun-100 p-3.5">
              <ShieldCheck className="size-6 shrink-0 text-grape-700" />
              <p className="text-sm"><span className="font-semibold">5 videos watched, 2 quizzes passed.</span> Mr Bakare says: &ldquo;Great work on fractions!&rdquo;</p>
            </div>
          </div>
        </div>
      </div>
      <WaveEdge fill="var(--color-paper)" className="absolute inset-x-0 -bottom-px" />
    </section>
  );
}

function FreeDownloads({ items }: { items: PublicResource[] }) {
  if (items.length === 0) return null;
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading title="Free worksheets" intro="Printable worksheets and practice papers with answers. Use them in class or at the kitchen table." />
          <ButtonLink href="/resources" variant="outline" size="lg" className="mt-8">See all free downloads</ButtonLink>
        </div>
        <ul className="grid gap-3">
          {items.map((r, i) => (
            <li key={r.id} className="flex items-center gap-4 rounded-[1.25rem] border-2 border-line bg-white p-3.5 pr-4">
              <span aria-hidden="true" className={`grid h-14 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink font-display text-xs font-semibold ${["bg-tangerine-400", "bg-sky-400", "bg-lime-400", "bg-bubble-400"][i % 4]}`}>PDF</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{r.title}</p>
                <p className="text-sm text-muted">{[r.subject_name, r.class_name].filter(Boolean).join(", ")}</p>
              </div>
              <a href={`/api/resources/${r.id}`} download className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-line text-grape-700 hover:border-grape-300 hover:bg-grape-50">
                <Download className="size-5" aria-hidden="true" /><span className="sr-only">Download {r.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
