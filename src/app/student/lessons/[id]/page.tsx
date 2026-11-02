import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "@/components/app/AppShell";
import { Markdown, videoEmbed } from "@/components/app/Markdown";
import { LessonProgress } from "./LessonProgress";

export const metadata = { title: "Lesson" };

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireRole("student");
  const { id } = await params;
  const supabase = await createClient();
  const { data: lesson } = await supabase.from("lessons")
    .select("id, title, summary, content, video_url, video_path, duration_minutes, course_id, topics(title), courses(title, slug)")
    .eq("id", id).maybeSingle();
  if (!lesson) notFound();
  const [{ data: siblings }, { data: progress }, { data: materials }] = await Promise.all([
    supabase.from("lessons").select("id, title, sort_order").eq("course_id", lesson.course_id).eq("is_published", true).order("sort_order"),
    supabase.from("lesson_progress").select("status").eq("student_id", userId).eq("lesson_id", id).maybeSingle(),
    supabase.from("learning_materials").select("id, title, material_type, storage_path, external_url").eq("lesson_id", id),
  ]);
  const list = siblings ?? [];
  const i = list.findIndex((l) => l.id === id);
  const prev = i > 0 ? list[i - 1] : null;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  const course = lesson.courses as unknown as { title: string; slug: string } | null;
  const topic = lesson.topics as unknown as { title: string } | null;
  const embed = videoEmbed(lesson.video_url);

  return (
    <article className="mx-auto grid max-w-4xl gap-6">
      <Link href={`/student/courses/${course?.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-adire-700 hover:underline">
        <ChevronLeft className="size-4" aria-hidden="true" />{course?.title}
      </Link>
      <header>
        <p className="text-sm text-muted">Lesson {i + 1} of {list.length}{topic ? `, ${topic.title}` : ""}{lesson.duration_minutes ? `, about ${lesson.duration_minutes} minutes` : ""}</p>
        <h1 className="mt-1 text-3xl font-bold md:text-4xl">{lesson.title}</h1>
        {lesson.summary && <p className="mt-2 text-lg text-muted">{lesson.summary}</p>}
      </header>

      {embed ? (
        <div className="aspect-video overflow-hidden rounded-[1.25rem] bg-ink">
          <iframe src={embed} title={`Video: ${lesson.title}`} className="size-full" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
        </div>
      ) : lesson.video_path ? (
        <video controls preload="metadata" className="aspect-video w-full rounded-[1.25rem] bg-ink" src={`/api/files/materials?path=${encodeURIComponent(lesson.video_path)}`} />
      ) : null}

      {lesson.content && <Panel><Markdown source={lesson.content} /></Panel>}

      {(materials ?? []).length > 0 && (
        <Panel title="Materials for this lesson">
          <ul className="grid gap-2 text-sm">
            {(materials ?? []).map((m) => (
              <li key={m.id}><a href={m.storage_path ? `/api/files/materials?path=${encodeURIComponent(m.storage_path)}` : m.external_url ?? "#"} target="_blank" className="flex items-center gap-2 font-medium hover:underline"><FileText className="size-4 text-adire-700" aria-hidden="true" />{m.title}</a></li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] border border-line bg-white p-5">
        <LessonProgress lessonId={lesson.id} initial={progress?.status ?? null} nextHref={next ? `/student/lessons/${next.id}` : null} />
        <nav className="flex gap-4 text-sm font-semibold" aria-label="Lesson navigation">
          {prev && <Link href={`/student/lessons/${prev.id}`} className="text-adire-700 hover:underline">Previous: {prev.title}</Link>}
        </nav>
      </div>
    </article>
  );
}
