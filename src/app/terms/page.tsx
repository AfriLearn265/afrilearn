import { ProsePage } from "@/components/landing/ProsePage";
import { getBrand } from "@/lib/brand";

export const metadata = { title: "Terms of use" };

export default async function Terms() {
  const brand = await getBrand();
  return (
    <ProsePage title="Terms of use" updated="November 2026">
      <p>These terms cover the {brand.name} pilot. By creating an account you agree to them. They are a working draft and will be finalised with legal review before public launch.</p>
      <h2>Accounts</h2>
      <ul>
        <li>Give accurate details and keep your password private. You are responsible for activity on your account.</li>
        <li>Pupils in Nursery and Primary must have a parent or guardian&apos;s consent.</li>
        <li>Teacher accounts are opened only after an administrator approves the application.</li>
      </ul>
      <h2>Content</h2>
      <ul>
        <li>Teachers may only upload material they wrote or have permission to share. We remove copyrighted material reported to us.</li>
        <li>Examination questions are written by our teachers or licensed for use. Copying them elsewhere is not allowed.</li>
      </ul>
      <h2>Behaviour</h2>
      <p>Be respectful. Harassment, cheating tools, sharing other people&apos;s data, or attempts to break the platform lead to suspension.</p>
      <h2>Payments</h2>
      <p>Paid plans are billed in naira through Paystack and activate only after Paystack confirms payment. During the pilot term every feature is free.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>.</p>
    </ProsePage>
  );
}
