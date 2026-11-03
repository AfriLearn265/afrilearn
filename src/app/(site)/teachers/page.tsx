import type { Metadata } from "next";
import { ChartNoAxesColumnIncreasing, ClipboardList, FileQuestion, MessagesSquare, Users, Video } from "lucide-react";
import { CtaBand, PageHero, Photo, SectionHeading, Steps } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "For teachers",
  description: "Run classrooms, set auto-marked tests, keep a gradebook and teach live. Free for approved teachers.",
};

const tools = [
  { icon: Users, title: "Classrooms with join codes", text: "Share a six-character code. Your roster, attendance and announcements live in one place." },
  { icon: ClipboardList, title: "Assignments and grading", text: "Set deadlines, accept files, mark with feedback and see who submitted late." },
  { icon: FileQuestion, title: "Question banks and tests", text: "Objective questions mark themselves. Theory answers wait for you in a marking queue." },
  { icon: ChartNoAxesColumnIncreasing, title: "A proper gradebook", text: "Every test and assignment score for every student, in one table you can scan in seconds." },
  { icon: Video, title: "Live classes", text: "Schedule a class, teach with screen sharing, and attendance is taken when students join." },
  { icon: MessagesSquare, title: "Messages with parents", text: "Talk to parents about their child in moderated threads. Teachers never message pupils privately." },
];

export default function TeachersPage() {
  return (
    <>
      <PageHero id="teachers" photo="teacher" title="Teach the students who need you most."
        intro="We are recruiting qualified teachers for every class from Nursery to SS 3 and for each exam track. Teacher accounts are free.">
        <ButtonLink href="/signup?role=teacher" size="lg" variant="accent">Apply to teach</ButtonLink>
        <ButtonLink href="/login?as=teacher" size="lg" variant="onDark">Teacher login</ButtonLink>
      </PageHero>

      <section className="container-page py-14 sm:py-20 md:py-28">
        <SectionHeading title="Everything a class needs" intro="The tools you already use in school, joined up so marking, records and parent updates take less of your evening." />
        <ul className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="grid size-11 place-items-center rounded-xl bg-wash text-adire-700"><Icon className="size-5" aria-hidden="true" /></span>
              <h3 className="mt-4 font-sans text-lg font-semibold tracking-normal">{title}</h3>
              <p className="mt-1.5 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line bg-white py-14 sm:py-20 md:py-28">
        <div className="container-page">
          <SectionHeading title="From application to first class" intro="Every teacher is reviewed by an administrator before they can teach, so parents know who is in the room." />
          <Steps className="mt-12" steps={[
            ["Apply", "Tell us your qualification, experience, the subjects and classes you teach, and upload your certificates."],
            ["Get approved", "An administrator checks your application. You will see the decision on your dashboard."],
            ["Open a classroom", "Create a classroom for each class you teach and share its join code with your students."],
            ["Teach and mark", "Publish lessons, set work and tests, go live, and follow progress in your gradebook."],
          ]} />
        </div>
      </section>

      <section className="container-page py-14 sm:py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-[14rem] rounded-b-[2rem] lg:order-2">
            <Photo name="lab" sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
          <div>
            <SectionHeading title="Write once, use every term."
              intro="Questions you write stay in your own banks. Reuse them in new tests, share a bank with other teachers, and let students practise from it in the CBT Centre." />
            <ButtonLink href="/signup?role=teacher" size="lg" className="mt-8">Apply to teach</ButtonLink>
          </div>
        </div>
      </section>

      <CtaBand title="Ready to teach?" text="Applications take about five minutes. Have your qualification and subjects ready." photo="reading">
        <ButtonLink href="/signup?role=teacher" size="lg" variant="accent">Apply to teach</ButtonLink>
      </CtaBand>
    </>
  );
}
