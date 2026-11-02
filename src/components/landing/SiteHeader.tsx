"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";

const nav = [
  { href: "/#classes", label: "Classes" },
  { href: "/#exams", label: "Exam prep" },
  { href: "/#teachers", label: "Teachers" },
  { href: "/#parents", label: "Parents" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="whitespace-nowrap rounded-lg px-2.5 py-2 text-[0.95rem] font-medium text-ink-soft hover:bg-wash hover:text-ink xl:px-3">{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <ButtonLink href="/login?as=student" variant="ghost" size="sm">Student login</ButtonLink>
          <ButtonLink href="/login?as=teacher" variant="ghost" size="sm">Teacher login</ButtonLink>
          <ButtonLink href="/signup" size="sm">Get started</ButtonLink>
        </div>
        <button type="button" className="grid size-10 place-items-center rounded-lg text-ink hover:bg-wash md:hidden"
          aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>
      {open && (
        <div id="mobile-nav" className="border-t border-line bg-paper md:hidden">
          <nav aria-label="Mobile" className="container-page py-4">
            <ul className="grid gap-1">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 font-medium text-ink-soft hover:bg-wash">{n.label}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ButtonLink href="/login?as=student" variant="outline">Student login</ButtonLink>
              <ButtonLink href="/login?as=teacher" variant="outline">Teacher login</ButtonLink>
              <ButtonLink href="/signup" className="col-span-2">Get started</ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
