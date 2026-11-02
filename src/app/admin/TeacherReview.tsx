"use client";

import { useState, useTransition } from "react";
import { FileText } from "lucide-react";
import { documentLink, reviewTeacher } from "./actions";
import { Button } from "@/components/ui/Button";
import { Notice, Textarea } from "@/components/ui/Field";

export type Application = {
  id: string; name: string; email: string | null; qualification: string | null; years: number | null;
  institution: string | null; bio: string | null; subjects: string[]; classes: string[]; documents: string[]; applied: string;
};

export function TeacherReview({ app }: { app: Application }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ error?: string; message?: string }>({});
  const [note, setNote] = useState("");

  function decide(decision: "approve" | "decline") {
    const fd = new FormData();
    fd.set("teacher_id", app.id);
    fd.set("decision", decision);
    fd.set("note", note);
    start(async () => setResult(await reviewTeacher(fd)));
  }

  async function open(path: string) {
    const url = await documentLink(path);
    if (url) window.open(url, "_blank", "noopener");
    else setResult({ error: "That document could not be opened." });
  }

  if (result.message) return <Notice tone="success">{app.name}: {result.message}</Notice>;

  return (
    <article className="rounded-xl border border-line p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-sans text-lg font-semibold tracking-normal">{app.name}</h3>
        <p className="text-sm text-muted">Applied {app.applied}</p>
      </div>
      <p className="text-sm text-muted">{app.email}</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">Qualification</dt><dd className="font-medium">{app.qualification ?? "Not given"}</dd></div>
        <div><dt className="text-muted">Experience</dt><dd className="font-medium">{app.years != null ? `${app.years} years` : "Not given"}{app.institution ? `, ${app.institution}` : ""}</dd></div>
        <div className="sm:col-span-2"><dt className="text-muted">Subjects</dt><dd className="font-medium">{app.subjects.join(", ") || "None"}</dd></div>
        <div className="sm:col-span-2"><dt className="text-muted">Classes</dt><dd className="font-medium">{app.classes.join(", ") || "None"}</dd></div>
        {app.bio && <div className="sm:col-span-2"><dt className="text-muted">About</dt><dd>{app.bio}</dd></div>}
      </dl>
      <div className="mt-4">
        <p className="text-sm text-muted">Documents</p>
        {app.documents.length === 0 ? <p className="text-sm">None uploaded yet.</p> : (
          <ul className="mt-1 flex flex-wrap gap-2">
            {app.documents.map((d) => (
              <li key={d}><button type="button" onClick={() => open(d)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-wash">
                <FileText className="size-4 text-adire-700" aria-hidden="true" />{d.split("/").pop()?.replace(/^\d+-/, "")}
              </button></li>
            ))}
          </ul>
        )}
      </div>
      {result.error && <div className="mt-4"><Notice tone="error">{result.error}</Notice></div>}
      <label htmlFor={`note-${app.id}`} className="mt-4 block text-sm font-semibold text-ink-soft">Note to the teacher <span className="font-normal text-muted">(sent if you decline)</span></label>
      <Textarea id={`note-${app.id}`} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5 min-h-16" />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => decide("approve")} loading={pending}>Approve teacher</Button>
        <Button type="button" variant="outline" onClick={() => decide("decline")} disabled={pending}>Decline</Button>
      </div>
    </article>
  );
}
