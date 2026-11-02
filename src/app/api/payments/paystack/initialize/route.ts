import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { siteUrl } from "@/lib/env";

// Creates a pending payment for a plan (price read from the database, never the browser)
// and sends the user to Paystack's secure checkout.
export async function POST(req: NextRequest) {
  const back = (msg: string) => NextResponse.redirect(new URL(`/billing?error=${encodeURIComponent(msg)}`, req.url), 303);
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login?next=/billing", req.url), 303);
  if (!paystackConfigured()) return back("Payments aren't switched on yet. The administrator needs to add the Paystack key.");
  const admin = createAdminClient();
  if (!admin) return back("Payments need the server key (SUPABASE_SECRET_KEY) before they can be recorded.");

  const form = await req.formData();
  const supabase = await createClient();
  const { data: plan } = await supabase.from("subscription_plans").select("id, name, price_kobo").eq("key", String(form.get("plan"))).eq("is_active", true).maybeSingle();
  if (!plan || !plan.price_kobo) return back("That plan can't be bought online.");
  if (!session.email) return back("Your account needs an email address to pay.");

  const reference = `AFL-${randomUUID()}`;
  const { error } = await admin.from("payments").insert({ user_id: session.userId, plan_id: plan.id, provider: "paystack", reference, amount_kobo: plan.price_kobo });
  if (error) return back("We couldn't start the payment. Try again.");
  try {
    const tx = await initializeTransaction({
      email: session.email, amountKobo: plan.price_kobo, reference,
      callbackUrl: `${siteUrl(req.nextUrl.origin)}/api/payments/paystack/callback`,
      metadata: { user_id: session.userId, plan: plan.name },
    });
    return NextResponse.redirect(tx.authorization_url, 303);
  } catch (e) {
    await admin.from("payments").update({ status: "failed" }).eq("reference", reference);
    return back(`Paystack couldn't start checkout: ${e instanceof Error ? e.message : "unknown error"}.`);
  }
}
