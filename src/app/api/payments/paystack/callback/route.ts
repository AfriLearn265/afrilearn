import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";

// Paystack sends the customer back here. We ask Paystack directly whether the
// payment succeeded; only then does the subscription become active.
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference") ?? req.nextUrl.searchParams.get("trxref");
  const to = (q: string) => NextResponse.redirect(new URL(`/billing?${q}`, req.url));
  if (!reference) return to("error=" + encodeURIComponent("Missing payment reference."));
  const admin = createAdminClient();
  if (!admin) return to("error=" + encodeURIComponent("Payments are not fully configured."));
  try {
    const tx = await verifyTransaction(reference);
    if (tx.status !== "success" || tx.currency !== "NGN") {
      await admin.from("payments").update({ status: tx.status === "abandoned" ? "abandoned" : "failed", provider_payload: tx }).eq("reference", reference).eq("status", "pending");
      return to("error=" + encodeURIComponent("The payment was not completed. You have not been charged."));
    }
    const { error } = await admin.rpc("service_confirm_payment", { p_reference: reference, p_amount_kobo: tx.amount, p_payload: tx });
    if (error) return to("error=" + encodeURIComponent(error.message));
    return to("paid=1");
  } catch (e) {
    return to("error=" + encodeURIComponent(`We couldn't confirm the payment yet (${e instanceof Error ? e.message : "error"}). If you were charged, it will activate automatically within minutes.`));
  }
}
