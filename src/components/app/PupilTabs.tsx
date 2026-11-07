"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { House, LayoutGrid, MonitorPlay, Puzzle, Sparkles } from "lucide-react";

const tabs = [
  { href: "/student", label: "Home", icon: House, match: (p: string) => p === "/student" || p.startsWith("/student/subject") || p.startsWith("/student/t/") },
  { href: "/student/videos", label: "Videos", icon: MonitorPlay, match: (p: string) => p.startsWith("/student/videos") },
  { href: "/student/cbt", label: "Quizzes", icon: Puzzle, match: (p: string) => p.startsWith("/student/cbt") || p.startsWith("/student/exams") },
  { href: "/student/companion", label: "Ask Tiko", icon: Sparkles, match: (p: string) => p.startsWith("/student/companion") },
  { href: "/student/more", label: "More", icon: LayoutGrid, match: () => false },
];

/** The pupil's bottom menu. "More" lights up for any page that isn't one of the first four. */
export function PupilTabs() {
  const path = usePathname();
  const known = tabs.slice(0, 4).some((t) => t.match(path));
  return (
    <nav aria-label="Main menu" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <ul className="mx-auto grid max-w-xl grid-cols-5 px-2 py-2">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = href === "/student/more" ? !known : match(path);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined}
                className="group flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 font-display text-[0.78rem] font-semibold">
                <span className={clsx("grid h-9 w-14 place-items-center rounded-full transition-colors",
                  active ? "bg-grape-600 text-white shadow-[0_3px_0_var(--color-grape-900)]" : "text-ink-soft group-hover:bg-wash")}>
                  <Icon className="size-[1.3rem]" aria-hidden="true" />
                </span>
                <span className={active ? "text-grape-700" : "text-ink-soft"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
