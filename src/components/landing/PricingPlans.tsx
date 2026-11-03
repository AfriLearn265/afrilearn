import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { formatNaira, type Catalogue } from "@/lib/catalogue";
import { getBrand } from "@/lib/brand";

export async function PricingPlans({ plans, paidFeatures }: { plans: Catalogue["plans"]; paidFeatures: boolean }) {
  const brand = await getBrand();
  const studentPlans = plans.filter((p) => p.audience === "student");
  const otherPlans = plans.filter((p) => p.audience !== "student");
  const per: Record<string, string> = { month: "per month", term: "per term", year: "per year", once: "one-off" };
  return (
    <div>
        {!paidFeatures && (
          <p className="mt-6 inline-flex rounded-full bg-sun-100 px-4 py-2 text-sm font-medium text-ink">
            Pilot term: every feature is free while we launch. The prices below apply from launch.
          </p>
        )}
        {plans.length === 0 ? (
          <p className="mt-8 text-muted">Plans are being finalised. Contact {brand.supportEmail} for school pricing.</p>
        ) : (
          <>
            <ul className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {studentPlans.map((p) => (
                <li key={p.key} className={`flex flex-col rounded-[1.5rem] p-6 ${p.is_featured ? "bg-adire-700 text-white shadow-pop" : "border border-line bg-paper"}`}>
                  <h3 className="font-sans text-lg font-semibold tracking-normal">{p.name}</h3>
                  <p className={`mt-1 text-sm ${p.is_featured ? "text-adire-100" : "text-muted"}`}>{p.description}</p>
                  <p className="mt-5 font-display text-4xl font-bold tabular">
                    {p.price_kobo === 0 ? "Free" : formatNaira(p.price_kobo) ?? "Talk to us"}
                  </p>
                  {p.price_kobo ? <p className={`text-sm ${p.is_featured ? "text-adire-100" : "text-muted"}`}>{per[p.billing_interval]}</p> : <p className={`text-sm ${p.is_featured ? "text-adire-100" : "text-muted"}`}>forever</p>}
                  <ul className="mt-6 grid gap-2.5 text-[0.95rem]">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2.5"><Check className={`mt-0.5 size-4 shrink-0 ${p.is_featured ? "text-sun-400" : "text-leaf-500"}`} aria-hidden="true" />{f}</li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-7">
                    <ButtonLink href={`/signup?plan=${p.key}`} variant={p.is_featured ? "accent" : "outline"} className="w-full">
                      {p.price_kobo === 0 ? "Start free" : `Choose ${p.name.toLowerCase()}`}
                    </ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
            {otherPlans.length > 0 && (
              <ul id="schools" className="mt-4 grid scroll-mt-24 gap-4 md:grid-cols-2">
                {otherPlans.map((p) => (
                  <li key={p.key} className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-line p-6 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-sans text-lg font-semibold tracking-normal">{p.name}</h3>
                      <p className="text-sm text-muted">{p.description} {p.features.slice(0, 2).join(". ")}.</p>
                    </div>
                    <ButtonLink href={p.audience === "teacher" ? "/signup?role=teacher" : `mailto:${brand.supportEmail}?subject=School%20plan`} variant="outline" className="shrink-0">
                      {p.audience === "teacher" ? "Apply to teach" : "Talk to us"}
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
    </div>
  );
}
