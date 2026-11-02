import Link from "next/link";
import type { FeaturedCourse } from "@/lib/catalogue";

export function CourseTile({ course: c }: { course: FeaturedCourse }) {
  const color = c.subject?.color ?? "#2B3A9F";
  return (
    <li className="flex flex-col overflow-hidden rounded-[1.5rem] border border-line bg-white">
      <span aria-hidden="true" className="h-1.5" style={{ background: color }} />
      <div className="flex flex-1 flex-col p-6">
        <p className="flex items-center gap-2 text-sm">
          <span className="font-semibold" style={{ color }}>{c.subject?.name ?? "General"}</span>
          {c.klass && <span className="text-muted">for {c.klass.name}</span>}
        </p>
        <h3 className="mt-2.5 text-xl font-bold">{c.title}</h3>
        {c.summary && <p className="mt-2 line-clamp-3 text-muted">{c.summary}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
          <span className="text-ink-soft">{c.lessons} {c.lessons === 1 ? "lesson" : "lessons"}, {c.difficulty} level</span>
          <Link href={`/login?next=/student/courses/${c.slug}`} className="font-semibold text-adire-700 underline-offset-4 hover:underline">
            Start course<span className="sr-only">: {c.title}</span>
          </Link>
        </div>
      </div>
    </li>
  );
}
