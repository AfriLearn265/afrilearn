import type { ReactNode } from "react";
import { Sidebar } from "@/components/app/Sidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { navByRole } from "@/config/nav";
import { roleLabel } from "@/config/brand";
import type { Session } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";

export function AppShell({ session, children }: { session: Session; children: ReactNode }) {
  const { profile } = session;
  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar items={navByRole[profile.role]} name={profile.full_name} roleLabel={roleLabel[profile.role]} signOut={signOut} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-end gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-md md:px-8">
          <NotificationBell />
        </div>
        <main id="main" className="w-full max-w-6xl flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, intro, actions }: { title: ReactNode; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[1.25rem] border border-line bg-white p-5 md:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-sans text-lg font-semibold tracking-normal">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-adire-200 bg-adire-50/50 px-5 py-8 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular">{value}</p>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
    </div>
  );
}
