import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function ProsePage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-page max-w-3xl py-14 md:py-20">
        <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
        {updated && <p className="mt-3 text-sm text-muted">Last updated {updated}</p>}
        <div className="mt-10 grid gap-5 text-[1.05rem] leading-relaxed text-ink-soft [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_ul]:grid [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:list-disc [&_a]:font-semibold [&_a]:text-adire-700">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
