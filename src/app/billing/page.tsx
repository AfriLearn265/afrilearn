import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { formatNaira } from "@/lib/catalogue";
import { paystackConfigured } from "@/lib/paystack";
import { AppShell, PageHeader, Panel } from "@/components/app/AppShell";
import { Notice } from "@/components/ui/Field";

export const metadata = { title: "Plans and billing" };

export default async function Billing({ searchParams }: { searchParams: Promise<{ paid?: string; error?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/billing");
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: plans }, { data: subs }, { data: pays }, { data: setting }] = await Promise.all([
    supabase.from("subscription_plans").select("key, name, description, price_kobo, billing_interval, features, is_featured, audience").eq("is_active", true).in("audience", ["student", "parent"]).order("sort_order"),
    supabase.from("subscriptions").select("id, status, starts_at, ends_at, subscription_plans(name)").eq("user_id", session.userId).order("created_at", { ascending: false }),
    supabase.from("payments").select("id, reference, amount_kobo, status, created_at").eq("user_id", session.userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("platform_settings").select("value").eq("key", "paid_features_enabled").maybeSingle(),
  ]);
  const pilot = setting?.value !== true;
  const ready = paystackConfigured();
  const active = (subs ?? []).filter((s) => s.status === "active" && (!s.ends_at || new Date(s.ends_at) > new Date(s.starts_at ?? 0)));

  return (
    <AppShell session={session}>
      <PageHeader title="Plans and billing" intro="Pay securely in naira with card, bank transfer or USSD through Paystack. A plan activates only after Paystack confirms the payment." />
      {sp.paid && <div className="mb-6"><Notice tone="success" title="Payment confirmed.">Your plan is active. A receipt is in your notifications.</Notice></div>}
      {sp.error && <div className="mb-6"><Notice tone="error">{sp.error}</Notice></div>}
      {pilot && <div className="mb-6"><Notice tone="info" title="Pilot term">Every feature is free while we launch, so you don&apos;t need to pay to use anything.{ready ? " Checkout below runs in Paystack test mode for demonstration." : ""}</Notice></div>}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ul className="grid gap-4 md:grid-cols-2">
          {(plans ?? []).map((p) => (
            <li key={p.key} className={`flex flex-col rounded-[1.25rem] p-6 ${p.is_featured ? "bg-adire-700 text-white" : "border border-line bg-white"}`}>
              <h2 className="font-sans text-lg font-semibold tracking-normal">{p.name}</h2>
              <p className={`text-sm ${p.is_featured ? "text-adire-100" : "text-muted"}`}>{p.description}</p>
              <p className="mt-4 font-display text-3xl font-bold tabular">{p.price_kobo ? formatNaira(p.price_kobo) : "Free"}{p.price_kobo ? <span className="text-base font-normal opacity-75"> per {p.billing_interval}</span> : null}</p>
              <ul className="mt-4 grid gap-2 text-sm">{(p.features as string[]).map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{f}</li>)}</ul>
              <div className="mt-auto pt-6">
                {p.price_kobo ? (
                  ready ? (
                    <form action="/api/payments/paystack/initialize" method="post">
                      <input type="hidden" name="plan" value={p.key} />
                      <button type="submit" className={`h-11 w-full rounded-xl font-semibold ${p.is_featured ? "bg-sun-400 text-ink hover:bg-sun-300" : "bg-adire-700 text-white hover:bg-adire-800"}`}>Pay with Paystack</button>
                    </form>
                  ) : <p className={`text-sm ${p.is_featured ? "text-adire-100" : "text-muted"}`}>Online payment opens when the administrator connects Paystack.</p>
                ) : <p className={`text-sm font-semibold ${p.is_featured ? "" : "text-leaf-700"}`}>Included with every account</p>}
              </div>
            </li>
          ))}
        </ul>
        <div className="grid content-start gap-6">
          <Panel title="Your plans">
            {active.length === 0 ? <p className="text-sm text-muted">You&apos;re on the free plan.</p> : (
              <ul className="grid gap-2 text-sm">{active.map((s) => <li key={s.id}><strong>{(s.subscription_plans as unknown as { name: string } | null)?.name}</strong>, active until {s.ends_at ? formatDate(s.ends_at) : "further notice"}</li>)}</ul>
            )}
          </Panel>
          <Panel title="Payment history">
            {(pays ?? []).length === 0 ? <p className="text-sm text-muted">No payments yet.</p> : (
              <ul className="divide-y divide-line text-sm">{(pays ?? []).map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2"><span><span className="block">{formatDate(p.created_at)}</span><span className="text-xs text-muted">{p.reference}</span></span><span className="text-right"><span className="block font-semibold tabular">{formatNaira(p.amount_kobo)}</span><span className={p.status === "success" ? "text-leaf-700" : "text-muted"}>{p.status}</span></span></li>
              ))}</ul>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
