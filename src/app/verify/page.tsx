import { BadgeCheck, SearchX } from "lucide-react";
import { ProsePage } from "@/components/landing/ProsePage";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { getBrand } from "@/lib/brand";

export const metadata = { title: "Verify a certificate" };

type Cert = { certificate_no: string; title: string; issued_at: string; holder: string } | null;

export default async function Verify({ searchParams }: { searchParams: Promise<{ no?: string }> }) {
  const { no } = await searchParams;
  const brand = await getBrand();
  let cert: Cert = null;
  if (no) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("verify_certificate", { p_no: no });
    cert = (data as Cert) ?? null;
  }
  return (
    <ProsePage title="Verify a certificate">
      <p>Enter the certificate number printed at the bottom of a {brand.name} certificate to check that it is genuine.</p>
      <form className="flex flex-wrap gap-3" action="/verify">
        <label htmlFor="no" className="sr-only">Certificate number</label>
        <Input id="no" name="no" defaultValue={no} placeholder="AFL-XXXXXXXXXX" className="max-w-xs uppercase" />
        <Button type="submit">Check certificate</Button>
      </form>
      {no && (cert ? (
        <div className="flex gap-4 rounded-2xl bg-leaf-100 p-6 text-ink">
          <BadgeCheck className="size-7 shrink-0 text-leaf-500" aria-hidden="true" />
          <div>
            <p className="font-semibold">Genuine certificate</p>
            <p>{cert.holder} completed <strong>{cert.title}</strong> on {formatDate(cert.issued_at)}.</p>
            <p className="text-sm text-muted">Certificate {cert.certificate_no}</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 rounded-2xl bg-coral-100 p-6 text-ink">
          <SearchX className="size-7 shrink-0 text-coral-700" aria-hidden="true" />
          <p>No certificate uses the number <strong>{no.toUpperCase()}</strong>. Check for typos, including the AFL- at the start.</p>
        </div>
      ))}
    </ProsePage>
  );
}
