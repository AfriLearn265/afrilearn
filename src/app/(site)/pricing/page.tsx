import type { Metadata } from "next";
import Link from "next/link";
import { PricingPlans } from "@/components/landing/PricingPlans";
import { CtaBand, PageHero, SectionHeading } from "@/components/landing/Marketing";
import { ButtonLink } from "@/components/ui/Button";
import { getCatalogue } from "@/lib/catalogue";
import { brand } from "@/config/brand";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple plans in naira for students, exam candidates and schools. Free for teachers.",
};

export default async function PricingPage() {
  const { plans, paidFeatures } = await getCatalogue();

  return (
    <>
      <PageHero id="pricing" photo="pupils" title="Simple plans in naira."
        intro="Start free. Upgrade when you want live classes, the learning companion or full exam preparation. Teachers always join free.">
        <ButtonLink href="/signup" size="lg" variant="accent">Start free</ButtonLink>
        <ButtonLink href="#schools" size="lg" variant="onDark">Plans for schools</ButtonLink>
      </PageHero>

      <section className="container-page py-16 md:py-20">
        <PricingPlans plans={plans} paidFeatures={paidFeatures} />
      </section>

      <section className="container-page pb-8">
        <div className="grid gap-10 border-t border-line pt-16 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading title="About payments" intro={<>More answers on the <Link href="/faq" className="font-semibold text-adire-700 underline-offset-4 hover:underline">questions page</Link>, or write to {brand.supportEmail}.</>} />
          <dl className="divide-y divide-line border-y border-line">
            {[
              ["How do I pay?", "Plans are paid in naira by card, bank transfer or USSD through Paystack. Your plan becomes active as soon as Paystack confirms the payment to us."],
              ["Can I cancel?", "Yes. Monthly plans simply stop at the end of the month you paid for. You keep your progress, results and certificates."],
              ["Is anything free?", "Yes. Lessons for your class, classroom codes, CBT practice and progress tracking are free. During the pilot term every feature is free."],
            ].map(([q, a]) => (
              <div key={q} className="py-5">
                <dt className="text-lg font-semibold">{q}</dt>
                <dd className="mt-1.5 leading-relaxed text-muted">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CtaBand title="Bring a whole school." text="Tell us about your school and we will set up your classes, teachers and student accounts with you." photo="school">
        <ButtonLink href={`mailto:${brand.supportEmail}?subject=School%20plan`} size="lg" variant="accent">Talk to us about your school</ButtonLink>
      </CtaBand>
    </>
  );
}
