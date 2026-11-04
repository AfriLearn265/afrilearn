/**
 * Fallback copy of the academic structure, used only if the database cannot
 * be reached (for example while a free Supabase project is paused), so the
 * public pages never break. The live source of truth is the database.
 */
export type LevelKey = "nursery" | "primary" | "junior_secondary" | "senior_secondary" | "exam_prep";

export type CatalogueClass = { code: string; name: string; level: LevelKey; subjects: string[] };
export type CatalogueLevel = { key: LevelKey; name: string; description: string };

export const fallbackLevels: CatalogueLevel[] = [
  { key: "primary", name: "Primary", description: "Primary 1 to Primary 6" },
];

const primary = ["English Language", "Mathematics", "Basic Science", "Basic Technology", "Social Studies", "Civic Education", "Computer Studies", "Agricultural Science", "Christian Religious Studies", "Islamic Religious Studies", "Cultural & Creative Arts", "History", "Home Economics", "Physical & Health Education", "Nigerian Language", "French"];

/** This edition offers Primary 1 to 6 only. Other classes stay in the database, switched off. */
export const fallbackClasses: CatalogueClass[] = ["1", "2", "3", "4", "5", "6"].map((n) => ({
  code: `P${n}`, name: `Primary ${n}`, level: "primary" as const,
  subjects: Number(n) >= 4 ? [...primary, "Quantitative Reasoning", "Verbal Reasoning"] : primary,
}));

export const interestOptions = [
  "Science", "Mathematics", "Reading & stories", "Computers", "Arts & music",
  "Sports", "Languages", "Nature & animals", "Common Entrance",
];

/** Classes where a parent or guardian must set up or consent to the account. */
export const guardianRequiredLevels: LevelKey[] = ["nursery", "primary"];
