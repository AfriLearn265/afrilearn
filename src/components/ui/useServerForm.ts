"use client";

import { useState, useTransition, type FormEvent } from "react";
import { unstable_rethrow } from "next/navigation";

type State = { error?: string; fieldErrors?: Record<string, string>; message?: string };

/**
 * Submits a form to a Server Action without React's automatic form reset,
 * so typed values survive validation errors. If the request itself fails
 * (no connection, or the site was redeployed while this page was open),
 * the form says so instead of failing silently.
 */
export function useServerForm<S extends State>(action: (fd: FormData) => Promise<S | void>) {
  const [state, setState] = useState<S>({} as S);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await action(fd);
        if (result) setState(result);
      } catch (err) {
        unstable_rethrow(err); // let redirects and other Next.js signals through
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        setState({
          error: offline
            ? "You seem to be offline. Check your connection and try again."
            : "This page is out of date because the site was just updated. Refresh the page and try again.",
        } as S);
      }
    });
  }

  const fieldError = (name: string) => state.fieldErrors?.[name];
  return { state, pending, onSubmit, fieldError, setState };
}
