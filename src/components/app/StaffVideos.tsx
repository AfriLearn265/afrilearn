import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/app/AppShell";
import { ClassVideoGrid } from "@/components/app/ClassVideos";
import { VideoUploader, type UploaderClass } from "@/components/app/VideoUploader";

type ClassRow = { id: string; code: string; name: string; class_subjects: { subjects: { id: string; name: string; is_active: boolean } | null }[] };

/** The teacher and administrator video page: add a video for a class, then browse every class's videos. */
export async function StaffVideos({ userId, basePath, isAdmin, cls, subject, mine }: {
  userId: string; basePath: string; isAdmin: boolean; cls?: string; subject?: string; mine?: boolean;
}) {
  const supabase = await createClient();
  const [{ data: classes }, { data: taught }] = await Promise.all([
    supabase.from("classes").select("id, code, name, class_subjects(subjects(id, name, is_active))").eq("is_active", true).order("sort_order"),
    supabase.from("teacher_classes").select("class_id").eq("teacher_id", userId),
  ]);
  const rows = (classes ?? []) as unknown as ClassRow[];
  const uploaderClasses: UploaderClass[] = rows.map((c) => ({
    id: c.id, name: c.name,
    subjects: c.class_subjects.map((s) => s.subjects).filter((s): s is { id: string; name: string; is_active: boolean } => !!s?.is_active)
      .map(({ id, name }) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
  }));
  const mineIds = new Set((taught ?? []).map((t) => t.class_id));
  const current = rows.find((c) => c.code === cls);
  const query = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ class: cls, mine: mine ? "1" : undefined, ...extra }).filter(([, v]) => v) as [string, string][]);
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <>
      <PageHeader title="Class videos" intro="Add short videos for each class, subject by subject. Pupils in that class, and their parents, can watch them straight away." />
      <Panel title="Add a video" className="mb-8">
        <VideoUploader userId={userId} classes={uploaderClasses} defaultClassId={rows.find((c) => mineIds.has(c.id))?.id} />
      </Panel>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by class" className="-mx-4 overflow-x-auto px-4 scrollbar-none">
          <ul className="flex min-w-max gap-2">
            <li><Link href={query({ class: undefined, subject: undefined })} className={tab(!cls)}>All classes</Link></li>
            {rows.map((c) => (
              <li key={c.id}><Link href={query({ class: c.code, subject: undefined })} className={tab(cls === c.code)}>{c.name}</Link></li>
            ))}
          </ul>
        </nav>
        {!isAdmin && (
          <Link href={mine ? query({ mine: undefined }) : query({ mine: "1" })} className="text-sm font-semibold text-grape-700 hover:underline">
            {mine ? "Show everyone's videos" : "Show only my videos"}
          </Link>
        )}
      </div>
      <ClassVideoGrid classIds={current ? [current.id] : null} basePath={query({ subject: undefined })} subject={subject} showClass={!current}
        staff mineOnly={mine} userId={userId}
        emptyTitle={current ? `No videos for ${current.name} yet.` : "No class videos yet."}
        emptyText="Add the first one above. A short video of 3 to 8 minutes works best for primary pupils." />
    </>
  );
}

function tab(active: boolean) {
  return clsx("inline-flex h-10 items-center rounded-full border-2 px-4 font-display text-sm font-semibold transition-colors",
    active ? "border-ink bg-grape-600 text-white" : "border-line bg-white text-ink-soft hover:border-grape-300");
}
