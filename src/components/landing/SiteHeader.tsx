"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { useBrand } from "@/components/brand/BrandProvider";

const nav = [
  { href: "/classes", label: "Classes" },
  { href: "/courses", label: "Courses" },
  { href: "/parents", label: "Parents" },
  { href: "/teachers", label: "Teachers" },
  { href: "/resources", label: "Free worksheets" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { announcement } = useBrand();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-line bg-white/95 backdrop-blur-md">
      {announcement && (
        <div className="bg-sun-400 text-ink">
          <p className="container-page flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 py-2 text-center text-sm">
            <span>{announcement.text}</span>
            {announcement.link && (
              <Link href={announcement.link} className="font-bold underline underline-offset-4">Find out more</Link>
            )}
          </p>
        </div>
      )}
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined}
                  className={clsx(
                    "relative whitespace-nowrap rounded-full px-3.5 py-2 font-display text-[1.02rem] font-medium hover:bg-wash hover:text-ink",
                    isActive(n.href) ? "bg-grape-50 text-grape-700" : "text-ink-soft",
                  )}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="ghost" size="sm">Log in</ButtonLink>
          <ButtonLink href="/signup" size="sm" variant="accent">Start free</ButtonLink>
        </div>
        <button type="button" className="grid size-10 place-items-center rounded-lg text-ink hover:bg-wash md:hidden"
          aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>
      {/* Tablet widths keep the buttons in the bar but still need the page links. */}
      <nav aria-label="Sections" className="hidden border-t border-line/70 md:block xl:hidden">
        <ul className="container-page flex gap-1 overflow-x-auto py-1.5 scrollbar-none">
          {nav.map((n) => (
            <li key={n.href}>
              <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined}
                className={clsx("block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-wash",
                  isActive(n.href) ? "bg-wash text-grape-700" : "text-ink-soft")}>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {open && (
        <div id="mobile-nav" className="border-t border-line bg-paper md:hidden">
          <nav aria-label="Mobile" className="container-page py-4">
            <ul className="grid gap-1">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} onClick={() => setOpen(false)} aria-current={isActive(n.href) ? "page" : undefined}
                    className={clsx("block rounded-lg px-3 py-2.5 font-medium hover:bg-wash", isActive(n.href) ? "bg-wash text-grape-700" : "text-ink-soft")}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ButtonLink href="/login" variant="outline">Log in</ButtonLink>
              <ButtonLink href="/signup" variant="accent">Start free</ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
