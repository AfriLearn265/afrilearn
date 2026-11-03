import { Check } from "lucide-react";
import { JourneyRail } from "@/components/landing/JourneyRail";
import { HeroCollage } from "@/components/landing/HeroCollage";
import { CourseTile } from "@/components/landing/CourseTile";
import { AdirePattern, CtaBand, Photo, PhotoTile, SectionHeading, Steps } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";
import { getCatalogue, type Catalogue } from "@/lib/catalogue";
import { brand } from "@/config/brand";

export const revalidate = 300;

export default async function Home() {
  const catalogue = await getCatalogue();
  const classCount = catalogue.classes.filter((c) => c.level !== "exam_prep").length;
  const subjectCount = new Set(catalogue.classes.flatMap((c) => c.subjects)).size;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-adire-900 text-white">
        <AdirePattern id="home-adire" className="-z-10 text-adire-700/70 [mask-image:radial-gradient(70%_85%_at_78%_30%,black,transparent)]" />
        <div className="container-page grid items-center gap-10 pb-28 pt-10 sm:gap-12 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-40 lg:pt-16">
          <div className="animate-hero-in">
            <h1 className="max-w-[13ch] text-[2.9rem] font-extrabold leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-[5.4rem]">
              One school journey, from Nursery 1 to JAMB.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-adire-100 md:mt-7 md:text-xl">
              Lessons, live classes, assignments and CBT practice for every Nigerian class, taught by approved teachers,
              with progress reports parents can actually read.
            </p>
            <div className="mt-8 grid gap-3 sm:mt-9 sm:flex sm:flex-wrap">
              <ButtonLink href="/signup" size="lg" variant="accent">Get started free</ButtonLink>
              <ButtonLink href="/classes" size="lg" variant="onDark">Explore classes</ButtonLink>
            </div>
            <p className="mt-5 text-sm text-adire-200">Free for every learner during the pilot term.</p>
          </div>
          <HeroCollage />
        </div>
      </section>

      <section aria-labelledby="find-class" className="container-page relative z-10 -mt-20 lg:-mt-24">
        <div className="rounded-[1.75rem] border border-line bg-white p-4 shadow-pop sm:p-5 md:rounded-[2rem] md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="find-class" className="text-2xl font-bold md:text-3xl">Find your class</h2>
            <p className="text-sm text-muted">{classCount} classes, {subjectCount} subjects and five exam tracks</p>
          </div>
          <JourneyRail inset levels={catalogue.levels} classes={catalogue.classes} />
        </div>
      </section>

      <section className="container-page py-14 sm:py-20 md:py-28">
        <SectionHeading title="Everyone around the learner, in one place."
          intro={`${brand.name} connects the people around a learner, so the lesson, the homework, the test and the report card all live together.`} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <PhotoTile className="sm:col-span-2 lg:col-span-3 lg:row-span-2 lg:min-h-[36rem]" href="/classes" photo="student"
            title="Students" text="Learn at your class level, hand in assignments and watch your progress grow, one badge at a time."
            cta="Find your class" sizes="(min-width: 1024px) 50vw, 100vw" />
          <PhotoTile className="lg:col-span-3" href="/teachers" photo="teacher" title="Teachers"
            text="Run classrooms, set tests that mark themselves and keep a proper gradebook." cta={`Teach on ${brand.name}`}
            sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw" />
          <PhotoTile className="lg:col-span-3" href="/parents" photo="parent" title="Parents and guardians"
            text="Follow results, attendance and teacher feedback for every child you link." cta="See what parents get"
            sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw" />
          <PhotoTile className="lg:col-span-3" href="/exam-prep" photo="candidate" title="Exam candidates"
            text="Timed CBT mocks and topic practice for WAEC, NECO, JAMB and NABTEB." cta="Start exam preparation"
            sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw" />
          <PhotoTile className="lg:col-span-3" href="/pricing#schools" photo="school" title="Schools"
            text="Enrol whole classes, approve your teachers and see engagement across the school." cta="Plans for schools"
            sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw" />
        </div>
      </section>

      <section className="border-y border-line bg-white py-14 sm:py-20 md:py-24">
        <div className="container-page">
          <SectionHeading title="How it works" intro="Four steps from sign-up to your first result." />
          <Steps className="mt-12" steps={[
            ["Create your account", "Choose your class or exam. Pupils in Nursery and Primary sign up with a parent or guardian."],
            ["Join your classroom", "Enter the class code from your teacher to see their lessons, assignments and live classes."],
            ["Learn and practise", "Work through lessons, hand in assignments and take tests that mark themselves as you go."],
            ["Watch progress together", "Results, attendance and feedback appear on your dashboard and on your parent's."],
          ]} />
        </div>
      </section>

      <FeaturedCourses courses={catalogue.courses.slice(0, 3)} />

      <section className="relative isolate overflow-hidden bg-adire-800 py-20 text-white md:py-28">
        <AdirePattern id="exam-adire" className="-z-10 text-adire-700/60 [mask-image:radial-gradient(60%_80%_at_100%_50%,black,transparent)]" />
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem]">
            <Photo name="exam" sizes="(min-width: 1024px) 45vw, 100vw" />
            <div aria-hidden="true" className="absolute bottom-4 left-4 rounded-2xl bg-white px-4 py-3 text-ink shadow-pop sm:bottom-6 sm:left-6">
              <p className="text-sm font-semibold">JAMB Mathematics mock</p>
              <p className="text-[0.8rem] text-muted">7 of 10 correct in 13 minutes</p>
            </div>
          </div>
          <div>
            <SectionHeading light title="Practise for WAEC, NECO and JAMB the way the real CBT feels."
              intro="Every session is a fresh paper from teacher-written question banks, with an explanation after every answer." />
            <ul className="mt-8 grid gap-3">
              {["Timed mocks with the same rhythm as the CBT hall", "Practice by topic when you only need to fix one weak area",
                "A review of every question you got wrong"].map((p) => (
                <li key={p} className="flex gap-3 text-adire-50">
                  <Check className="mt-0.5 size-5 shrink-0 text-sun-400" aria-hidden="true" />{p}
                </li>
              ))}
            </ul>
            <div className="mt-9 grid gap-3 sm:flex sm:flex-wrap">
              <ButtonLink href="/exam-prep" variant="accent" size="lg">Explore exam preparation</ButtonLink>
              <ButtonLink href="/exam-prep#sample" variant="onDark" size="lg">Try a sample question</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <Community testimonials={catalogue.testimonials} />

      <CtaBand title="Start where you are today." text="Choose your class, join your teacher's classroom and begin your first lesson in minutes.">
        <ButtonLink href="/signup" size="lg" variant="accent">Create a free account</ButtonLink>
        <ButtonLink href="/faq" size="lg" variant="onDark">Read common questions</ButtonLink>
      </CtaBand>
    </>
  );
}

function FeaturedCourses({ courses }: { courses: Catalogue["courses"] }) {
  return (
    <section className="container-page py-14 sm:py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading title="Start a course today" intro="Self-paced courses written by approved teachers, open to every learner at the right level." />
        <ButtonLink href="/courses" variant="outline">See all courses</ButtonLink>
      </div>
      {courses.length === 0 ? (
        <div className="mt-10 rounded-[1.5rem] border border-dashed border-adire-200 bg-adire-50 px-6 py-12 text-center">
          <p className="font-display text-xl font-bold">The first courses are being written now.</p>
          <p className="mx-auto mt-2 max-w-md text-muted">Approved teachers publish courses from their dashboard. They appear here the moment they go live.</p>
          <ButtonLink href="/teachers" className="mt-6">Apply to teach a course</ButtonLink>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => <CourseTile key={c.id} course={c} />)}
        </ul>
      )}
    </section>
  );
}

function Community({ testimonials }: { testimonials: Catalogue["testimonials"] }) {
  return (
    <section className="container-page py-14 sm:py-20 md:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid grid-cols-[1.2fr_1fr] gap-4">
          <div className="relative row-span-2 min-h-[22rem] overflow-hidden rounded-[2rem] sm:min-h-[26rem]">
            <Photo name="smiling" sizes="(min-width: 1024px) 24vw, 55vw" />
          </div>
          <div className="relative min-h-[10rem] overflow-hidden rounded-t-full rounded-b-[1.5rem]">
            <Photo name="junior" sizes="(min-width: 1024px) 20vw, 45vw" />
          </div>
          <div className="relative min-h-[10rem] overflow-hidden rounded-[1.5rem]">
            <Photo name="nursery" sizes="(min-width: 1024px) 20vw, 45vw" />
          </div>
        </div>
        {testimonials.length === 0 ? (
          <div>
            <SectionHeading title="Pilot schools are joining now."
              intro={`We will share what students, parents and teachers say about ${brand.name} here, in their own words, once our first pilot term ends.`} />
            <ButtonLink href={`mailto:${brand.supportEmail}?subject=Pilot%20school`} size="lg" className="mt-8">Bring {brand.name} to your school</ButtonLink>
          </div>
        ) : (
          <div>
            <SectionHeading title="From our learning community" />
            <ul className="mt-8 grid gap-4">
              {testimonials.slice(0, 3).map((t) => (
                <li key={t.id} className="rounded-[1.5rem] border border-line bg-white p-6">
                  <blockquote className="text-lg leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                  <p className="mt-4 text-sm"><span className="font-semibold">{t.author_name}</span><span className="text-muted">, {t.author_role}</span></p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
