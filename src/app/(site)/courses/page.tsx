import type { Metadata } from "next";
import { CourseTile } from "@/components/landing/CourseTile";
import { CtaBand, PageHero } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";
import { getCourses } from "@/lib/catalogue";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Courses",
  description: "Self-paced courses written by approved Nigerian teachers, from Nursery number work to JAMB Use of English.",
};

export default async function CoursesPage() {
  const courses = await getCourses(24);
  const subjects = [...new Set(courses.map((c) => c.subject?.name).filter(Boolean))];

  return (
    <>
      <PageHero id="courses" photo="student" title="Courses written by Nigerian teachers."
        intro="Self-paced lessons with worked examples and practice, matched to your class. Finish every lesson to earn a certificate anyone can verify.">
        <ButtonLink href="/signup" size="lg" variant="accent">Create a free account</ButtonLink>
        <ButtonLink href="/login" size="lg" variant="onDark">Log in to continue</ButtonLink>
      </PageHero>

      <section className="container-page py-16 md:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-3xl font-bold md:text-4xl">All courses</h2>
          {courses.length > 0 && (
            <p className="text-muted">{courses.length} {courses.length === 1 ? "course" : "courses"} across {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}</p>
          )}
        </div>
        {courses.length === 0 ? (
          <div className="mt-10 rounded-[1.5rem] border border-dashed border-adire-200 bg-adire-50 px-6 py-12 text-center">
            <p className="font-display text-xl font-bold">The first courses are being written now.</p>
            <p className="mx-auto mt-2 max-w-md text-muted">Approved teachers publish courses from their dashboard. They appear here the moment they go live.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => <CourseTile key={c.id} course={c} />)}
          </ul>
        )}
        <p className="mt-8 max-w-2xl text-sm text-muted">
          Classroom courses that a teacher shares only with their own students appear on those students&apos; dashboards, not here.
        </p>
      </section>

      <CtaBand title="Teach a course of your own." text="Approved teachers write lessons in a simple editor, add videos and notes, and publish when they are ready." photo="teacher">
        <ButtonLink href="/teachers" size="lg" variant="accent">See how teaching works</ButtonLink>
      </CtaBand>
    </>
  );
}
