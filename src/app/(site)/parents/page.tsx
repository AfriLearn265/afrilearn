import type { Metadata } from "next";
import { BellRing, Check, MessageSquareLock, ShieldCheck, UserRoundCheck } from "lucide-react";
import { CtaBand, PageHero, Photo, SectionHeading, Steps } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "For parents",
  description: "Follow your child's results, attendance, assignments and teacher feedback, with child safety built in.",
};

const safety = [
  { icon: UserRoundCheck, title: "You set up young learners", text: "Nursery and Primary accounts are created or approved by a parent or guardian." },
  { icon: MessageSquareLock, title: "No private chat with children", text: "Teachers message parents, never pupils, and every conversation can be reviewed by moderators." },
  { icon: ShieldCheck, title: "Children's details stay private", text: "Profiles are never public. Leaderboards are off unless a class opts in, and show first names only." },
  { icon: BellRing, title: "You hear about results first", text: "Graded work, test results and new assignments reach your dashboard as they happen." },
];

const sees = [
  "Test and exam results, with grades and the teacher's comments",
  "Assignments that are due, handed in, late or marked",
  "Attendance for classes and live lessons",
  "Courses finished, certificates earned and learning streaks",
  "Strong and weak topics, so you know where to help",
];

export default function ParentsPage() {
  return (
    <>
      <PageHero id="parents" photo="parent" title="See exactly how your child is doing."
        intro="Link each child with a secure code from their profile. You see their results, attendance, assignments and teacher feedback, and nothing that belongs to anyone else.">
        <ButtonLink href="/signup?role=parent" size="lg" variant="accent">Create a parent account</ButtonLink>
        <ButtonLink href="/login" size="lg" variant="onDark">Log in</ButtonLink>
      </PageHero>

      <section className="container-page py-14 sm:py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <Photo name="primary" sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
          <div>
            <SectionHeading title="What you will see" />
            <ul className="mt-8 grid gap-3.5">
              {sees.map((s) => (
                <li key={s} className="flex gap-3 text-lg">
                  <Check className="mt-1 size-5 shrink-0 text-leaf-500" aria-hidden="true" />{s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white py-14 sm:py-20 md:py-28">
        <div className="container-page">
          <SectionHeading title="Linking your child takes a minute" />
          <Steps className="mt-12" steps={[
            ["Create your parent account", "Sign up as a parent or guardian with your own email address."],
            ["Get your child's link code", "Your child finds it on their profile page. Nursery and Primary pupils sign up with you named as their guardian."],
            ["Enter the code", "Add it on your dashboard. Repeat for each child; there is no limit."],
          ]} />
        </div>
      </section>

      <section className="container-page py-14 sm:py-20 md:py-28">
        <SectionHeading title="Child safety comes first" intro="These rules are enforced by the platform itself, not left to good intentions." />
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
      </section>

      <CtaBand title="Stay close to their learning." text="Create a free parent account and link your first child today." photo="smiling">
        <ButtonLink href="/signup?role=parent" size="lg" variant="accent">Create a parent account</ButtonLink>
      </CtaBand>
    </>
  );
}
