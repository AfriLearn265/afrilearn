import type { Metadata } from "next";
import { photos } from "@/config/photos";

export const metadata: Metadata = { title: "Credits" };

const credits = [
  ["Illustrations", "Tiko the tortoise and every drawing on this site are original artwork made for AfriLearn."],
  ["Photographs", `From Unsplash, under the Unsplash License, by ${[...new Set(Object.values(photos).map((p) => p.by))].join(", ")}.`],
  ["Typefaces", "Fredoka and Nunito, both released under the SIL Open Font License and served from this site."],
  ["Icons", "Lucide icons, released under the ISC License."],
  ["Curriculum", "Topic lists follow the Nigerian national curriculum for English Studies and Mathematics, Primary 1 to 6."],
  ["Sample videos", "A few early sample videos come from YouTube, stay the property of their creators and play through YouTube's own player. New lessons are hosted privately."],
  ["Free textbooks", "Open textbooks in the library come from OpenStax and are shared under their Creative Commons licences."],
];

export default function CreditsPage() {
  return (
    <section className="container-page max-w-3xl py-14 md:py-20">
      <h1 className="text-4xl font-semibold md:text-5xl">Credits</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted">The people and projects whose work helps make this site.</p>
      <dl className="mt-10 divide-y-2 divide-line border-y-2 border-line">
        {credits.map(([title, text]) => (
          <div key={title} className="grid gap-1 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
            <dt className="font-display text-lg font-semibold">{title}</dt>
            <dd className="leading-relaxed text-ink-soft">{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
