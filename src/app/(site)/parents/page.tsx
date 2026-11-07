import type { Metadata } from "next";
import { photos } from "@/config/photos";
import { BellRing, Check, MessageSquareLock, Play, ShieldCheck, Trophy, UserRoundCheck, Video } from "lucide-react";
import { CtaBand, PageHero, SectionHeading, Steps } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "For parents",
  description: "Follow your Primary 1 to 6 child's videos, quizzes, results and teacher feedback, with child safety built in.",
};

const safety = [
  { icon: UserRoundCheck, title: "You set up young learners", text: "Every pupil account is created or approved by a parent or guardian." },
  { icon: MessageSquareLock, title: "No private chat with children", text: "Teachers message parents, never pupils, and every conversation can be reviewed by moderators." },
  { icon: ShieldCheck, title: "Children's details stay private", text: "Profiles are never public. Leaderboards are off unless a class opts in, and show first names only." },
  { icon: BellRing, title: "You hear about results first", text: "Graded work, test results and new assignments reach your dashboard as they happen." },
];

const sees = [
  "Which class videos they watched, and when",
  "Quiz and test results, with the teacher's comments",
  "Assignments that are due, handed in, late or marked",
  "Attendance for live classes",
  "Badges, points and learning streaks",
  "Strong and weak topics, so you know where to help",
];

export default function ParentsPage() {
  return (
    <>
      <PageHero theme="bubble" art={{ kind: "photo", src: photos.graduate.src, alt: photos.graduate.alt, tiko: true }} title="See exactly how your child is doing."
        intro="Set up your child's account, or link it with a secure code. You see their videos, quizzes, results and teacher feedback, and nothing that belongs to anyone else.">
        <ButtonLink href="/signup?role=parent" size="lg">Create a parent account</ButtonLink>
        <ButtonLink href="/login" size="lg" variant="outline">Log in</ButtonLink>
      </PageHero>

      <section className="container-page py-14 sm:py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <ul className="mx-auto grid w-full max-w-md gap-4" aria-label="Example updates a parent receives">
            {[
              { icon: Video, tone: "bg-tangerine-400", title: "Amina watched a new video", text: "What are equivalent fractions? Primary 5 Maths", tilt: "-rotate-2" },
              { icon: Trophy, tone: "bg-sun-400", title: "Result: Science Check, 83%", text: "Mr Bakare: \u201cWell done on plant parts!\u201d", tilt: "rotate-1" },
              { icon: Play, tone: "bg-sky-400", title: "Live class tomorrow, 4:00 pm", text: "Fractions with pizza. Paper and scissors ready!", tilt: "-rotate-1" },
            ].map(({ icon: Icon, tone, title, text, tilt }) => (
              <li key={title} className={`sticker flex items-center gap-4 rounded-[1.4rem] bg-white p-4 ${tilt}`}>
                <span className={`grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-ink ${tone}`}><Icon className="size-5" aria-hidden="true" /></span>
                <span className="leading-snug"><span className="block font-display text-lg font-semibold">{title}</span><span className="text-sm text-muted">{text}</span></span>
              </li>
            ))}
          </ul>
          <div>
            <SectionHeading title="What you will see" />
            <ul className="mt-8 grid gap-3.5">
              {sees.map((s) => (
                <li key={s} className="flex gap-3 text-lg">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime-400"><Check className="size-4" strokeWidth={3} aria-hidden="true" /></span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-20 md:py-28">
        <div className="container-page">
          <SectionHeading title="Linking your child takes a minute" />
          <Steps className="mt-12" steps={[
            ["Create your parent account", "Sign up as a parent or guardian with your own email address."],
            ["Add your child", "Create their pupil account with you as the guardian, or enter the link code from their profile page."],
            ["Enter the code", "Add it on your dashboard. Repeat for each child; there is no limit."],
          ]} />
        </div>
      </section>

      <section className="container-page py-14 sm:py-20 md:py-28">
        <SectionHeading title="Child safety comes first" intro="These rules are enforced by the platform itself, not left to good intentions." />
        <ul className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {safety.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-grape-100 text-grape-700"><Icon className="size-6" aria-hidden="true" /></span>
              <div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-1 text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand title="Stay close to their learning." text="Create a free parent account and add your first child today.">
        <ButtonLink href="/signup?role=parent" size="lg">Create a parent account</ButtonLink>
      </CtaBand>
    </>
  );
}
