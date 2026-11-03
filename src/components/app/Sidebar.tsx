"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import {
  Award, BookOpen, CalendarDays, ChartColumn, ClipboardCheck, FileText, Flag, Gauge, GraduationCap, Landmark,
  Library, LogOut, Menu, MessagesSquare, NotebookPen, ScrollText, Settings, ShieldCheck, Sparkles, SquareLibrary,
  Baby, UserRound, Users, Video, Wallet, X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/app/Avatar";
import type { IconName, NavItem } from "@/config/nav";

const icons: Record<IconName, typeof Gauge> = {
  home: Gauge, classes: GraduationCap, book: BookOpen, assignment: NotebookPen, exam: ClipboardCheck,
  results: ChartColumn, library: Library, spark: Sparkles, award: Award, user: UserRound, users: Users,
  bank: SquareLibrary, grade: FileText, video: Video, calendar: CalendarDays, child: Baby, message: MessagesSquare,
  settings: Settings, shield: ShieldCheck, chart: ChartColumn, subjects: Landmark, money: Wallet, flag: Flag, log: ScrollText,
};

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  const activeHref = items.map((i) => i.href).filter((h) => path === h || path.startsWith(h + "/")).sort((a, b) => b.length - a.length)[0];
  return (
    <ul className="grid gap-0.5">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const active = item.href === activeHref;
        return (
          <li key={item.href}>
            <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
              className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition-colors",
                active ? "bg-adire-700 text-white" : "text-ink-soft hover:bg-wash hover:text-ink")}>
              <Icon className="size-[1.15rem] shrink-0" aria-hidden="true" />{item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type ShellProps = { items: NavItem[]; name: string; roleLabel: string; avatarUrl: string | null; profileHref: string | null; signOut: () => Promise<void> };

function Body({ items, name, roleLabel, avatarUrl, profileHref, signOut, onNavigate }: ShellProps & { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5"><Logo href="/dashboard" /></div>
      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 py-2"><NavList items={items} onNavigate={onNavigate} /></nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          {profileHref ? (
            <Link href={profileHref} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:opacity-80">
              <Avatar name={name} url={avatarUrl} />
              <span className="min-w-0"><span className="block truncate font-semibold leading-tight">{name}</span><span className="block text-sm text-muted">{roleLabel}, view profile</span></span>
            </Link>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={name} url={avatarUrl} />
              <span className="min-w-0"><span className="block truncate font-semibold leading-tight">{name}</span><span className="block text-sm text-muted">{roleLabel}</span></span>
            </div>
          )}
          <form action={signOut}>
            <button type="submit" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-wash hover:text-ink" aria-label="Log out">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/** The fixed sidebar on large screens. */
export function Sidebar(props: ShellProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-white lg:block">
      <Body {...props} />
    </aside>
  );
}

/** Menu button and logo for the top bar on phones and tablets, opening the same navigation as a drawer. */
export function MobileNav(props: ShellProps) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", close); };
  }, [open]);
  const current = props.items.filter((i) => path === i.href || path.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <div className="flex min-w-0 items-center gap-3 lg:hidden">
      <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}
        className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink">
        <Menu className="size-5" />
      </button>
      <span className="hidden sm:block"><Logo href="/dashboard" /></span>
      {current && <p className="truncate font-semibold sm:hidden">{current.label}</p>}
      {/* Rendered on <body>: the top bar's blur would otherwise trap a fixed drawer inside the bar. */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-fade-in flex-col bg-white shadow-pop">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-lg hover:bg-wash">
              <X className="size-5" />
            </button>
            <Body {...props} onNavigate={() => setOpen(false)} />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
