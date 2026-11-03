import { BookOpen, FileText, Film, Presentation } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/app/AppShell";

import { libraryCategories } from "./libraryCategories";

export { libraryCategories };

type Item = { id: string; title: string; description: string | null; material_type: string; storage_path: string | null; external_url: string | null;
  library_category: string; is_downloadable: boolean; download_count: number; created_at: string; license_note: string | null;
  subjects: { name: string } | null; classes: { name: string } | null };

const icon = (t: string) => (t === "video" ? Film : t === "slides" ? Presentation : t === "pdf" || t === "document" ? FileText : BookOpen);

/** Searchable digital library of standalone materials (not tied to one course or classroom). */
export async function Library({ q, category, subject, basePath }: { q?: string; category?: string; subject?: string; basePath: string }) {
  const supabase = await createClient();
  let query = supabase.from("learning_materials")
    .select("id, title, description, material_type, storage_path, external_url, library_category, is_downloadable, download_count, created_at, license_note, subjects(name), classes(name)")
    .is("course_id", null).is("classroom_id", null).eq("is_approved", true).order("created_at", { ascending: false }).limit(60);
  if (q) query = query.ilike("title", `%${q}%`);
  if (category) query = query.eq("library_category", category);
  if (subject) query = query.eq("subject_id", subject);
  const [{ data }, { data: subjects }] = await Promise.all([query, supabase.from("subjects").select("id, name").eq("is_active", true).order("name")]);
  const items = (data ?? []) as unknown as Item[];

  return (
    <div className="grid gap-6">
      <form action={basePath} className="grid gap-3 rounded-[1.25rem] border border-line bg-white p-4 md:grid-cols-[1fr_14rem_14rem_auto]">
        <label className="sr-only" htmlFor="lib-q">Search</label>
        <input id="lib-q" name="q" defaultValue={q} placeholder="Search the library" className="h-11 rounded-xl border border-line px-3.5" />
        <label className="sr-only" htmlFor="lib-cat">Category</label>
        <select id="lib-cat" name="category" defaultValue={category ?? ""} className="h-11 rounded-xl border border-line bg-white px-3">
          <option value="">All categories</option>{Object.entries(libraryCategories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="sr-only" htmlFor="lib-sub">Subject</label>
        <select id="lib-sub" name="subject" defaultValue={subject ?? ""} className="h-11 rounded-xl border border-line bg-white px-3">
          <option value="">All subjects</option>{(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="submit" className="h-11 rounded-xl bg-adire-700 px-5 font-semibold text-white hover:bg-adire-800">Search</button>
      </form>
      {items.length === 0 ? <EmptyState title="Nothing matches yet.">Teachers and administrators add licensed and original materials here.</EmptyState> : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => {
            const Icon = icon(m.material_type);
            const href = m.storage_path ? `/api/files/materials?path=${encodeURIComponent(m.storage_path)}${m.is_downloadable ? "&download=1" : ""}` : m.external_url ?? "#";
            return (
              <li key={m.id} className="flex flex-col rounded-[1.25rem] border border-line bg-white p-5">
                <div className="flex items-center gap-2 text-sm text-muted"><Icon className="size-4 text-adire-700" aria-hidden="true" />{libraryCategories[m.library_category]}</div>
                <h3 className="mt-2 font-sans text-lg font-semibold tracking-normal">{m.title}</h3>
                {m.description && <p className="mt-1 line-clamp-3 text-sm text-muted">{m.description}</p>}
                <p className="mt-3 text-xs text-muted">{[m.subjects?.name, m.classes?.name, `added ${formatDate(m.created_at)}`, `${m.download_count} opens`].filter(Boolean).join(", ")}</p>
                {m.license_note && <p className="text-xs text-faint">{m.license_note}</p>}
                <a href={href} target="_blank" className="mt-auto pt-4 text-sm font-semibold text-adire-700 hover:underline">{m.is_downloadable ? "Open or download" : "Open"}</a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
