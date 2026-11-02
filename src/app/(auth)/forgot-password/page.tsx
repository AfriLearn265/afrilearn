"use client";

import Link from "next/link";
import { requestPasswordReset } from "../actions";
import { useServerForm } from "@/components/ui/useServerForm";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice } from "@/components/ui/Field";

export default function ForgotPassword() {
  const { state, pending, onSubmit, fieldError } = useServerForm(requestPasswordReset);
  return (
    <div>
      <h1 className="text-4xl font-bold">Reset your password</h1>
      <p className="mt-2 text-muted">Enter the email you signed up with and we will send you a reset link.</p>
      <form onSubmit={onSubmit} className="mt-8 grid gap-5" noValidate>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.message && <Notice tone="success">{state.message}</Notice>}
        <Field label="Email address" htmlFor="email" error={fieldError("email")}>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Button type="submit" size="lg" loading={pending}>Send reset link</Button>
      </form>
      <p className="mt-8 text-sm text-muted"><Link href="/login" className="font-semibold text-adire-700 hover:underline">Back to log in</Link></p>
    </div>
  );
}
