"use client";

import { updatePassword } from "../actions";
import { useServerForm } from "@/components/ui/useServerForm";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice } from "@/components/ui/Field";

export default function ResetPassword() {
  const { state, pending, onSubmit, fieldError } = useServerForm(updatePassword);
  return (
    <div>
      <h1 className="text-4xl font-bold">Choose a new password</h1>
      <p className="mt-2 text-muted">Use at least 8 characters with letters and numbers.</p>
      <form onSubmit={onSubmit} className="mt-8 grid gap-5" noValidate>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        <Field label="New password" htmlFor="password" error={fieldError("password")}>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </Field>
        <Field label="Type it again" htmlFor="confirm" error={fieldError("confirm")}>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
        </Field>
        <Button type="submit" size="lg" loading={pending}>Save new password</Button>
      </form>
    </div>
  );
}
