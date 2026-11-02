/**
 * Fallback copy of the academic structure, used only if the database cannot
 * be reached (for example while a free Supabase project is paused), so the
 * public pages never break. The live source of truth is the database.
 */
export type LevelKey = "nursery" | "primary" | "junior_secondary" | "senior_secondary" | "exam_prep";

export type CatalogueClass = { code: string; name: string; level: LevelKey; subjects: string[] };
export type CatalogueLevel = { key: LevelKey; name: string; description: string };

export const fallbackLevels: CatalogueLevel[] = [
  { key: "nursery", name: "Nursery", description: "Early years: numbers, letters, sounds and the world around us" },
  { key: "primary", name: "Primary", description: "Primary 1 to Primary 6" },
  { key: "junior_secondary", name: "Junior Secondary", description: "JSS 1 to JSS 3 (Basic Education)" },
  { key: "senior_secondary", name: "Senior Secondary", description: "SS 1 to SS 3" },
  { key: "exam_prep", name: "Exam Preparation", description: "WAEC, NECO, JAMB, NABTEB, scholarship and entrance examinations" },
];

const nursery = ["Number Work", "Letter Work", "Phonics", "Rhymes & Songs", "Basic Science", "Cultural & Creative Arts", "Social Habits", "Health Habits"];
const primary = ["English Language", "Mathematics", "Basic Science", "Basic Technology", "Social Studies", "Civic Education", "Computer Studies", "Agricultural Science", "Christian Religious Studies", "Islamic Religious Studies", "Cultural & Creative Arts", "History", "Home Economics", "Physical & Health Education", "Nigerian Language", "French"];
const jss = [...primary, "Business Studies"];
const sss = ["English Language", "Mathematics", "Further Mathematics", "Biology", "Chemistry", "Physics", "Economics", "Government", "Literature in English", "Geography", "Financial Accounting", "Commerce", "Civic Education", "Agricultural Science", "Computer Studies", "Christian Religious Studies", "Islamic Religious Studies", "Technical Drawing", "History"];

export const fallbackClasses: CatalogueClass[] = [
  ...["1", "2", "3"].map((n) => ({ code: `N${n}`, name: `Nursery ${n}`, level: "nursery" as const, subjects: nursery })),
  ...["1", "2", "3", "4", "5", "6"].map((n) => ({
    code: `P${n}`, name: `Primary ${n}`, level: "primary" as const,
    subjects: Number(n) >= 4 ? [...primary, "Quantitative Reasoning", "Verbal Reasoning"] : primary,
  })),
  ...["1", "2", "3"].map((n) => ({ code: `JSS${n}`, name: `JSS ${n}`, level: "junior_secondary" as const, subjects: jss })),
  ...["1", "2", "3"].map((n) => ({ code: `SS${n}`, name: `SS ${n}`, level: "senior_secondary" as const, subjects: sss })),
  { code: "WAEC", name: "WAEC (WASSCE)", level: "exam_prep", subjects: sss },
  { code: "NECO", name: "NECO (SSCE)", level: "exam_prep", subjects: sss },
  { code: "JAMB", name: "JAMB (UTME)", level: "exam_prep", subjects: ["Use of English", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government", "Literature in English", "Geography", "Commerce", "Financial Accounting", "Christian Religious Studies", "Islamic Religious Studies", "Agricultural Science", "History"] },
  { code: "NABTEB", name: "NABTEB", level: "exam_prep", subjects: ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Commerce", "Financial Accounting", "Technical Drawing", "Computer Studies", "Agricultural Science"] },
  { code: "SCHOLARSHIP", name: "Scholarship & Entrance", level: "exam_prep", subjects: ["Mathematics", "English Language", "Quantitative Reasoning", "Verbal Reasoning", "Basic Science"] },
];

export const interestOptions = [
  "Science", "Mathematics", "Reading & writing", "Technology & coding", "Arts & music",
  "Business & money", "Languages", "History & culture", "Exam success",
];

/** Classes where a parent or guardian must set up or consent to the account. */
export const guardianRequiredLevels: LevelKey[] = ["nursery", "primary"];
