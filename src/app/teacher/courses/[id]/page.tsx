import { notFound } from "next/navigation";
import { FileText, PlayCircle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { MaterialUploader } from "@/components/app/MaterialUploader";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { addTopic, deleteLesson, saveLesson, updateCourse } from "../actions";

export const metadata = { title: "Course builder" };

type Lesson = { id: string; title: string; summary: string | null; content: string | null; video_url: string | null; duration_minutes: number | null; topic_id: string | null; sort_order: number };

function LessonFields({ courseId, topics, lesson }: { courseId: string; topics: { id: string; title: string }[]; lesson?: Lesson }) {
  const p = lesson?.id ?? "new";
  return (
    <>
      <input type="hidden" name="course_id" value={courseId} />
      {lesson && <input type="hidden" name="lesson_id" value={lesson.id} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem_7rem]">
        <Field label="Lesson title" htmlFor={`t-${p}`}><Input id={`t-${p}`} name="title" defaultValue={lesson?.title} /></Field>
        <Field label="Topic" htmlFor={`tp-${p}`}>
          <Select id={`tp-${p}`} name="topic_id" defaultValue={lesson?.topic_id ?? ""}>{[<option key="" value="">No topic</option>, ...topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)]}</Select>
        </Field>
        <Field label="Minutes" htmlFor={`d-${p}`}><Input id={`d-${p}`} name="duration_minutes" type="number" min={1} defaultValue={lesson?.duration_minutes ?? undefined} /></Field>
      </div>
      <Field label="Summary" htmlFor={`s-${p}`}><Input id={`s-${p}`} name="summary" defaultValue={lesson?.summary ?? ""} placeholder="One sentence students see in the lesson list" /></Field>
      <Field label="Video link" htmlFor={`v-${p}`} hint="YouTube or Vimeo"><Input id={`v-${p}`} name="video_url" type="url" defaultValue={lesson?.video_url ?? ""} placeholder="https://www.youtube.com/watch?v=…" /></Field>
      <Field label="Lesson notes" htmlFor={`c-${p}`} hint="Markdown: # heading, **bold**, - list">
        <Textarea id={`c-${p}`} name="content" rows={lesson ? 8 : 6} defaultValue={lesson?.content ?? ""} />
      </Field>
    </>
  );
}

export default async function CourseBuilder({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireRole("teacher");
  const { id } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses")
    .select("id, title, summary, description, estimated_hours, is_published, subject_id, class_id, classroom_id, subjects(name), classes(name), classrooms(name)")
    .eq("id", id).maybeSingle();
  if (!course) notFound();
  const [{ data: topicsData }, { data: lessonsData }, { data: materials }] = await Promise.all([
    supabase.from("topics").select("id, title, sort_order").eq("course_id", id).order("sort_order"),
    supabase.from("lessons").select("id, title, summary, content, video_url, duration_minutes, topic_id, sort_order").eq("course_id", id).order("sort_order"),
    supabase.from("learning_materials").select("id, title, material_type, storage_path, file_size_bytes").eq("course_id", id).order("created_at"),
  ]);
  const topics = topicsData ?? [];
  const lessons = (lessonsData ?? []) as Lesson[];
  const groups = [...topics.map((t) => ({ id: t.id, title: t.title })), { id: null as string | null, title: "Without a topic" }]
    .map((g) => ({ ...g, lessons: lessons.filter((l) => l.topic_id === g.id) })).filter((g) => g.id !== null || g.lessons.length);
  const meta = [course.subjects, course.classes].map((x) => (x as unknown as { name: string } | null)?.name).filter(Boolean).join(", ");
  const room = (course.classrooms as unknown as { name: string } | null)?.name;

  return (
    <>
      <PageHeader title={course.title} intro={`${meta || "General"}. ${room ? `Visible to ${room} only.` : "Public catalogue course."} ${course.is_published ? "Published." : "Draft: students can't see it yet."}`}
        actions={
          <ActionForm action={updateCourse} submitLabel={course.is_published ? "Move to draft" : "Publish course"} variant={course.is_published ? "outline" : "accent"} resetOnSuccess={false}>
            <input type="hidden" name="course_id" value={course.id} /><input type="hidden" name="publish" value={course.is_published ? "0" : "1"} />
          </ActionForm>
        } />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title={`Lessons (${lessons.length})`}>
            {lessons.length === 0 ? <EmptyState title="No lessons yet.">Add your first lesson below. A lesson can have a video, notes and attached materials.</EmptyState> : (
              <div className="grid gap-5">
                {groups.map((g) => (
                  <div key={g.id ?? "none"}>
                    <h3 className="font-sans text-sm font-semibold tracking-normal text-muted">{g.title}</h3>
                    <ul className="mt-2 grid gap-2">
                      {g.lessons.map((l) => (
                        <li key={l.id}>
                          <details className="group rounded-xl border border-line">
                            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                              {l.video_url ? <PlayCircle className="size-4 text-adire-700" aria-hidden="true" /> : <FileText className="size-4 text-adire-700" aria-hidden="true" />}
                              <span className="flex-1 font-semibold">{l.title}</span>
                              <span className="text-sm text-muted">{l.duration_minutes ? `${l.duration_minutes} min` : ""} <span className="text-adire-700 group-open:hidden">Edit</span></span>
                            </summary>
                            <div className="border-t border-line p-4">
                              <ActionForm action={saveLesson} submitLabel="Save lesson" resetOnSuccess={false}>
                                <LessonFields courseId={course.id} topics={topics} lesson={l} />
                              </ActionForm>
                              <form action={deleteLesson} className="mt-3">
                                <input type="hidden" name="course_id" value={course.id} /><input type="hidden" name="lesson_id" value={l.id} />
                                <button type="submit" className="text-sm font-semibold text-coral-700 hover:underline">Delete this lesson</button>
                              </form>
                            </div>
                          </details>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Add a lesson">
            <ActionForm action={saveLesson} submitLabel="Add lesson" pendingLabel="Adding"><LessonFields courseId={course.id} topics={topics} /></ActionForm>
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <Panel title="Topics">
            {topics.length > 0 && <ol className="mb-4 grid list-decimal gap-1 pl-5 text-sm">{topics.map((t) => <li key={t.id}>{t.title}</li>)}</ol>}
            <ActionForm action={addTopic} submitLabel="Add topic" variant="outline">
              <input type="hidden" name="course_id" value={course.id} />
              <Field label="Topic name" htmlFor="topic-title"><Input id="topic-title" name="title" placeholder="e.g. Adding fractions" /></Field>
            </ActionForm>
          </Panel>
          <Panel title="Course materials">
            {(materials ?? []).length > 0 && (
              <ul className="mb-4 divide-y divide-line text-sm">
                {(materials ?? []).map((m) => (
                  <li key={m.id} className="flex items-center gap-2 py-2">
                    <FileText className="size-4 text-adire-700" aria-hidden="true" />
                    <a href={`/api/files/materials?path=${encodeURIComponent(m.storage_path ?? "")}`} target="_blank" className="flex-1 truncate font-medium hover:underline">{m.title}</a>
                    <span className="text-muted">{m.material_type}</span>
                  </li>
                ))}
              </ul>
            )}
            <MaterialUploader userId={userId} scope={`courses/${course.id}`} courseId={course.id} subjectId={course.subject_id} classId={course.class_id} />
          </Panel>
          <Panel title="Details">
            <ActionForm action={updateCourse} submitLabel="Save details" resetOnSuccess={false} variant="outline">
              <input type="hidden" name="course_id" value={course.id} />
              <Field label="Title" htmlFor="ctitle"><Input id="ctitle" name="title" defaultValue={course.title} /></Field>
              <Field label="Summary" htmlFor="csum"><Textarea id="csum" name="summary" rows={2} defaultValue={course.summary ?? ""} /></Field>
              <Field label="Description" htmlFor="cdesc"><Textarea id="cdesc" name="description" rows={4} defaultValue={course.description ?? ""} /></Field>
              <Field label="Estimated hours" htmlFor="chours"><Input id="chours" name="estimated_hours" type="number" step="0.5" min={0} defaultValue={course.estimated_hours ?? undefined} /></Field>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
