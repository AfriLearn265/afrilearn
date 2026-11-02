/**
 * Brand settings. Change the name, tagline or contact details here and
 * they update across the whole app (logo text, page titles, emails copy).
 */
export const brand = {
  name: "AfriLearn",
  tagline: "Learning Without Limits.",
  description:
    "Nursery to SS3, WAEC, NECO and JAMB preparation in one place, with real teachers, live classes, CBT practice and progress parents can follow.",
  supportEmail: "support@afrilearn.ng",
  country: "Nigeria",
} as const;

export type Role = "student" | "teacher" | "parent" | "admin";

export const roleHome: Record<Role, string> = {
  student: "/student",
  teacher: "/teacher",
  parent: "/parent",
  admin: "/admin",
};

export const roleLabel: Record<Role, string> = {
  student: "Student",
  teacher: "Teacher",
  parent: "Parent or guardian",
  admin: "Administrator",
};
