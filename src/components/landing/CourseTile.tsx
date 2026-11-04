import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { FeaturedCourse } from "@/lib/catalogue";

export function CourseTile({ course: c }: { course: FeaturedCourse }) {
  const color = c.subject?.color ?? "#4A1FB8";
  return (
    <li className="group flex flex-col overflow-hidden rounded-[1.75rem] border-2 border-line bg-white transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-ink">
      <div className="relative h-28 overflow-hidden" style={{ background: color }}>
        <span aria-hidden="true" className="absolute -right-6 -top-10 size-36 rounded-full bg-white/20" />
        <span aria-hidden="true" className="absolute -bottom-12 left-10 size-28 rounded-full bg-black/10" />
        <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-sm font-bold text-ink">{c.subject?.name ?? "General"}</span>
        {c.klass && <span className="absolute bottom-4 right-5 font-display text-lg font-semibold text-white">{c.klass.name}</span>}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-2xl font-semibold">{c.title}</h3>
        {c.summary && <p className="mt-2 line-clamp-3 text-muted">{c.summary}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink-soft">
            <BookOpen className="size-4" aria-hidden="true" />{c.lessons} {c.lessons === 1 ? "lesson" : "lessons"}
          </span>
          <Link href={`/login?next=/student/courses/${c.slug}`} className="rounded-full bg-grape-50 px-4 py-2 font-display font-semibold text-grape-700 hover:bg-grape-100">
            Start course<span className="sr-only">: {c.title}</span>
          </Link>
        </div>
      </div>
    </li>
  );
}
