"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type LoginDetails = { fullName: string; loginId: string; password: string; className: string };

/** A pupil's sign-in details, shown once, styled as a card that prints cleanly for the fridge or the school bag. */
export function LoginCards({ pupils, site }: { pupils: LoginDetails[]; site: string }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm font-semibold text-ink-soft">
          Save or print {pupils.length === 1 ? "this card" : "these cards"} now. For safety, passwords are not shown again.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => {
          document.body.classList.add("print-cards");
          window.addEventListener("afterprint", () => document.body.classList.remove("print-cards"), { once: true });
          window.print();
        }}><Printer className="size-4" aria-hidden="true" />Print</Button>
      </div>
      <ul className="login-cards grid gap-4 sm:grid-cols-2">
        {pupils.map((p) => (
          <li key={p.loginId} className="break-inside-avoid rounded-[1.4rem] border-2 border-ink bg-sun-100 p-5">
            <p className="font-display text-xl font-semibold">{p.fullName}</p>
            <p className="text-sm text-ink-soft">{p.className}</p>
            <dl className="mt-3 grid gap-1.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Website</dt><dd className="font-semibold">{site}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Login ID</dt><dd className="font-display text-lg font-semibold tracking-wide">{p.loginId}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Password</dt><dd className="font-display text-lg font-semibold tracking-wide">{p.password}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
