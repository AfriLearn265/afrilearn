import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { createCourse } from "./actions";

export const metadata = { title: "Courses" };

type Course = { id: string; title: string; is_published: boolean; classrooms: { name: string } | null; classes: { name: string } | null; subjects: { name: string; color: string } | null; lessons: { count: number }[] };

export default async function TeacherCourses() {
  const { userId } = await requireRole("teacher");
  const supabase = await createClient();
  const [{ data }, { data: subjects }, { data: classes }, { data: rooms }] = await Promise.all([
    supabase.from("courses").select("id, title, is_published, classrooms(name), classes(name), subjects(name, color), lessons(count)").eq("teacher_id", userId).order("created_at", { ascending: false }),
    supabase.from("subjects").select("id, name").eq("is_active", true).order("name"),
    supabase.from("classes").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("classrooms").select("id, name").eq("teacher_id", userId).eq("is_archived", false),
  ]);
  const courses = (data ?? []) as unknown as Course[];
  return (
    <>
      <PageHeader title="Courses" intro="Organise lessons into topics with videos, notes and downloadable materials. Public courses appear in the catalogue for every student at that level." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Your courses">
          {courses.length === 0 ? <EmptyState title="No courses yet.">Create your first course on the right.</EmptyState> : (
            <ul className="divide-y divide-line">
              {courses.map((c) => (
                <li key={c.id}>
                  <Link href={`/teacher/courses/${c.id}`} className="flex items-center gap-3 py-3.5 hover:opacity-80">
                    <span className="size-3 shrink-0 rounded-full" style={{ background: c.subjects?.color ?? "#4A1FB8" }} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{c.title}</p>
                      <p className="text-sm text-muted">{[c.subjects?.name, c.classes?.name, c.classrooms ? `for ${c.classrooms.name}` : "public catalogue", `${c.lessons?.[0]?.count ?? 0} lessons`].filter(Boolean).join(", ")}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c.is_published ? "bg-leaf-100 text-leaf-700" : "bg-wash text-muted"}`}>{c.is_published ? "Published" : "Draft"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="New course">
          <ActionForm action={createCourse} submitLabel="Create course" pendingLabel="Creating" resetOnSuccess={false}>
            <Field label="Title" htmlFor="title"><Input id="title" name="title" placeholder="Fractions made simple" /></Field>
            <Field label="Summary" htmlFor="summary"><Textarea id="summary" name="summary" rows={2} placeholder="What students will be able to do afterwards." /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subject" htmlFor="subject_id"><Select id="subject_id" name="subject_id" defaultValue="">{[<option key="" value="">Choose</option>, ...(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)]}</Select></Field>
              <Field label="Class" htmlFor="class_id"><Select id="class_id" name="class_id" defaultValue="">{[<option key="" value="">Any</option>, ...(classes ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)]}</Select></Field>
              <Field label="Who can see it" htmlFor="classroom_id">
                <Select id="classroom_id" name="classroom_id" defaultValue="">{[<option key="" value="">Every student (public catalogue)</option>, ...(rooms ?? []).map((r) => <option key={r.id} value={r.id}>Only {r.name}</option>)]}</Select>
              </Field>
              <Field label="Level" htmlFor="difficulty"><Select id="difficulty" name="difficulty" defaultValue="standard"><option value="foundation">Foundation</option><option value="standard">Standard</option><option value="advanced">Advanced</option></Select></Field>
            </div>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
