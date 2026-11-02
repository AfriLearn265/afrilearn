"use client";

import { useRef, type ReactNode } from "react";
import { useServerForm } from "@/components/ui/useServerForm";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Field";

export type ActionResult = { error?: string; message?: string; fieldErrors?: Record<string, string> };

/** Small form wrapper for dashboard actions with inline success/error messages. */
export function ActionForm({ action, submitLabel, pendingLabel, children, resetOnSuccess = true, className = "", variant = "primary" }: {
  action: (fd: FormData) => Promise<ActionResult>;
  submitLabel: string; pendingLabel?: string; children: ReactNode; resetOnSuccess?: boolean; className?: string;
  variant?: "primary" | "accent" | "outline";
}) {
  const ref = useRef<HTMLFormElement>(null);
  const { state, pending, onSubmit } = useServerForm(async (fd: FormData) => {
    const r = await action(fd);
    if (r && !r.error && resetOnSuccess) ref.current?.reset();
    return r;
  });
  return (
    <form ref={ref} onSubmit={onSubmit} className={`grid gap-4 ${className}`} noValidate>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && <Notice tone="success">{state.message}</Notice>}
      {children}
      <Button type="submit" loading={pending} variant={variant} className="justify-self-start">{pending ? pendingLabel ?? submitLabel : submitLabel}</Button>
    </form>
  );
}
