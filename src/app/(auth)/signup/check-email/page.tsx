import Link from "next/link";
import { MailCheck } from "lucide-react";

export const metadata = { title: "Check your email" };

export default async function CheckEmail({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <div>
      <MailCheck className="size-10 text-adire-700" aria-hidden="true" />
      <h1 className="mt-4 text-4xl font-bold">Confirm your email</h1>
      <p className="mt-3 text-lg text-muted">
        We sent a confirmation link to <strong className="text-ink">{email ?? "your inbox"}</strong>. Open it on this device to finish creating your account.
      </p>
      <p className="mt-6 text-sm text-muted">No email after a few minutes? Check your spam folder, or <Link href="/signup" className="font-semibold text-adire-700 hover:underline">sign up again</Link> with the correct address.</p>
    </div>
  );
}
