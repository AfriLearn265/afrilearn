"use client";

import { useState, useTransition } from "react";
import { addPupils, type BulkResult } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, Notice, Select, Textarea } from "@/components/ui/Field";
import { LoginCards } from "@/components/app/LoginCard";

type Room = { id: string; name: string; class_code: string | null };

export function BulkPupilsForm({ classes, rooms, site }: { classes: { code: string; name: string }[]; rooms: Room[]; site: string }) {
  const [pending, start] = useTransition();
  const [classCode, setClassCode] = useState(classes[0]?.code ?? "");
  const [result, setResult] = useState<BulkResult | null>(null);
  const roomsHere = rooms.filter((r) => r.class_code === classCode);

  if (result?.made?.length) {
    return (
      <div className="grid gap-5">
        <Notice tone="success" title={`${result.made.length} pupil account${result.made.length === 1 ? "" : "s"} created.`}>
          Print the cards and hand one to each pupil or parent.
        </Notice>
        {!!result.failed?.length && (
          <Notice tone="warning" title={`${result.failed.length} line${result.failed.length === 1 ? "" : "s"} skipped`}>
            <ul className="mt-1 list-disc pl-5">{result.failed.map((f, i) => <li key={i}><strong>{f.line}</strong>: {f.reason}</li>)}</ul>
          </Notice>
        )}
        <LoginCards pupils={result.made} site={site} />
        <Button type="button" variant="outline" className="justify-self-start print:hidden" onClick={() => setResult(null)}>Add more pupils</Button>
      </div>
    );
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(async () => setResult(await addPupils(fd)));
    }}>
      {result?.error && <Notice tone="error">{result.error}</Notice>}
      {!!result?.failed?.length && !result.made?.length && (
        <Notice tone="error" title="No accounts were created.">
          <ul className="mt-1 list-disc pl-5">{result.failed.map((f, i) => <li key={i}><strong>{f.line}</strong>: {f.reason}</li>)}</ul>
        </Notice>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Class" htmlFor="b-class">
          <Select id="b-class" name="class_code" value={classCode} onChange={(e) => setClassCode(e.target.value)}>
            {classes.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Also add them to a classroom" htmlFor="b-room" hint="Optional">
          <Select id="b-room" name="classroom_id" defaultValue="" key={classCode}>
            <option value="">No classroom</option>
            {roomsHere.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Pupils, one per line" htmlFor="b-list" hint="Name, or Name, Parent's name, Parent's email">
        <Textarea id="b-list" name="pupils" rows={9} className="font-mono text-sm" placeholder={"Chiamaka Obi, Grace Obi, grace.obi@example.com\nMusa Ibrahim, Aisha Ibrahim, aisha@example.com\nTunde Ade"} />
      </Field>
      <p className="text-sm text-muted">Tip: copy the name columns straight from Excel or Google Sheets and paste them here. Up to 60 pupils at a time.</p>
      <Button type="submit" size="lg" loading={pending} className="justify-self-start">{pending ? "Creating accounts" : "Create pupil accounts"}</Button>
    </form>
  );
}
