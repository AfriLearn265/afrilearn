import { requireRole } from "@/lib/auth";
import { getStudentCourses } from "@/lib/learning";
import { PageHeader, EmptyState } from "@/components/app/AppShell";
import { CourseCard } from "@/components/app/CourseCard";

export const metadata = { title: "Courses" };

export default async function StudentCourses({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { userId } = await requireRole("student");
  const { subject } = await searchParams;
  const { classId, courses } = await getStudentCourses(userId);
  const filtered = subject ? courses.filter((c) => c.subject?.name === subject) : courses;
  const sections = [
    { title: "Continue learning", items: filtered.filter((c) => c.started > 0 && c.progress < 100) },
    { title: "From your classrooms", items: filtered.filter((c) => c.classroom_id && c.started === 0) },
    { title: "For your class", items: filtered.filter((c) => !c.classroom_id && c.class_id === classId && c.started === 0) },
    { title: "Completed", items: filtered.filter((c) => c.progress === 100) },
    { title: "More to explore", items: filtered.filter((c) => !c.classroom_id && c.class_id !== classId && c.started === 0) },
  ].filter((s) => s.items.length);
  const subjects = [...new Set(courses.map((c) => c.subject?.name).filter((s): s is string => !!s))].sort();

  return (
    <>
      <PageHeader title="Courses" intro="Self-paced lessons with videos, notes and materials. Finish every lesson in a course to earn a certificate." />
      {subjects.length > 1 && (
        <nav aria-label="Filter by subject" className="mb-6 flex flex-wrap gap-2">
          {["", ...subjects].map((s) => (
            <a key={s || "all"} href={s ? `/student/courses?subject=${encodeURIComponent(s)}` : "/student/courses"}
              aria-current={(subject ?? "") === s ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${(subject ?? "") === s ? "border-adire-700 bg-adire-700 text-white" : "border-line bg-white hover:border-adire-300"}`}>
              {s || "All subjects"}
            </a>
          ))}
        </nav>
      )}
      {sections.length === 0 ? (
        <EmptyState title="No courses are published for you yet.">Courses from your teachers and for your class appear here as soon as they are published.</EmptyState>
      ) : (
        <div className="grid gap-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="mb-4 font-sans text-xl font-semibold tracking-normal">{s.title}</h2>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{s.items.map((c) => <li key={c.id}><CourseCard course={c} /></li>)}</ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
