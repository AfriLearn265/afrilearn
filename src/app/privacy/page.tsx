import { ProsePage } from "@/components/landing/ProsePage";
import { getBrand } from "@/lib/brand";

export const metadata = { title: "Privacy" };

export default async function Privacy() {
  const brand = await getBrand();
  return (
    <ProsePage title="Privacy and child safety" updated="November 2026">
      <p>{brand.name} is used by children, so we collect as little as we can and protect it carefully. This page explains what we store, why, and who can see it. It is a working draft for our pilot and will be reviewed against the Nigeria Data Protection Act before public launch.</p>
      <h2>What we store</h2>
      <ul>
        <li>Account details: name, email address, role and, for teachers and parents, a phone number.</li>
        <li>Learning records: class, classrooms joined, lessons completed, assignments, test answers, results, attendance and points.</li>
        <li>For teachers: qualifications, subjects, classes and the documents you upload for review.</li>
        <li>Payment records from Paystack (reference, amount and status). We never see or store card numbers.</li>
      </ul>
      <h2>Who can see it</h2>
      <ul>
        <li>Students see their own records.</li>
        <li>Teachers see records for students enrolled in their classrooms only.</li>
        <li>Parents and guardians see records for children they have linked with the child&apos;s code.</li>
        <li>Administrators can see records to run and moderate the platform. Their actions are logged.</li>
      </ul>
      <p>These rules are enforced inside the database itself, not only in the website, so they cannot be bypassed by changing a link.</p>
      <h2 id="children">Children&apos;s safety</h2>
      <ul>
        <li>Nursery and Primary accounts require a parent or guardian&apos;s name, email and consent.</li>
        <li>There is no private messaging between adults and children. Teachers message parents, and moderators can review conversations.</li>
        <li>Profiles are never public. Class leaderboards are off unless a teacher turns them on, students opt in, and only first names and an initial are shown.</li>
        <li>Teachers are approved by an administrator before they can create classrooms or content.</li>
      </ul>
      <h2>Your choices</h2>
      <p>You can update your details from your dashboard. To delete an account or download your data, write to <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> and we will respond within 30 days.</p>
    </ProsePage>
  );
}
