import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { gradeSubmission } from "../actions";
import { AttachFile } from "./AttachFile";

export const metadata = { title: "Assignment" };

type Sub = { id: string; student_id: string; status: string; file_paths: string[]; text_answer: string | null; submitted_at: string; is_late: boolean; score: number | null; feedback: string | null };
type Member = { student_id: string; students: { profiles: { full_name: string } | null } | null };

export default async function TeacherAssignment({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireRole("teacher");
  const { id } = await params;
  const supabase = await createClient();
  const { data: a } = await supabase.from("assignments").select("id, title, description, instructions, due_at, total_marks, allow_late, accepted_file_types, attachment_paths, classroom_id, classrooms(name)").eq("id", id).maybeSingle();
  if (!a) notFound();
  const [{ data: subs }, { data: members }] = await Promise.all([
    supabase.from("assignment_submissions").select("id, student_id, status, file_paths, text_answer, submitted_at, is_late, score, feedback").eq("assignment_id", id).order("submitted_at"),
    supabase.from("enrollments").select("student_id, students(profiles(full_name))").eq("classroom_id", a.classroom_id).eq("status", "active"),
  ]);
  const names = new Map(((members ?? []) as unknown as Member[]).map((m) => [m.student_id, m.students?.profiles?.full_name ?? "Student"]));
  const list = (subs ?? []) as Sub[];
  const handed = new Set(list.map((s) => s.student_id));
  const missing = [...names.entries()].filter(([sid]) => !handed.has(sid));

  return (
    <>
      <PageHeader title={a.title} intro={`${(a.classrooms as unknown as { name: string } | null)?.name}. Due ${formatDateTime(a.due_at)}. ${Number(a.total_marks)} marks. ${list.length} of ${names.size} handed in.`} />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Submissions">
          {list.length === 0 ? <EmptyState title="Nothing handed in yet." /> : (
            <ul className="grid gap-4">
              {list.map((s) => (
                <li key={s.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{names.get(s.student_id) ?? "Student"}</p>
                    <p className="text-sm">
                      <span className="text-muted">{formatDateTime(s.submitted_at)}</span>{" "}
                      <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${s.is_late ? "bg-sun-100" : "bg-leaf-100 text-leaf-700"}`}>{s.is_late ? "Late" : "On time"}</span>
                    </p>
                  </div>
                  {s.file_paths.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                      {s.file_paths.map((p) => <li key={p}><a href={`/api/files/submissions?path=${encodeURIComponent(p)}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 hover:bg-wash"><FileText className="size-4 text-adire-700" aria-hidden="true" />{p.split("/").pop()?.replace(/^\d+-/, "")}</a></li>)}
                    </ul>
                  )}
                  {s.text_answer && <p className="mt-2 whitespace-pre-line rounded-lg bg-paper p-3 text-sm">{s.text_answer}</p>}
                  <ActionForm action={gradeSubmission} submitLabel={s.status === "graded" ? "Update grade" : "Save grade"} resetOnSuccess={false} className="mt-3">
                    <input type="hidden" name="submission_id" value={s.id} /><input type="hidden" name="assignment_id" value={a.id} />
                    <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
                      <Field label={`Score / ${Number(a.total_marks)}`} htmlFor={`sc-${s.id}`}><Input id={`sc-${s.id}`} name="score" type="number" min={0} max={Number(a.total_marks)} step={0.5} defaultValue={s.score ?? undefined} /></Field>
                      <Field label="Feedback" htmlFor={`fb-${s.id}`}><Textarea id={`fb-${s.id}`} name="feedback" rows={1} defaultValue={s.feedback ?? ""} className="min-h-11" /></Field>
                    </div>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="grid content-start gap-6">
          <Panel title="Not handed in">
            {missing.length === 0 ? <p className="text-sm text-muted">Everyone has handed in.</p> : <ul className="grid gap-1 text-sm">{missing.map(([sid, n]) => <li key={sid}>{n}</li>)}</ul>}
          </Panel>
          <Panel title="Details">
            {a.description && <p className="whitespace-pre-line text-sm">{a.description}</p>}
            {a.instructions && <p className="mt-2 whitespace-pre-line text-sm text-muted">{a.instructions}</p>}
            <p className="mt-3 text-sm text-muted">Accepts {(a.accepted_file_types as string[]).join(", ")}. {a.allow_late ? "Late work accepted and flagged." : "Closed after the deadline."}</p>
            {(a.attachment_paths as string[]).length > 0 && (
              <ul className="mt-3 grid gap-1 text-sm">{(a.attachment_paths as string[]).map((p) => <li key={p}><a className="font-medium hover:underline" target="_blank" href={`/api/files/materials?path=${encodeURIComponent(p)}`}>{p.split("/").pop()?.replace(/^\d+-/, "")}</a></li>)}</ul>
            )}
            <div className="mt-4"><AttachFile userId={userId} assignmentId={a.id} /></div>
          </Panel>
        </div>
      </div>
    </>
  );
}
