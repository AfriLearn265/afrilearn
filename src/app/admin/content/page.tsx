import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { deleteTestimonial, saveTestimonial, setBankShared, setCourseFlags, setMaterialApproved } from "../manage-actions";

export const metadata = { title: "Content" };

const Toggle = ({ action, id, field, on, labels }: { action: (fd: FormData) => Promise<void>; id: string; field: string; on: boolean; labels: [string, string] }) => (
  <form action={action}><input type="hidden" name="id" value={id} /><input type="hidden" name={field} value={on ? "0" : "1"} />
    <button type="submit" className={`rounded-full px-2.5 py-1 text-xs font-bold ${on ? "bg-leaf-100 text-leaf-700" : "bg-wash text-muted"}`}>{on ? labels[0] : labels[1]}</button></form>
);

export default async function Content() {
  await requireRole("admin");
  const supabase = await createClient();
  const [{ data: courses }, { data: materials }, { data: banks }, { data: testimonials }] = await Promise.all([
    supabase.from("courses").select("id, title, is_published, is_featured, created_at, profiles(full_name), classrooms(name), lessons(count)").order("created_at", { ascending: false }).limit(50),
    supabase.from("learning_materials").select("id, title, storage_path, library_category, is_approved, created_at, profiles(full_name)").is("course_id", null).is("classroom_id", null).order("created_at", { ascending: false }).limit(50),
    supabase.from("question_banks").select("id, name, is_shared, exam_body, source_license, profiles(full_name), questions(count)").order("created_at", { ascending: false }),
    supabase.from("testimonials").select("id, author_name, author_role, quote, is_published").order("created_at", { ascending: false }),
  ]);
  const name = (x: unknown) => (x as { full_name: string } | null)?.full_name ?? "Unknown";

  return (
    <>
      <PageHeader title="Content and moderation" intro="Publish or pull courses, approve library uploads, choose which question banks feed the practice quizzes, and manage testimonials." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Courses">
          {(courses ?? []).length === 0 ? <EmptyState title="No courses yet." /> : (
            <ul className="divide-y divide-line text-sm">
              {(courses ?? []).map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <span className="min-w-0 flex-1"><span className="block font-semibold">{c.title}</span><span className="text-muted">{name(c.profiles)}, {(c.lessons as { count: number }[])?.[0]?.count ?? 0} lessons{c.classrooms ? ", classroom only" : ""}</span></span>
                  <Toggle action={setCourseFlags} id={c.id} field="is_published" on={c.is_published} labels={["Published", "Draft"]} />
                  <Toggle action={setCourseFlags} id={c.id} field="is_featured" on={c.is_featured} labels={["Featured", "Not featured"]} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Question banks">
          {(banks ?? []).length === 0 ? <EmptyState title="No question banks yet." /> : (
            <ul className="divide-y divide-line text-sm">
              {(banks ?? []).map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <span className="min-w-0 flex-1"><span className="block font-semibold">{b.name}</span><span className="text-muted">{name(b.profiles)}, {(b.questions as { count: number }[])?.[0]?.count ?? 0} questions{b.exam_body ? `, ${b.exam_body}` : ""}, source: {b.source_license}</span></span>
                  <Toggle action={setBankShared} id={b.id} field="on" on={b.is_shared} labels={["In practice quizzes", "Private"]} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Library uploads">
          {(materials ?? []).length === 0 ? <EmptyState title="Nothing uploaded to the library yet." /> : (
            <ul className="divide-y divide-line text-sm">
              {(materials ?? []).map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <span className="min-w-0 flex-1"><a className="block font-semibold hover:underline" target="_blank" href={`/api/files/materials?path=${encodeURIComponent(m.storage_path ?? "")}`}>{m.title}</a><span className="text-muted">{name(m.profiles)}, {formatDate(m.created_at)}</span></span>
                  <Toggle action={setMaterialApproved} id={m.id} field="on" on={m.is_approved} labels={["Visible", "Hidden"]} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Testimonials">
          <p className="mb-4 text-sm text-muted">Only publish real quotes you have permission to use. The landing page shows a pilot invitation until at least one is published.</p>
          {(testimonials ?? []).length > 0 && (
            <ul className="mb-5 grid gap-3 text-sm">
              {(testimonials ?? []).map((t) => (
                <li key={t.id} className="rounded-xl border border-line p-3">
                  <p>&ldquo;{t.quote}&rdquo;</p><p className="mt-1 text-muted">{t.author_name}, {t.author_role}{t.is_published ? "" : " (not published)"}</p>
                  <form action={deleteTestimonial}><input type="hidden" name="id" value={t.id} /><button type="submit" className="mt-1 text-xs font-semibold text-coral-700 hover:underline">Delete</button></form>
                </li>
              ))}
            </ul>
          )}
          <ActionForm action={saveTestimonial} submitLabel="Add testimonial">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="tn"><Input id="tn" name="author_name" /></Field>
              <Field label="Role" htmlFor="tr"><Input id="tr" name="author_role" placeholder="Parent, Abuja" /></Field>
            </div>
            <Field label="Their words" htmlFor="tq"><Textarea id="tq" name="quote" rows={3} /></Field>
            <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name="is_published" className="size-4 accent-adire-700" />Publish on the landing page</label>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
