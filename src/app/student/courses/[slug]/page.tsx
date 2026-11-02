import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, CheckCircle2, Circle, CircleDot, FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/app/AppShell";
import { ButtonLink } from "@/components/ui/Button";
import { ProgressBar } from "@/components/app/CourseCard";

export const metadata = { title: "Course" };

type Lesson = { id: string; title: string; summary: string | null; duration_minutes: number | null; topic_id: string | null; sort_order: number; video_url: string | null };

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await requireRole("student");
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses")
    .select("id, title, summary, description, estimated_hours, difficulty, subjects(name), classes(name), profiles(full_name)")
    .eq("slug", slug).eq("is_published", true).maybeSingle();
  if (!course) notFound();
  const [{ data: topics }, { data: lessonsData }, { data: progress }, { data: materials }, { data: cert }] = await Promise.all([
    supabase.from("topics").select("id, title").eq("course_id", course.id).order("sort_order"),
    supabase.from("lessons").select("id, title, summary, duration_minutes, topic_id, sort_order, video_url").eq("course_id", course.id).eq("is_published", true).order("sort_order"),
    supabase.from("lesson_progress").select("lesson_id, status").eq("student_id", userId),
    supabase.from("learning_materials").select("id, title, material_type, storage_path, external_url").eq("course_id", course.id).is("lesson_id", null),
    supabase.from("certificates").select("certificate_no, issued_at").eq("student_id", userId).eq("course_id", course.id).maybeSingle(),
  ]);
  const lessons = (lessonsData ?? []) as Lesson[];
  const status = new Map((progress ?? []).map((p) => [p.lesson_id, p.status]));
  const done = lessons.filter((l) => status.get(l.id) === "completed").length;
  const pctDone = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  const next = lessons.find((l) => status.get(l.id) !== "completed");
  const groups = [...(topics ?? []).map((t) => ({ id: t.id as string | null, title: t.title })), { id: null, title: lessons.some((l) => !l.topic_id) && (topics ?? []).length ? "More lessons" : "Lessons" }]
    .map((g) => ({ ...g, lessons: lessons.filter((l) => l.topic_id === g.id) })).filter((g) => g.lessons.length);
  const one = <T,>(x: unknown) => x as T | null;

  return (
    <>
      <PageHeader title={course.title}
        intro={[one<{ name: string }>(course.subjects)?.name, one<{ name: string }>(course.classes)?.name, one<{ full_name: string }>(course.profiles)?.full_name && `by ${one<{ full_name: string }>(course.profiles)!.full_name}`].filter(Boolean).join(", ")}
        actions={next ? <ButtonLink href={`/student/lessons/${next.id}`} variant="accent">{done ? "Continue" : "Start course"}</ButtonLink> : null} />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel>
          {groups.map((g) => (
            <section key={g.id ?? "none"} className="mb-6 last:mb-0">
              <h2 className="font-sans text-base font-semibold tracking-normal text-muted">{g.title}</h2>
              <ol className="mt-2 divide-y divide-line">
                {g.lessons.map((l) => {
                  const s = status.get(l.id);
                  return (
                    <li key={l.id}>
                      <Link href={`/student/lessons/${l.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                        {s === "completed" ? <CheckCircle2 className="size-5 shrink-0 text-leaf-500" aria-label="Completed" />
                          : s ? <CircleDot className="size-5 shrink-0 text-sun-600" aria-label="In progress" /> : <Circle className="size-5 shrink-0 text-faint" aria-label="Not started" />}
                        <span className="min-w-0 flex-1"><span className="block font-semibold">{l.title}</span>{l.summary && <span className="block truncate text-sm text-muted">{l.summary}</span>}</span>
                        <span className="text-sm text-muted">{l.duration_minutes ? `${l.duration_minutes} min` : ""}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </Panel>
        <div className="grid content-start gap-6">
          <Panel title="Your progress">
            <p className="mb-2 text-sm text-muted">{done} of {lessons.length} lessons complete</p>
            <ProgressBar value={pctDone} tone={pctDone === 100 ? "leaf" : "adire"} />
            {cert && (
              <div className="mt-5 flex gap-3 rounded-xl bg-sun-100 p-4">
                <Award className="size-6 shrink-0 text-sun-600" aria-hidden="true" />
                <div className="text-sm"><p className="font-semibold">Certificate earned</p><p>Number {cert.certificate_no}. <Link href={`/student/achievements`} className="font-semibold text-adire-700">View certificates</Link></p></div>
              </div>
            )}
          </Panel>
          {(course.summary || course.description) && <Panel title="About this course"><p className="whitespace-pre-line text-ink-soft">{course.description ?? course.summary}</p></Panel>}
          {(materials ?? []).length > 0 && (
            <Panel title="Course materials">
              <ul className="grid gap-2 text-sm">
                {(materials ?? []).map((m) => (
                  <li key={m.id}><a href={m.storage_path ? `/api/files/materials?path=${encodeURIComponent(m.storage_path)}` : m.external_url ?? "#"} target="_blank" className="flex items-center gap-2 font-medium hover:underline"><FileText className="size-4 text-adire-700" aria-hidden="true" />{m.title}</a></li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
