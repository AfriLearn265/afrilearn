import type { Metadata } from "next";
import { CourseTile } from "@/components/landing/CourseTile";
import { CtaBand, PageHero } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";
import { getCourses } from "@/lib/catalogue";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Courses",
  description: "Short, colourful courses written by approved Nigerian teachers for Primary 1 to Primary 6.",
};

export default async function CoursesPage() {
  const courses = await getCourses(24);
  const subjects = [...new Set(courses.map((c) => c.subject?.name).filter(Boolean))];

  return (
    <>
      <PageHero theme="lime" art={{ kind: "subjects" }} title="Courses that make learning click."
        intro="Short lessons with videos, pictures and practice, matched to each class from Primary 1 to 6. Finish every lesson to earn a certificate.">
        <ButtonLink href="/signup" size="lg">Create a free account</ButtonLink>
        <ButtonLink href="/login" size="lg" variant="light">Log in to continue</ButtonLink>
      </PageHero>

      <section className="container-page py-16 md:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-3xl font-semibold md:text-4xl">All courses</h2>
          {courses.length > 0 && (
            <p className="text-muted">{courses.length} {courses.length === 1 ? "course" : "courses"} across {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}</p>
          )}
        </div>
        {courses.length === 0 ? (
          <div className="mt-10 rounded-[1.75rem] border-2 border-dashed border-grape-200 bg-grape-50 px-6 py-12 text-center">
            <p className="font-display text-2xl font-semibold">The first courses are being written now.</p>
            <p className="mx-auto mt-2 max-w-md text-muted">Approved teachers publish courses from their dashboard. They appear here the moment they go live.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => <CourseTile key={c.id} course={c} />)}
          </ul>
        )}
        <p className="mt-8 max-w-2xl text-sm text-muted">
          Classroom courses that a teacher shares only with their own pupils appear on those pupils&apos; dashboards, not here.
        </p>
      </section>

      <CtaBand title="Teach a course of your own." text="Approved teachers write lessons in a simple editor, add videos and notes, and publish when they are ready.">
        <ButtonLink href="/teachers" size="lg">See how teaching works</ButtonLink>
      </CtaBand>
    </>
  );
}
