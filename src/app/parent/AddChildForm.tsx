"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addChild } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice, Select } from "@/components/ui/Field";
import { LoginCards, type LoginDetails } from "@/components/app/LoginCard";

/** Create a pupil account for a child who has no email address. The parent is linked automatically. */
export function AddChildForm({ classes, site }: { classes: { code: string; name: string }[]; site: string }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<LoginDetails | null>(null);

  if (made) {
    return (
      <div className="grid gap-4">
        <Notice tone="success" title={`${made.fullName.split(" ")[0]}'s account is ready.`}>They can log in on any phone or computer with the details below.</Notice>
        <LoginCards pupils={[made]} site={site} />
        <Button type="button" variant="outline" className="justify-self-start" onClick={() => setMade(null)}>Add another child</Button>
      </div>
    );
  }

  return (
    <form ref={form} className="grid gap-4" noValidate onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      setError(null);
      start(async () => {
        const r = await addChild(fd);
        if (r.error || !r.pupil) return setError(r.error ?? "Something went wrong.");
        setMade(r.pupil);
        router.refresh();
      });
    }}>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Child's full name" htmlFor="c-name"><Input id="c-name" name="full_name" autoComplete="off" required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Class" htmlFor="c-class">
          <Select id="c-class" name="class_code" defaultValue="" required>
            <option value="" disabled>Choose a class</option>
            {classes.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="You are their" htmlFor="c-rel">
          <Select id="c-rel" name="relationship" defaultValue="parent">
            <option value="mother">Mother</option><option value="father">Father</option><option value="parent">Parent</option>
            <option value="guardian">Guardian</option>
          </Select>
        </Field>
      </div>
      <Field label="Password for your child" htmlFor="c-pass" hint="Optional: leave empty for an easy one like mango-rocket-47">
        <Input id="c-pass" name="password" type="text" autoComplete="new-password" />
      </Field>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-0.5 size-4 accent-grape-600" />
        <span>I am this child&apos;s parent or guardian and I agree to them using this account.</span>
      </label>
      <Button type="submit" loading={pending} className="justify-self-start">{pending ? "Creating the account" : "Create my child's account"}</Button>
    </form>
  );
}
