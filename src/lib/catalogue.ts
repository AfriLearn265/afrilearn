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
      db.from("courses").select("id, title, slug, summary, difficulty, subjects(name, color), classes(name), lessons(count)")
        .eq("is_published", true).is("classroom_id", null).order("is_featured", { ascending: false }).limit(6),
      db.from("platform_settings").select("key, value").eq("key", "paid_features_enabled"),
    ]);
    if (levels.error || classes.error) throw levels.error ?? classes.error;

    return {
      levels: (levels.data ?? []) as CatalogueLevel[],
      classes: ((classes.data ?? []) as unknown as ClassRow[]).map((c) => ({
        code: c.code, name: c.name, level: c.education_levels?.key ?? "primary",
        subjects: c.class_subjects.map((cs) => cs.subjects).filter((s): s is { name: string; is_active: boolean } => !!s && s.is_active)
          .map((s) => s.name).sort(),
      })),
      subjects: (subjects.data ?? []) as SubjectOption[],
      plans: (plans.data ?? []) as Plan[],
      testimonials: (testimonials.data ?? []) as Testimonial[],
      courses: ((courses.data ?? []) as unknown as Array<Omit<FeaturedCourse, "subject" | "klass" | "lessons"> & {
        subjects: FeaturedCourse["subject"]; classes: FeaturedCourse["klass"]; lessons: { count: number }[];
      }>).map((c) => ({ ...c, subject: c.subjects, klass: c.classes, lessons: c.lessons?.[0]?.count ?? 0 })),
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
