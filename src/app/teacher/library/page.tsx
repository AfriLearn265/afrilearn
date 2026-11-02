import { requireRole } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/app/AppShell";
import { Library, libraryCategories } from "@/components/app/Library";
import { LibraryUpload } from "@/components/app/LibraryUpload";

export const metadata = { title: "Digital library" };

export default async function TeacherLibrary({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; subject?: string }> }) {
  const { userId } = await requireRole("teacher");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Digital library" intro="Share notes, revision guides and practice sets with every student. Upload only work you wrote or have permission to share." />
      <Panel title="Add to the library" className="mb-6"><LibraryUpload userId={userId} categories={libraryCategories} /></Panel>
      <Library {...sp} basePath="/teacher/library" />
    </>
  );
}
