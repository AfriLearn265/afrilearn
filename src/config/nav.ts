import type { Role } from "@/config/brand";

export type IconName =
  | "home" | "classes" | "book" | "assignment" | "exam" | "results" | "library" | "spark" | "award" | "user"
  | "users" | "bank" | "grade" | "video" | "calendar" | "child" | "message" | "settings" | "shield" | "chart"
  | "subjects" | "money" | "flag" | "log";

export type NavItem = { href: string; label: string; icon: IconName };

/** Only pages that exist are listed, so every link in the sidebar works. */
export const navByRole: Record<Role, NavItem[]> = {
  student: [
    { href: "/student", label: "Overview", icon: "home" },
    { href: "/student/exams", label: "Tests", icon: "exam" },
    { href: "/student/cbt", label: "CBT Centre", icon: "spark" },
    { href: "/student/results", label: "Results", icon: "results" },
  ],
  teacher: [
    { href: "/teacher", label: "Overview", icon: "home" },
    { href: "/teacher/questions", label: "Question banks", icon: "bank" },
    { href: "/teacher/exams", label: "Examinations", icon: "exam" },
  ],
  parent: [
    { href: "/parent", label: "Overview", icon: "home" },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: "home" },
  ],
};
