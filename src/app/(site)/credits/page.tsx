import type { Metadata } from "next";
import { photos } from "@/config/photos";

export const metadata: Metadata = { title: "Photo credits" };

export default function CreditsPage() {
  const list = Object.values(photos);
  return (
    <section className="container-page max-w-3xl py-14 md:py-20">
      <h1 className="text-4xl font-bold md:text-5xl">Photo credits</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted">
        The photographs on our public pages come from Unsplash and are used under the{" "}
        <a href="https://unsplash.com/license" className="font-semibold text-adire-700 underline-offset-4 hover:underline">Unsplash License</a>.
        Thank you to the photographers.
      </p>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {list.map((p) => (
          <li key={p.src} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
            <span className="text-ink-soft">{p.alt}</span>
            <a href={p.href} className="shrink-0 text-sm font-semibold text-adire-700 underline-offset-4 hover:underline">Photo by {p.credit}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
