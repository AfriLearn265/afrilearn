import "server-only";
import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  fallbackClasses, fallbackLevels, type CatalogueClass, type CatalogueLevel, type LevelKey,
} from "@/config/curriculum";

export type Plan = {
  key: string; name: string; description: string | null; audience: string;
  price_kobo: number | null; billing_interval: string; features: string[]; is_featured: boolean;
};
export type Testimonial = { id: string; author_name: string; author_role: string; quote: string };
export type FeaturedCourse = {
  id: string; title: string; slug: string; summary: string | null; difficulty: string;
  subject: { name: string; color: string } | null; klass: { name: string } | null; lessons: number;
};
type CourseRow = {
  id: string; title: string; slug: string; summary: string | null; difficulty: string;
  subject_name: string | null; subject_color: string | null; class_name: string | null; lesson_count: number | null;
};
export type SubjectOption = { code: string; name: string };

export type Catalogue = {
  levels: CatalogueLevel[];
  classes: CatalogueClass[];
  subjects: SubjectOption[];
  plans: Plan[];
  testimonials: Testimonial[];
  courses: FeaturedCourse[];
  paidFeatures: boolean;
  live: boolean; // false when we fell back to the built-in copy
};

type ClassRow = {
  code: string; name: string; sort_order: number;
  education_levels: { key: LevelKey } | null;
  class_subjects: { subjects: { name: string; is_active: boolean } | null }[];
};

export async function getCatalogue(): Promise<Catalogue> {
  const empty: Catalogue = {
    levels: fallbackLevels, classes: fallbackClasses,
    subjects: Array.from(new Set(fallbackClasses.flatMap((c) => c.subjects))).map((name) => ({ code: name, name })),
    plans: [], testimonials: [], courses: [], paidFeatures: false, live: false,
  };
  if (!isSupabaseConfigured) return empty;
  try {
    const db = createPublicClient();
    const [levels, classes, subjects, plans, testimonials, courses, settings] = await Promise.all([
      db.from("education_levels").select("key, name, description").order("sort_order"),
      db.from("classes").select("code, name, sort_order, education_levels(key), class_subjects(subjects(name, is_active))")
        .eq("is_active", true).order("sort_order"),
      db.from("subjects").select("code, name").eq("is_active", true).order("name"),
      db.from("subscription_plans").select("key, name, description, audience, price_kobo, billing_interval, features, is_featured")
        .eq("is_active", true).order("sort_order"),
      db.from("testimonials").select("id, author_name, author_role, quote").eq("is_published", true).order("sort_order"),
      db.rpc("catalogue_courses", { p_limit: 6 }),
      db.from("platform_settings").select("key, value").eq("key", "paid_features_enabled"),
    ]);
    if (levels.error || classes.error) throw levels.error ?? classes.error;

    const offered: CatalogueClass[] = ((classes.data ?? []) as unknown as ClassRow[]).map((c) => ({
      code: c.code, name: c.name, level: c.education_levels?.key ?? "primary",
      subjects: c.class_subjects.map((cs) => cs.subjects).filter((s): s is { name: string; is_active: boolean } => !!s && s.is_active)
        .map((s) => s.name).sort(),
    }));
    return {
      // Only levels that still have classes on offer (this edition: Primary).
      levels: ((levels.data ?? []) as CatalogueLevel[]).filter((l) => offered.some((c) => c.level === l.key)),
      classes: offered,
      subjects: (subjects.data ?? []) as SubjectOption[],
      plans: (plans.data ?? []) as Plan[],
      testimonials: (testimonials.data ?? []) as Testimonial[],
      courses: ((courses.data ?? []) as CourseRow[]).map(toCourse),
      paidFeatures: settings.data?.[0]?.value === true,
      live: true,
    };
  } catch {
    return empty;
  }
}

export function formatNaira(kobo: number | null) {
  if (kobo === null) return null;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
}

/** Every published public course, for the /courses page. */
export async function getCourses(limit = 24): Promise<FeaturedCourse[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient().rpc("catalogue_courses", { p_limit: limit });
  if (error || !data) return [];
  return (data as CourseRow[]).map(toCourse);
}

function toCourse(c: CourseRow): FeaturedCourse {
  return {
    id: c.id, title: c.title, slug: c.slug, summary: c.summary, difficulty: c.difficulty,
    subject: c.subject_name ? { name: c.subject_name, color: c.subject_color ?? "#4A1FB8" } : null,
    klass: c.class_name ? { name: c.class_name } : null, lessons: c.lesson_count ?? 0,
  };
}

export type PublicResource = {
  id: string; title: string; description: string | null; material_type: string; url: string; library_category: string;
  subject_name: string | null; class_name: string | null; class_sort: number | null; file_size_bytes: number | null; license_note: string | null;
};

/** Approved library items marked for the public, for the free downloads page. */
export async function getPublicResources(): Promise<PublicResource[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient().rpc("public_resources");
  return error || !data ? [] : (data as PublicResource[]);
}

export type TopicHighlight = {
  code: string; title: string; class_name: string; class_code: string; subject_code: string;
  stars: number | null; ratings: number; views: number; plays: number;
};
export type PlatformStats = { topics: number; video_views: number; quiz_plays: number; rating: number | null; ratings: number };

/** Real numbers for the homepage: popular lessons with their actual ratings and views, and platform totals. */
export async function getHomeHighlights(): Promise<{ topics: TopicHighlight[]; stats: PlatformStats | null; topicCounts: Record<string, number> }> {
  if (!isSupabaseConfigured) return { topics: [], stats: null, topicCounts: {} };
  const db = createPublicClient();
  const [h, s, c] = await Promise.all([
    db.rpc("public_topic_highlights", { p_limit: 6 }),
    db.rpc("public_platform_stats"),
    db.from("curriculum_topics").select("subjects(code)").eq("is_published", true),
  ]);
  const topicCounts: Record<string, number> = {};
  for (const r of (c.data ?? []) as unknown as { subjects: { code: string } | null }[]) {
    const code = r.subjects?.code;
    if (code) topicCounts[code] = (topicCounts[code] ?? 0) + 1;
  }
  return { topics: (h.data ?? []) as TopicHighlight[], stats: (s.data ?? null) as PlatformStats | null, topicCounts };
}
