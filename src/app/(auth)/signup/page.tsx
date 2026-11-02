import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogue } from "@/lib/catalogue";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const catalogue = await getCatalogue();
  const plan = catalogue.plans.find((p) => p.key === sp.plan);
  const role = sp.role === "teacher" || sp.role === "parent" ? sp.role : "student";
  return (
    <div>
      <h1 className="text-4xl font-bold">Create your account</h1>
      <p className="mt-2 text-muted">
        Already have one? <Link href="/login" className="font-semibold text-adire-700 hover:underline">Log in</Link>
      </p>
      {plan && plan.price_kobo !== 0 && (
        <p className="mt-5 rounded-xl bg-sun-100 px-4 py-3 text-sm">
          You picked <strong>{plan.name}</strong>. {catalogue.paidFeatures
            ? "You can pay for it from your dashboard after you sign up."
            : "During the pilot term every feature is free, so you can start straight away."}
        </p>
      )}
      <SignupForm
        initialRole={role}
        initialClass={sp.class}
        levels={catalogue.levels}
        classes={catalogue.classes.map(({ code, name, level }) => ({ code, name, level }))}
        subjects={catalogue.subjects}
      />
    </div>
  );
}
