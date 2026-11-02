import { redirect } from "next/navigation";
import { Clock3, XCircle } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { getSession, firstName, homeFor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { DocumentUploader } from "./DocumentUploader";

export const metadata = { title: "Teacher application" };

export default async function PendingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.role !== "teacher" || session.profile.status === "active") redirect(homeFor(session.profile));

  const supabase = await createClient();
  const { data: teacher } = await supabase
    .from("teachers")
    .select("application_status, qualification, years_experience, review_note, document_paths, created_at, teacher_subjects(subjects(name)), teacher_classes(classes(name, sort_order))")
    .eq("profile_id", session.userId)
    .maybeSingle();

  const rejected = teacher?.application_status === "rejected";
  const subjects = (teacher?.teacher_subjects as unknown as { subjects: { name: string } | null }[] | undefined)?.map((s) => s.subjects?.name).filter(Boolean) ?? [];
  const classes = (teacher?.teacher_classes as unknown as { classes: { name: string; sort_order: number } | null }[] | undefined)
    ?.map((c) => c.classes).filter((c): c is { name: string; sort_order: number } => !!c).sort((a, b) => a.sort_order - b.sort_order).map((c) => c.name) ?? [];

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <form action={signOut}><Button variant="ghost" size="sm" type="submit">Log out</Button></form>
        </div>
      </header>
      <main id="main" className="container-page max-w-3xl py-12">
        <div className={`flex gap-4 rounded-[1.5rem] p-6 ${rejected ? "bg-coral-100" : "bg-sun-100"}`}>
          {rejected ? <XCircle className="size-7 shrink-0 text-coral-700" aria-hidden="true" /> : <Clock3 className="size-7 shrink-0 text-sun-600" aria-hidden="true" />}
          <div>
            <h1 className="text-3xl font-bold">
              {rejected ? "Your application was not approved" : `Thanks, ${firstName(session.profile.full_name)}. Your application is under review.`}
            </h1>
            <p className="mt-2 text-ink-soft">
              {rejected
                ? teacher?.review_note ?? "Contact support if you would like to know more or apply again."
                : "An administrator checks every teacher before they can create classrooms, courses and examinations. Uploading your certificates now speeds this up. We will notify you here as soon as a decision is made."}
            </p>
          </div>
        </div>

        <section className="mt-10 grid gap-6 rounded-[1.5rem] border border-line bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold">Your application</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted">Qualification</dt><dd className="font-medium">{teacher?.qualification ?? "Not given"}</dd></div>
            <div><dt className="text-sm text-muted">Teaching experience</dt><dd className="font-medium">{teacher?.years_experience != null ? `${teacher.years_experience} years` : "Not given"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-sm text-muted">Subjects</dt><dd className="font-medium">{subjects.join(", ") || "None selected"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-sm text-muted">Classes</dt><dd className="font-medium">{classes.join(", ") || "None selected"}</dd></div>
          </dl>
          <div className="border-t border-line pt-6">
            <h3 className="font-sans text-lg font-semibold tracking-normal">Certificates and documents</h3>
            <p className="mt-1 text-sm text-muted">PDF or photo, up to 10 MB each. Only you and administrators can open them.</p>
            <DocumentUploader userId={session.userId} initial={(teacher?.document_paths as string[] | undefined) ?? []} />
          </div>
        </section>
      </main>
    </div>
  );
}
