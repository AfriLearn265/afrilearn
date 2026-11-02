import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { PageHeader, Panel } from "@/components/app/AppShell";
import { Notice } from "@/components/ui/Field";
import { SubmitWork } from "./SubmitWork";

export const metadata = { title: "Assignment" };

const clock = () => Date.now();

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireRole("student");
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: a }, { data: sub }] = await Promise.all([
    supabase.from("assignments").select("id, title, description, instructions, total_marks, due_at, allow_late, accepted_file_types, max_file_mb, attachment_paths, classrooms(name), profiles(full_name)").eq("id", id).maybeSingle(),
    supabase.from("assignment_submissions").select("status, file_paths, text_answer, submitted_at, is_late, score, feedback, graded_at").eq("assignment_id", id).eq("student_id", userId).maybeSingle(),
  ]);
  if (!a) notFound();
  const overdue = new Date(a.due_at).getTime() < clock();
  const closed = overdue && !a.allow_late;
  const room = a.classrooms as unknown as { name: string } | null;
  const teacher = a.profiles as unknown as { full_name: string } | null;

  return (
    <>
      <PageHeader title={a.title} intro={`${room?.name ?? ""}${teacher ? `, set by ${teacher.full_name}` : ""}. Due ${formatDateTime(a.due_at)}. ${Number(a.total_marks)} marks.`} />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title="Instructions">
            {a.description && <p className="whitespace-pre-line">{a.description}</p>}
            {a.instructions && <p className="mt-3 whitespace-pre-line text-ink-soft">{a.instructions}</p>}
            {(a.attachment_paths as string[]).length > 0 && (
              <ul className="mt-4 grid gap-2 text-sm">
                {(a.attachment_paths as string[]).map((p) => (
                  <li key={p}><a href={`/api/files/materials?path=${encodeURIComponent(p)}`} target="_blank" className="flex items-center gap-2 font-medium hover:underline"><FileText className="size-4 text-adire-700" aria-hidden="true" />{p.split("/").pop()?.replace(/^\d+-/, "")}</a></li>
                ))}
              </ul>
            )}
          </Panel>
          {sub?.status === "graded" && (
            <Panel title="Your mark">
              <p className="font-display text-4xl font-bold tabular">{Number(sub.score)}<span className="text-xl text-muted"> / {Number(a.total_marks)}</span></p>
              {sub.feedback && <p className="mt-3 whitespace-pre-line rounded-xl bg-sun-100 p-4">{sub.feedback}</p>}
              {sub.graded_at && <p className="mt-2 text-sm text-muted">Marked {formatDateTime(sub.graded_at)}</p>}
            </Panel>
          )}
        </div>
        <Panel title={sub ? "Your submission" : "Hand in your work"}>
          {sub && (
            <p className="mb-4 text-sm text-muted">Handed in {formatDateTime(sub.submitted_at)}{sub.is_late ? ", after the deadline" : ", on time"}.</p>
          )}
          {sub?.status === "graded" ? (
            <ul className="grid gap-2 text-sm">
              {(sub.file_paths as string[]).map((p) => <li key={p}><a className="font-medium hover:underline" href={`/api/files/submissions?path=${encodeURIComponent(p)}`} target="_blank">{p.split("/").pop()?.replace(/^\d+-/, "")}</a></li>)}
              {sub.text_answer && <li className="whitespace-pre-line rounded-xl bg-paper p-3">{sub.text_answer}</li>}
            </ul>
          ) : closed ? (
            <Notice tone="error">This assignment closed on {formatDateTime(a.due_at)} and doesn&apos;t accept late work.</Notice>
          ) : (
            <>
              {overdue && <div className="mb-4"><Notice tone="warning">The deadline has passed. You can still hand in, but it will be marked late.</Notice></div>}
              <SubmitWork userId={userId} assignmentId={a.id} accepted={a.accepted_file_types as string[]} maxMb={a.max_file_mb}
                existing={(sub?.file_paths as string[] | undefined) ?? []} existingText={sub?.text_answer ?? null} resubmit={!!sub} />
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
