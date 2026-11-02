import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/app/AppShell";
import { Library } from "@/components/app/Library";

export const metadata = { title: "Digital library" };

export default async function StudentLibrary({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; subject?: string }> }) {
  await requireRole("student");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Digital library" intro="Notes, revision guides, practice exercises and videos shared by teachers. Only original or properly licensed material is published here." />
      <Library {...sp} basePath="/student/library" />
    </>
  );
}
