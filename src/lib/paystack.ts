import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.paystack.co";
export const paystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !json.status || !json.data) throw new Error(json.message ?? `Paystack returned ${res.status}`);
  return json.data;
}

export function initializeTransaction(input: { email: string; amountKobo: number; reference: string; callbackUrl: string; metadata: Record<string, unknown> }) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email: input.email, amount: input.amountKobo, currency: "NGN", reference: input.reference, callback_url: input.callbackUrl, metadata: input.metadata }),
  });
}

export function verifyTransaction(reference: string) {
  return call<{ status: string; amount: number; currency: string; reference: string; paid_at: string; channel: string }>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function validSignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
