/** How each Primary class looks and what it is about, used on the public site and dashboards. */
export type ClassLook = { bg: string; soft: string; text: string; age: string; about: string };

export const classLook: Record<string, ClassLook> = {
  P1: { bg: "bg-tangerine-400", soft: "bg-tangerine-100", text: "text-tangerine-700", age: "About age 6", about: "Letters, sounds and counting to 100" },
  P2: { bg: "bg-sun-400", soft: "bg-sun-100", text: "text-sun-600", age: "About age 7", about: "Reading stories, money and telling the time" },
  P3: { bg: "bg-lime-400", soft: "bg-lime-100", text: "text-lime-600", age: "About age 8", about: "Times tables, plants and how things grow" },
  P4: { bg: "bg-sky-400", soft: "bg-sky-100", text: "text-sky-600", age: "About age 9", about: "Fractions, grammar and our country, Nigeria" },
  P5: { bg: "bg-bubble-400", soft: "bg-bubble-100", text: "text-bubble-600", age: "About age 10", about: "Decimals, science projects and creative writing" },
  P6: { bg: "bg-grape-400", soft: "bg-grape-100", text: "text-grape-700", age: "About age 11", about: "Common Entrance practice and big ideas" },
};

export const fallbackLook: ClassLook = classLook.P6;

export function lookFor(code: string | null | undefined): ClassLook {
  return (code && classLook[code]) || fallbackLook;
}

/** "Primary 5" -> "5", for the big class numbers. */
export function classNumber(name: string) {
  return name.match(/\d+/)?.[0] ?? name.slice(0, 1);
}
