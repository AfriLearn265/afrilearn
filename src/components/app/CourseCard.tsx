import Link from "next/link";
import type { CourseWithProgress } from "@/lib/learning";

export function ProgressBar({ value, tone = "adire" }: { value: number; tone?: "adire" | "leaf" }) {
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-wash" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span className={`block h-full rounded-full ${tone === "leaf" ? "bg-leaf-500" : "bg-adire-700"}`} style={{ width: `${value}%` }} />
    </span>
  );
}

export function CourseCard({ course }: { course: CourseWithProgress }) {
  const done = course.lessons.length > 0 && course.completed === course.lessons.length;
  return (
    <Link href={`/student/courses/${course.slug}`} className="flex h-full flex-col rounded-[1.25rem] border border-line bg-white p-5 transition-colors hover:border-adire-300">
      <p className="flex items-center gap-2 text-sm">
        <span className="size-2.5 rounded-full" style={{ background: course.subject?.color ?? "#2B3A9F" }} aria-hidden="true" />
        <span className="font-medium text-ink-soft">{course.subject?.name ?? "General"}</span>
        {course.klass && <span className="text-muted">{course.klass.name}</span>}
      </p>
      <h3 className="mt-2 text-lg font-bold leading-snug">{course.title}</h3>
      {course.summary && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{course.summary}</p>}
      <div className="mt-auto pt-5">
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="text-muted">{course.completed} of {course.lessons.length} lessons</span>
          <span className="font-semibold tabular">{done ? "Complete" : `${course.progress}%`}</span>
        </div>
        <ProgressBar value={course.progress} tone={done ? "leaf" : "adire"} />
      </div>
    </Link>
  );
}
