/** The three core Primary subjects, in the order pupils see them, and how each one looks. */
export const CORE_SUBJECTS = ["english", "mathematics", "basic-science"] as const;
export type CoreSubject = (typeof CORE_SUBJECTS)[number];

export type SubjectLook = {
  short: string;
  /** Tile background, a soft wash, readable text on the wash, and the solid accent. */
  bg: string; soft: string; text: string; ring: string;
  tagline: string;
};

export const subjectLook: Record<CoreSubject, SubjectLook> = {
  english: { short: "English", bg: "bg-sky-400", soft: "bg-sky-100", text: "text-sky-600", ring: "ring-sky-300", tagline: "Phonics, reading, writing and speaking" },
  mathematics: { short: "Mathematics", bg: "bg-tangerine-400", soft: "bg-tangerine-100", text: "text-tangerine-700", ring: "ring-tangerine-300", tagline: "Numbers, shapes, money and measuring" },
  "basic-science": { short: "Basic Science", bg: "bg-lime-400", soft: "bg-lime-100", text: "text-lime-600", ring: "ring-lime-300", tagline: "Living things, our body and the world around us" },
};

export const otherSubjectLook: SubjectLook = { short: "Subject", bg: "bg-grape-400", soft: "bg-grape-100", text: "text-grape-700", ring: "ring-grape-300", tagline: "" };

export function lookForSubject(code: string | null | undefined): SubjectLook {
  return (code && subjectLook[code as CoreSubject]) || otherSubjectLook;
}

export const TERM_NAMES = ["", "First term", "Second term", "Third term"] as const;

/** Nigerian school terms: September to December, January to April, May to August. */
export function currentTerm(date = new Date()): 1 | 2 | 3 {
  const month = Number(new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", month: "numeric" }).format(date));
  return month >= 9 ? 1 : month <= 4 ? 2 : 3;
}

/** "Week 3" or "Weeks 3–4". */
export function weekLabel(start: number | null | undefined, end: number | null | undefined) {
  if (!start) return null;
  return end && end > start ? `Weeks ${start}–${end}` : `Week ${start}`;
}

/** The weeks of a term that are not topics: they appear in every scheme of work. */
export const FIXED_WEEKS: { week: number; label: string; at: "start" | "end" }[] = [
  { week: 1, label: "Resumption, and revision of last term's work", at: "start" },
  { week: 11, label: "Revision of the term's work", at: "end" },
  { week: 12, label: "Examination", at: "end" },
];
