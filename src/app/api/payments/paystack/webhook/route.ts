import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validSignature, verifyTransaction } from "@/lib/paystack";

// Paystack server-to-server notification. The signature proves it came from
// Paystack; we still re-verify the transaction before activating anything.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-paystack-signature"))) return NextResponse.json({ ok: false }, { status: 401 });
  const event = JSON.parse(raw) as { event: string; data?: { reference?: string } };
  if (event.event !== "charge.success" || !event.data?.reference) return NextResponse.json({ ok: true });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false }, { status: 500 });
  const tx = await verifyTransaction(event.data.reference);
  if (tx.status === "success" && tx.currency === "NGN") {
    await admin.rpc("service_confirm_payment", { p_reference: tx.reference, p_amount_kobo: tx.amount, p_payload: tx });
  }
  return NextResponse.json({ ok: true });
}
