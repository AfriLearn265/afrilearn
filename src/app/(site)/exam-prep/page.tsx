import type { Metadata } from "next";
import { Check } from "lucide-react";
import { CbtDemo } from "@/components/landing/CbtDemo";
import { AdirePattern, CtaBand, PageHero, Photo, SectionHeading, Steps } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Exam preparation",
  description: "CBT practice and timed mocks for WAEC, NECO, JAMB, NABTEB and entrance examinations, with an explanation after every answer.",
};

const tracks = [
  { code: "WAEC", name: "WASSCE", text: "The West African Senior School Certificate Examination, taken at the end of SS 3. Objective and theory practice across your subjects." },
  { code: "NECO", name: "SSCE", text: "The National Examinations Council's Senior School Certificate Examination, taken in SS 3 alongside or instead of WAEC." },
  { code: "JAMB", name: "UTME", text: "The computer-based entrance examination for universities, polytechnics and colleges of education. Practise Use of English and your three subjects against the clock." },
  { code: "NABTEB", name: "NBC and NTC", text: "Technical and business certificate examinations, for students in technical colleges and trade subjects." },
  { code: "Entrance", name: "Common Entrance and scholarships", text: "The National Common Entrance into unity colleges, plus school entrance and scholarship aptitude tests." },
];

export default function ExamPrepPage() {
  return (
    <>
      <PageHero id="exams" photo="candidate" title="Practise for WAEC, NECO and JAMB the way the real CBT feels."
        intro="Every session is a fresh paper from teacher-written question banks. Check each answer as you go, or sit a timed mock and see your grade.">
        <ButtonLink href="/signup?class=JAMB" size="lg" variant="accent">Start exam preparation</ButtonLink>
        <ButtonLink href="#sample" size="lg" variant="onDark">Try a sample question</ButtonLink>
      </PageHero>

      <section className="container-page py-14 sm:py-20 md:py-28">
        <SectionHeading title="Five exam tracks" intro="Choose your track when you sign up, then practise any subject in the CBT Centre." />
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {tracks.map((t) => (
            <li key={t.code} className="grid gap-3 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
              <span className="inline-grid h-10 w-fit min-w-20 place-items-center rounded-[0.85rem] border-2 border-sun-400 px-3 font-display text-sm font-bold">{t.code}</span>
              <div>
                <h3 className="font-sans text-lg font-semibold tracking-normal">{t.name}</h3>
                <p className="mt-1 max-w-2xl text-muted">{t.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="sample" className="relative isolate scroll-mt-16 overflow-hidden bg-adire-800 py-20 text-white md:py-28">
        <AdirePattern id="sample-adire" className="-z-10 text-adire-700/60 [mask-image:radial-gradient(60%_80%_at_0%_50%,black,transparent)]" />
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,30rem)]">
          <div>
            <SectionHeading light title="Try a question now." intro="This sample works like the real CBT Centre: a timer, four options and the answer explained when you check." />
            <ul className="mt-8 grid gap-3">
              {["Practice mode shows the explanation after each answer", "Mock mode marks everything when time runs out, just like the hall",
                "Your answers save as you go, so a dropped connection does not lose your work", "Results break down by topic, so you know what to revise"].map((p) => (
                <li key={p} className="flex gap-3 text-adire-50">
                  <Check className="mt-0.5 size-5 shrink-0 text-sun-400" aria-hidden="true" />{p}
                </li>
              ))}
            </ul>
          </div>
          <CbtDemo />
        </div>
      </section>

      <section className="container-page py-14 sm:py-20 md:py-28">
        <SectionHeading title="How a practice session works" />
        <Steps className="mt-12" steps={[
          ["Pick a subject", "Choose the exam, the subject and, if you like, one topic you want to fix."],
          ["Choose practice or mock", "Practice explains each answer. A mock is timed and marked at the end."],
          ["Answer the questions", "Flag questions to come back to and move around the paper freely."],
          ["Review your result", "See your grade, your score by topic and every question you missed."],
        ]} />
      </section>

      <section className="border-t border-line bg-white py-14 sm:py-20 md:py-28">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <Photo name="lab" sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
          <div>
            <SectionHeading title="Written by teachers, not copied."
              intro="Every question in our banks is written by an approved teacher or comes from a source we are licensed to use, with a worked explanation. We do not reproduce copyrighted past papers." />
            <ButtonLink href="/teachers" variant="outline" size="lg" className="mt-8">Write questions as a teacher</ButtonLink>
          </div>
        </div>
      </section>

      <CtaBand title="Your exam is closer than it looks." text="Start with a short practice session today, then sit a full mock at the weekend." photo="exam">
        <ButtonLink href="/signup?class=JAMB" size="lg" variant="accent">Start exam preparation</ButtonLink>
      </CtaBand>
    </>
  );
}
