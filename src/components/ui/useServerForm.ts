"use client";

import { useState, useTransition, type FormEvent } from "react";

type State = { error?: string; fieldErrors?: Record<string, string>; message?: string };

/**
 * Submits a form to a Server Action without React's automatic form reset,
 * so typed values survive validation errors.
 */
export function useServerForm<S extends State>(action: (fd: FormData) => Promise<S | void>) {
  const [state, setState] = useState<S>({} as S);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(fd);
      if (result) setState(result);
    });
  }

  const fieldError = (name: string) => state.fieldErrors?.[name];
  return { state, pending, onSubmit, fieldError, setState };
}
