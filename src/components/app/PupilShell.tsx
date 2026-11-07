import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/app/Avatar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { PupilTabs } from "@/components/app/PupilTabs";
import type { Session } from "@/lib/auth";

/**
 * The pupil app: no sidebar, a slim top bar and big tabs along the bottom, like a phone app.
 * Built for small hands and small screens first; on a laptop it stays centred and roomy.
 */
export function PupilShell({ session, className, children }: { session: Session; className?: string | null; children: ReactNode }) {
  const { profile } = session;
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 border-b-2 border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Logo href="/student" />
          {className && <span className="hidden rounded-full bg-grape-100 px-3 py-1 font-display text-sm font-semibold text-grape-800 sm:inline">{className}</span>}
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <Link href="/student/profile" aria-label="My profile" className="rounded-full ring-2 ring-transparent transition hover:ring-grape-300">
              <Avatar name={profile.full_name} url={profile.avatar_url} className="size-10 text-sm" />
            </Link>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-32 pt-5 sm:pt-7">{children}</main>
      <PupilTabs />
    </div>
  );
}
