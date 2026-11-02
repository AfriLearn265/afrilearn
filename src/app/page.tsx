import {
  BookOpenCheck, ChartNoAxesColumnIncreasing, ClipboardList, GraduationCap, ShieldCheck, Users, Video,
  MessageSquareLock, BellRing, UserRoundCheck, Building2, Check,
} from "lucide-react";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { JourneyRail } from "@/components/landing/JourneyRail";
import { CbtDemo } from "@/components/landing/CbtDemo";
import { ButtonLink } from "@/components/ui/Button";
import { getCatalogue, formatNaira, type Catalogue } from "@/lib/catalogue";
import { brand } from "@/config/brand";

export const revalidate = 300;

export default async function Home() {
  const catalogue = await getCatalogue();
  const classCount = catalogue.classes.filter((c) => c.level !== "exam_prep").length;
  const subjectCount = new Set(catalogue.classes.flatMap((c) => c.subjects)).size;

  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* Hero: the whole school journey on one line */}
        <section id="classes" className="relative overflow-hidden scroll-mt-16">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(60rem_26rem_at_15%_-10%,var(--color-wash-strong),transparent_70%)]" />
          <div className="container-page relative pt-14 pb-16 md:pt-20 md:pb-24">
            <h1 className="max-w-[15ch] text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[5.25rem]">
              One school journey, from Nursery 1 to JAMB.
            </h1>
            <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,34rem)_1fr] lg:items-end">
              <p className="text-lg leading-relaxed text-muted md:text-xl">
                Lessons, live classes, assignments and CBT practice for every Nigerian class, taught by approved teachers,
                with progress reports parents can actually read.
              </p>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <ButtonLink href="/signup" size="lg">Get started free</ButtonLink>
                <ButtonLink href="/login?as=student" size="lg" variant="outline">Student login</ButtonLink>
                <ButtonLink href="/login?as=teacher" size="lg" variant="ghost">Teacher login</ButtonLink>
              </div>
            </div>
            <div className="mt-14">
              <p className="mb-1 text-sm text-muted">
                {classCount} classes, {subjectCount} subjects and five exam tracks. Pick a stop to see what&apos;s inside.
              </p>
              <JourneyRail levels={catalogue.levels} classes={catalogue.classes} />
            </div>
          </div>
        </section>

        <Roles />
        <HowItWorks />
        <Courses courses={catalogue.courses} />
        <ExamPrep />
        <Teachers />
        <Parents />
        <Stories testimonials={catalogue.testimonials} />
        <Pricing plans={catalogue.plans} paidFeatures={catalogue.paidFeatures} />
        <Faq />

        <section className="container-page pb-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-adire-700 px-7 py-10 text-white md:flex-row md:items-center md:px-12">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">Start where you are today.</h2>
              <p className="mt-2 text-adire-100">Choose your class, join your teacher&apos;s classroom and begin your first lesson in minutes.</p>
            </div>
            <ButtonLink href="/signup" size="lg" variant="accent">Create a free account</ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionHeading({ title, intro, light }: { title: string; intro?: string; light?: boolean }) {
  return (
    <div className="max-w-2xl">
      <h2 className={`text-[2.1rem] font-bold leading-[1.08] md:text-5xl ${light ? "text-white" : ""}`}>{title}</h2>
      {intro && <p className={`mt-4 text-lg leading-relaxed ${light ? "text-adire-100" : "text-muted"}`}>{intro}</p>}
    </div>
  );
}

const roles = [
  { icon: GraduationCap, name: "Students", text: "Learn at your class level, watch recorded lessons, submit assignments and see your progress grow." },
  { icon: BookOpenCheck, name: "Teachers", text: "Run classrooms, upload notes and videos, set tests with auto-marking and keep a proper gradebook." },
  { icon: Users, name: "Parents and guardians", text: "Follow results, attendance and teacher feedback for every child you link to your account." },
  { icon: ClipboardList, name: "Exam candidates", text: "Prepare for WAEC, NECO, JAMB and NABTEB with timed mocks and topic practice." },
  { icon: Building2, name: "Schools and administrators", text: "Approve teachers, manage subjects and classes, and see engagement across the platform." },
];

function Roles() {
  return (
    <section className="border-y border-line bg-white">
      <div className="container-page grid gap-12 py-20 md:py-24 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading title="A whole school, online and in one place."
          intro={`${brand.name} connects the people around a learner, so the lesson, the homework, the test and the report card all live together.`} />
        <ul className="divide-y divide-line border-y border-line">
          {roles.map(({ icon: Icon, name, text }) => (
            <li key={name} className="flex gap-5 py-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-wash text-adire-700"><Icon className="size-5" aria-hidden="true" /></span>
              <div>
                <h3 className="font-sans text-lg font-semibold tracking-normal">{name}</h3>
                <p className="mt-1 text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const steps = [
  ["Create your account", "Choose your class or exam. Pupils in Nursery and Primary sign up with a parent or guardian."],
  ["Join your classroom", "Enter the class code from your teacher to see their lessons, assignments and live classes."],
  ["Learn and practise", "Work through lessons, hand in assignments and take tests that mark themselves as you go."],
  ["Watch progress together", "Results, attendance and feedback appear on your dashboard and on your parent's."],
];

function HowItWorks() {
  return (
    <section className="container-page py-20 md:py-28">
      <SectionHeading title="How it works" intro="Four steps from sign-up to your first result." />
      <ol className="relative mt-12 grid gap-8 md:grid-cols-4 md:gap-6">
        <span aria-hidden="true" className="absolute left-[1.3rem] top-0 h-full w-[3px] rounded-full bg-adire-100 md:left-0 md:top-[1.3rem] md:h-[3px] md:w-full" />
        {steps.map(([title, text], i) => (
          <li key={title} className="relative flex gap-5 md:block">
            <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-adire-700 font-display text-lg font-bold text-white ring-8 ring-paper">{i + 1}</span>
            <div className="md:mt-6">
              <h3 className="font-sans text-lg font-semibold tracking-normal">{title}</h3>
              <p className="mt-1.5 text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Courses({ courses }: { courses: Catalogue["courses"] }) {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading title="Featured courses" intro="Self-paced courses written by approved teachers, open to every learner at the right level." />
          <ButtonLink href="/signup" variant="outline">Browse all courses</ButtonLink>
        </div>
        {courses.length === 0 ? (
          <div className="mt-10 rounded-[1.5rem] border border-dashed border-adire-200 bg-adire-50 px-6 py-12 text-center">
            <p className="font-display text-xl font-bold">The first courses are being written now.</p>
            <p className="mx-auto mt-2 max-w-md text-muted">Approved teachers publish courses from their dashboard. They appear here the moment they go live.</p>
            <ButtonLink href="/signup?role=teacher" className="mt-6">Apply to teach a course</ButtonLink>
          </div>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <li key={c.id} className="group flex flex-col rounded-[1.5rem] border border-line bg-paper p-6 transition-colors hover:border-adire-300">
                <div className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: c.subject?.color ?? "#2B3A9F" }} aria-hidden="true" />
                  <span className="font-medium text-ink-soft">{c.subject?.name ?? "General"}</span>
                  {c.klass && <span className="text-muted">for {c.klass.name}</span>}
                </div>
                <h3 className="mt-3 text-xl font-bold">{c.title}</h3>
                {c.summary && <p className="mt-2 line-clamp-3 text-muted">{c.summary}</p>}
                <p className="mt-auto pt-5 text-sm font-medium text-adire-700">{c.lessons} {c.lessons === 1 ? "lesson" : "lessons"}, {c.difficulty} level</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ExamPrep() {
  const points = [
    "Timed mock examinations that feel like the real CBT hall",
    "Practice by topic, with an explanation after every answer",
    "Scores broken down by subject and topic, so you know what to revise",
    "A review of every question you got wrong",
  ];
  return (
    <section id="exams" className="scroll-mt-16 bg-adire-800 py-20 text-white md:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,30rem)]">
        <div>
          <SectionHeading light title="Practise WAEC, NECO and JAMB the way the real CBT feels."
            intro="The CBT Examination Centre builds a fresh paper each time from teacher-written question banks. Try a sample question on the right." />
          <ul className="mt-8 grid gap-3">
            {points.map((p) => (
              <li key={p} className="flex gap-3 text-adire-50">
                <Check className="mt-0.5 size-5 shrink-0 text-sun-400" aria-hidden="true" />{p}
              </li>
            ))}
          </ul>
          <ButtonLink href="/signup?class=JAMB" variant="accent" size="lg" className="mt-9">Start exam preparation</ButtonLink>
        </div>
        <CbtDemo />
      </div>
    </section>
  );
}

function Teachers() {
  const gets = [
    { icon: Users, text: "Classrooms with join codes, rosters and attendance" },
    { icon: ClipboardList, text: "Assignments with deadlines, file submissions and grading" },
    { icon: ChartNoAxesColumnIncreasing, text: "Question banks, auto-marked tests and a gradebook" },
    { icon: Video, text: "Live classes with screen sharing for your enrolled students" },
  ];
  return (
    <section id="teachers" className="container-page scroll-mt-16 py-20 md:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading title="Teach the students who need you most."
            intro="We are recruiting qualified teachers for every class from Nursery to SS3 and for each exam track. Apply with your qualifications and the subjects you teach. An administrator reviews every application before an account is opened." />
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/signup?role=teacher" size="lg">Apply to teach</ButtonLink>
            <ButtonLink href="/login?as=teacher" size="lg" variant="outline">Teacher login</ButtonLink>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {gets.map(({ icon: Icon, text }) => (
            <li key={text} className="rounded-[1.25rem] border border-line bg-white p-5">
              <Icon className="size-6 text-adire-700" aria-hidden="true" />
              <p className="mt-3 font-medium leading-snug">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Parents() {
  const safety = [
    { icon: UserRoundCheck, title: "You set up young learners", text: "Nursery and Primary accounts are created or approved by a parent or guardian." },
    { icon: MessageSquareLock, title: "No private chat with children", text: "Teachers message parents, never pupils, and every conversation can be reviewed by moderators." },
    { icon: ShieldCheck, title: "Children's details stay private", text: "Profiles are never public. Leaderboards are off unless a class opts in, and show first names only." },
    { icon: BellRing, title: "You hear about results first", text: "Graded work, test results and new assignments are sent to your dashboard as they happen." },
  ];
  return (
    <section id="parents" className="scroll-mt-16 border-y border-line bg-white py-20 md:py-28">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <SectionHeading title="See exactly how your child is doing."
            intro="Link each child with a secure code from their profile. You will see their results, attendance, assignments and teacher feedback, and nothing that belongs to anyone else." />
          <ButtonLink href="/signup?role=parent" size="lg">Create a parent account</ButtonLink>
        </div>
        <ul className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {safety.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <Icon className="mt-1 size-6 shrink-0 text-leaf-500" aria-hidden="true" />
              <div>
                <h3 className="font-sans text-lg font-semibold tracking-normal">{title}</h3>
                <p className="mt-1 text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Stories({ testimonials }: { testimonials: Catalogue["testimonials"] }) {
  return (
    <section className="container-page py-20 md:py-28">
      <SectionHeading title="From our learning community" />
      {testimonials.length === 0 ? (
        <div className="mt-10 grid gap-6 rounded-[1.75rem] bg-wash p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <p className="font-display text-2xl font-bold">Pilot schools are joining now.</p>
            <p className="mt-2 max-w-xl text-muted">We will share what students, parents and teachers say about {brand.name} here, in their own words, once our first pilot term ends.</p>
          </div>
          <ButtonLink href={`mailto:${brand.supportEmail}?subject=Pilot%20school`} variant="outline">Bring {brand.name} to your school</ButtonLink>
        </div>
      ) : (
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <li key={t.id} className="flex flex-col rounded-[1.5rem] border border-line bg-white p-6">
              <blockquote className="text-lg leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
              <p className="mt-auto pt-5 text-sm"><span className="font-semibold">{t.author_name}</span><span className="text-muted">, {t.author_role}</span></p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Pricing({ plans, paidFeatures }: { plans: Catalogue["plans"]; paidFeatures: boolean }) {
  const studentPlans = plans.filter((p) => p.audience === "student");
  const otherPlans = plans.filter((p) => p.audience !== "student");
  const per: Record<string, string> = { month: "per month", term: "per term", year: "per year", once: "one-off" };
  return (
    <section id="pricing" className="scroll-mt-16 bg-white py-20 md:py-28">
      <div className="container-page">
        <SectionHeading title="Simple plans in naira" intro="Start free. Upgrade when you want live classes, the learning companion or full exam preparation." />
        {!paidFeatures && (
          <p className="mt-6 inline-flex rounded-full bg-sun-100 px-4 py-2 text-sm font-medium text-ink">
            Pilot term: every feature is free while we launch. The prices below apply from launch.
          </p>
        )}
        {plans.length === 0 ? (
          <p className="mt-8 text-muted">Plans are being finalised. Contact {brand.supportEmail} for school pricing.</p>
        ) : (
          <>
            <ul className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {studentPlans.map((p) => (
                <li key={p.key} className={`flex flex-col rounded-[1.5rem] p-6 ${p.is_featured ? "bg-adire-700 text-white shadow-pop" : "border border-line bg-paper"}`}>
                  <h3 className="font-sans text-lg font-semibold tracking-normal">{p.name}</h3>
                  <p className={`mt-1 text-sm ${p.is_featured ? "text-adire-100" : "text-muted"}`}>{p.description}</p>
                  <p className="mt-5 font-display text-4xl font-bold tabular">
                    {p.price_kobo === 0 ? "Free" : formatNaira(p.price_kobo) ?? "Talk to us"}
                  </p>
                  {p.price_kobo ? <p className={`text-sm ${p.is_featured ? "text-adire-100" : "text-muted"}`}>{per[p.billing_interval]}</p> : <p className="text-sm opacity-0">.</p>}
                  <ul className="mt-6 grid gap-2.5 text-[0.95rem]">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2.5"><Check className={`mt-0.5 size-4 shrink-0 ${p.is_featured ? "text-sun-400" : "text-leaf-500"}`} aria-hidden="true" />{f}</li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-7">
                    <ButtonLink href={`/signup?plan=${p.key}`} variant={p.is_featured ? "accent" : "outline"} className="w-full">
                      {p.price_kobo === 0 ? "Start free" : `Choose ${p.name.toLowerCase()}`}
                    </ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
            {otherPlans.length > 0 && (
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {otherPlans.map((p) => (
                  <li key={p.key} className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-line p-6 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-sans text-lg font-semibold tracking-normal">{p.name}</h3>
                      <p className="text-sm text-muted">{p.description} {p.features.slice(0, 2).join(". ")}.</p>
                    </div>
                    <ButtonLink href={p.audience === "teacher" ? "/signup?role=teacher" : `mailto:${brand.supportEmail}?subject=School%20plan`} variant="outline" className="shrink-0">
                      {p.audience === "teacher" ? "Apply to teach" : "Talk to us"}
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}

const faqs = [
  ["Which classes does AfriLearn cover?", "Nursery 1 to 3, Primary 1 to 6, JSS 1 to 3 and SS 1 to 3, plus dedicated preparation for WAEC, NECO, JAMB, NABTEB and scholarship or entrance examinations. Administrators decide which subjects belong to each class."],
  ["How does my child join their teacher's class?", "Teachers share a six-character class code. Your child enters it on their dashboard and the classroom appears straight away."],
  ["Can young children use it safely?", "Nursery and Primary accounts are set up with a parent or guardian's consent. Children cannot message adults privately, profiles are never public and leaderboards show first names only when a class chooses to use them."],
  ["How do I link my child to my parent account?", "Your child copies the link code from their profile page. You enter it on your parent dashboard to see their progress. You can link several children."],
  ["Who are the teachers?", "Teachers apply with their qualifications, experience and subjects. An administrator reviews each application before the teacher can create classrooms, courses or examinations."],
  ["Are the exam questions from past papers?", "Our question banks are written by our teachers or imported from sources we are licensed to use. We do not copy copyrighted past papers."],
  ["Does it work on a phone and with slow internet?", "Yes. Every page is built for small screens first, loads quickly and saves exam answers as you go, so a dropped connection does not lose your work."],
  ["How do payments work?", "Plans are paid in naira through Paystack. A plan only becomes active after Paystack confirms the payment to our server."],
];

function Faq() {
  return (
    <section id="faq" className="container-page scroll-mt-16 py-20 md:py-28">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading title="Questions people ask" intro={`Something else on your mind? Write to ${brand.supportEmail}.`} />
        <div className="divide-y divide-line border-y border-line">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-wash text-adire-700 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 pr-12 leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
