import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";
import { faqs } from "@/config/faq";
import { getBrand } from "@/lib/brand";

export const metadata: Metadata = { title: "Questions people ask", description: "Answers about classes, child safety, teachers, exams and payments." };

export default async function FaqPage() {
  const brand = await getBrand();
  return (
    <>
      <PageHero id="faq" title="Questions people ask" intro={`Short answers about classes, child safety, teachers, exams and payments. Something else on your mind? Write to ${brand.supportEmail}.`} />
      <section className="container-page max-w-4xl py-16 md:py-20">
        <div className="divide-y divide-line border-y border-line">
          {faqs.map(([q, a]) => [q.replaceAll("AfriLearn", brand.name), a.replaceAll("AfriLearn", brand.name)]).map(([q, a], i) => (
            <details key={q} className="group py-1" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-wash text-adire-700 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-3xl pb-5 pr-12 leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <CtaBand title="Still deciding?" text="Create a free account and look around. You can join a classroom whenever your teacher shares a code." photo="smiling">
        <ButtonLink href="/signup" size="lg" variant="accent">Create a free account</ButtonLink>
        <ButtonLink href={`mailto:${brand.supportEmail}`} size="lg" variant="onDark">Email us</ButtonLink>
      </CtaBand>
    </>
  );
}
