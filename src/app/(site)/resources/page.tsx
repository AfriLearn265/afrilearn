import type { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";
import { CtaBand, PageHero } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";
import { getPublicResources, type PublicResource } from "@/lib/catalogue";
import { libraryCategories } from "@/components/app/libraryCategories";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Free worksheets",
  description: "Free worksheets, lesson notes and Common Entrance practice for Primary 1 to Primary 6.",
};

const order = ["practice", "class_notes", "exam_prep", "revision_guide", "textbook", "video_lesson", "teacher_resource"];
const intro: Record<string, string> = {
  exam_prep: "Common Entrance style practice papers for Primary 6, with answers and explanations.",
  class_notes: "Short notes you can print and revise from, with worked examples.",
  practice: "Worksheets for class or home, with answers for parents and teachers.",
  textbook: "Free, openly licensed textbooks for wider reading.",
  teacher_resource: "Planning tools for teachers.",
};

function size(bytes: number | null) {
  if (!bytes) return null;
  return bytes > 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.round(bytes / 1000)} KB`;
}

export default async function ResourcesPage() {
  const items = await getPublicResources();
  const groups = order.map((key) => ({ key, items: items.filter((i) => i.library_category === key) })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHero id="resources" mascot={{ pose: "stand", prop: "book" }} title="Free worksheets to print and share."
        intro="Worksheets, lesson notes and Common Entrance practice for Primary 1 to 6. Print them for class or use them at the kitchen table.">
        <ButtonLink href="#practice" size="lg" variant="accent">Worksheets</ButtonLink>
        <ButtonLink href="/signup" size="lg" variant="onDark">Get the full library free</ButtonLink>
      </PageHero>

      <div className="container-page py-14 sm:py-20">
        {groups.length > 1 && (
          <nav aria-label="Resource types" className="-mx-4 mb-12 overflow-x-auto px-4 scrollbar-none">
            <ul className="flex min-w-max gap-2">
              {groups.map((g) => (
                <li key={g.key}>
                  <Link href={`#${g.key}`} className="inline-flex h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink-soft hover:border-grape-300 hover:text-ink">
                    {libraryCategories[g.key] ?? g.key}<span className="ml-2 text-muted">{g.items.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {groups.length === 0 ? (
          <p className="text-muted">Free resources are being prepared. Check back soon.</p>
        ) : (
          <div className="grid gap-16">
            {groups.map((g) => (
              <section key={g.key} id={g.key} aria-labelledby={`${g.key}-h`} className="scroll-mt-24">
                <h2 id={`${g.key}-h`} className="text-3xl font-semibold md:text-4xl">{libraryCategories[g.key] ?? g.key}</h2>
                {intro[g.key] && <p className="mt-2 max-w-2xl text-lg text-muted">{intro[g.key]}</p>}
                <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {g.items.map((r) => <ResourceCard key={r.id} r={r} />)}
                </ul>
              </section>
            ))}
          </div>
        )}

        <aside className="mt-16 rounded-[1.75rem] bg-sun-100 p-6 md:p-8">
          <h2 className="text-xl font-semibold">About past questions</h2>
          <p className="mt-2 max-w-3xl leading-relaxed text-ink-soft">
            Real Common Entrance papers belong to the examination bodies, so we don&apos;t copy them here.
            Our teachers write practice papers in the same style, with an explanation for every answer. Schools and publishers
            who hold the rights to past papers can share them with our pupils through the library.
          </p>
        </aside>
      </div>

      <CtaBand title="Want more than a worksheet?" text="Create a free account for class videos and practice quizzes that mark themselves.">
        <ButtonLink href="/signup" size="lg">Create a free account</ButtonLink>
        <ButtonLink href="/classes" size="lg" variant="light">See the classes</ButtonLink>
      </CtaBand>
    </>
  );
}

function ResourceCard({ r }: { r: PublicResource }) {
  const isLink = r.material_type === "link";
  const href = `/api/resources/${r.id}`;
  return (
    <li className="flex flex-col rounded-[1.5rem] border-2 border-line bg-white p-5">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className={`grid h-14 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink font-display text-xs font-semibold ${isLink ? "bg-sky-300" : "bg-tangerine-400"}`}>
          {isLink ? "WEB" : "PDF"}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug">{r.title}</h3>
          <p className="mt-1 text-sm text-muted">{[r.subject_name, r.class_name].filter(Boolean).join(", ")}</p>
        </div>
      </div>
      {r.description && <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{r.description}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
        {isLink ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-grape-700 hover:underline">
            Visit website<ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <>
            <a href={href} download className="inline-flex h-10 items-center gap-2 rounded-full bg-grape-600 px-4 font-display text-sm font-semibold text-white hover:bg-grape-700">
              <Download className="size-4" aria-hidden="true" />Download<span className="sr-only">: {r.title}</span>
            </a>
            <a href={href} target="_blank" rel="noopener" className="text-sm font-semibold text-grape-700 hover:underline">Open<span className="sr-only">: {r.title}, in a new tab</span></a>
            {size(r.file_size_bytes) && <span className="text-sm text-muted">{size(r.file_size_bytes)}</span>}
          </>
        )}
      </div>
    </li>
  );
}
