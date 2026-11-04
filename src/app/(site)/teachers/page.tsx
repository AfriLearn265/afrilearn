import type { Metadata } from "next";
import { ChartNoAxesColumnIncreasing, ClipboardList, Clapperboard, FileQuestion, MessagesSquare, UploadCloud, Users, Video } from "lucide-react";
import { CtaBand, PageHero, SectionHeading, Steps } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "For teachers",
  description: "Upload class videos, run classrooms, set quizzes that mark themselves and teach live, for Primary 1 to 6.",
};

const tools = [
  { icon: Clapperboard, title: "Videos for your class", text: "Upload a short video or paste a YouTube link, choose the class and subject, and pupils are told at once." },
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
      <PageHero id="teachers" mascot={{ pose: "cheer", prop: "cap" }} title="Teach the little ones who need you most."
        intro="We are recruiting qualified primary school teachers for every class from Primary 1 to Primary 6. Teacher accounts are free.">
        <ButtonLink href="/signup?role=teacher" size="lg" variant="accent">Apply to teach</ButtonLink>
        <ButtonLink href="/login?as=teacher" size="lg" variant="onDark">Teacher login</ButtonLink>
      </PageHero>

      <section className="container-page py-14 sm:py-20 md:py-28">
        <SectionHeading title="Everything a class needs" intro="The tools you already use in school, joined up so marking, records and parent updates take less of your evening." />
        <ul className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className={`grid size-12 place-items-center rounded-2xl border-2 border-ink ${["bg-tangerine-400", "bg-sun-400", "bg-lime-400", "bg-sky-400", "bg-bubble-400", "bg-grape-300", "bg-tangerine-300"][tools.findIndex((t) => t.title === title) % 7]}`}><Icon className="size-5" aria-hidden="true" /></span>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-1.5 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white py-14 sm:py-20 md:py-28">
        <div className="container-page">
          <SectionHeading title="From application to first class" intro="Every teacher is reviewed by an administrator before they can teach, so parents know who is in the room." />
          <Steps className="mt-12" steps={[
            ["Apply", "Tell us your qualification, experience, the subjects and classes you teach, and upload your certificates."],
            ["Get approved", "An administrator checks your application. You will see the decision on your dashboard."],
            ["Open a classroom", "Create a classroom for each class you teach and share its join code with your pupils and their parents."],
            ["Teach and mark", "Publish lessons, set work and tests, go live, and follow progress in your gradebook."],
          ]} />
        </div>
      </section>

      <section className="container-page py-14 sm:py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="sticker mx-auto w-full max-w-md rotate-1 rounded-[1.75rem] bg-white p-6 lg:order-2" aria-hidden="true">
            <p className="font-display text-xl font-semibold">Add a class video</p>
            <div className="mt-4 grid place-items-center rounded-2xl border-2 border-dashed border-grape-300 bg-grape-50 px-4 py-8 text-center">
              <UploadCloud className="size-9 text-grape-600" />
              <p className="mt-2 font-semibold">fractions-lesson-1.mp4</p>
              <div className="mt-3 h-3 w-48 overflow-hidden rounded-full bg-white"><div className="h-full w-[72%] rounded-full bg-tangerine-400" /></div>
              <p className="mt-1.5 text-sm text-muted">Uploading, 72%</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <span className="rounded-xl border-2 border-line px-3 py-2"><span className="block text-xs text-muted">Class</span><span className="font-semibold">Primary 5</span></span>
              <span className="rounded-xl border-2 border-line px-3 py-2"><span className="block text-xs text-muted">Subject</span><span className="font-semibold">Mathematics</span></span>
            </div>
          </div>
          <div>
            <SectionHeading title="Record once, teach every term."
              intro="Videos and questions you make stay in your library. Reuse them next term, share them with other teachers, and let pupils practise as often as they like." />
            <ButtonLink href="/signup?role=teacher" size="lg" className="mt-8">Apply to teach</ButtonLink>
          </div>
        </div>
      </section>

      <CtaBand title="Ready to teach?" text="Applications take about five minutes. Have your qualification and the classes you teach ready.">
        <ButtonLink href="/signup?role=teacher" size="lg">Apply to teach</ButtonLink>
      </CtaBand>
    </>
  );
}
