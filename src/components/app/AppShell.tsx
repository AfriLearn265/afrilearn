import type { ReactNode } from "react";
import { MobileNav, Sidebar } from "@/components/app/Sidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { navByRole } from "@/config/nav";
import { roleLabel } from "@/config/brand";
import type { Session } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";

export function AppShell({ session, children }: { session: Session; children: ReactNode }) {
  const { profile } = session;
  const profileHref = profile.role === "student" ? "/student/profile" : profile.role === "teacher" ? "/teacher/profile" : null;
  const shell = { items: navByRole[profile.role], name: profile.full_name, roleLabel: roleLabel[profile.role], avatarUrl: profile.avatar_url, profileHref, signOut };
  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar {...shell} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b-2 border-line bg-paper/90 px-4 backdrop-blur-md md:px-8">
          <MobileNav {...shell} />
          <div className="ml-auto"><NotificationBell /></div>
        </div>
        <main id="main" className="w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, intro, actions }: { title: ReactNode; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div className="min-w-0">
        <h1 className="text-[2rem] font-semibold leading-tight sm:text-4xl md:text-[2.6rem]">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-[1.6rem] border-2 border-line bg-white p-4 sm:p-5 md:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[1.4rem] border-2 border-dashed border-grape-200 bg-grape-50/60 px-5 py-8 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border-2 border-line bg-white p-4 sm:p-5">
      <p className="text-[0.8rem] leading-snug text-muted sm:text-sm">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular sm:text-4xl">{value}</p>
      {note && <p className="mt-1 text-[0.8rem] text-muted sm:text-sm">{note}</p>}
    </div>
  );
}
