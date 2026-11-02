"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login } from "../actions";
import { useServerForm } from "@/components/ui/useServerForm";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice } from "@/components/ui/Field";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const { state, pending, onSubmit } = useServerForm(login);
  const [show, setShow] = useState(false);
  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-5" noValidate>
      {notice && !state.error && <Notice tone="success">{notice}</Notice>}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email address" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required autoFocus />
      </Field>
      <Field label="Password" htmlFor="password" hint={<Link href="/forgot-password" className="font-semibold text-adire-700 hover:underline">Forgot password?</Link>}>
        <div className="relative">
          <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required className="pr-12" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-ink"
            aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <Button type="submit" size="lg" loading={pending}>{pending ? "Logging in" : "Log in"}</Button>
    </form>
  );
}
