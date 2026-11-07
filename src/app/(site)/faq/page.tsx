import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";
import { faqs } from "@/config/faq";
import { getBrand } from "@/lib/brand";

export const metadata: Metadata = { title: "Questions people ask", description: "Answers about classes, videos, child safety, teachers and payments." };

export default async function FaqPage() {
  const brand = await getBrand();
  return (
    <>
      <PageHero theme="grape" art={{ kind: "none" }} title="Questions people ask" intro={`Short answers about classes, videos, child safety, teachers and payments. Something else on your mind? Write to ${brand.supportEmail}.`} />
      <section className="container-page max-w-4xl py-16 md:py-20">
        <div className="grid gap-3">
          {faqs.map(([q, a]) => [q.replaceAll("AfriLearn", brand.name), a.replaceAll("AfriLearn", brand.name)]).map(([q, a], i) => (
            <details key={q} className="group rounded-[1.4rem] border-2 border-line bg-white px-5 open:border-ink open:shadow-[var(--shadow-sticker-sm)]" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-4 font-display text-xl font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-sun-400 text-ink font-bold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-3xl pb-5 pr-12 leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <CtaBand title="Still deciding?" text="Create a free account and look around. You can join a classroom whenever your teacher shares a code.">
        <ButtonLink href="/signup" size="lg">Create a free account</ButtonLink>
        <ButtonLink href={`mailto:${brand.supportEmail}`} size="lg" variant="light">Email us</ButtonLink>
      </CtaBand>
    </>
  );
}
