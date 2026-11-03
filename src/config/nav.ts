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
    { href: "/student/courses", label: "Courses", icon: "book" },
    { href: "/student/assignments", label: "Assignments", icon: "assignment" },
    { href: "/student/exams", label: "Tests", icon: "exam" },
    { href: "/student/cbt", label: "CBT Centre", icon: "chart" },
    { href: "/student/results", label: "Results", icon: "results" },
    { href: "/student/live", label: "Live classes", icon: "video" },
    { href: "/student/companion", label: "Learning companion", icon: "spark" },
    { href: "/student/library", label: "Library", icon: "library" },
    { href: "/student/achievements", label: "Achievements", icon: "award" },
    { href: "/student/profile", label: "Profile", icon: "user" },
  ],
  teacher: [
    { href: "/teacher", label: "Overview", icon: "home" },
    { href: "/teacher/courses", label: "Courses", icon: "book" },
    { href: "/teacher/assignments", label: "Assignments", icon: "assignment" },
    { href: "/teacher/questions", label: "Question banks", icon: "bank" },
    { href: "/teacher/exams", label: "Examinations", icon: "exam" },
    { href: "/teacher/gradebook", label: "Gradebook", icon: "grade" },
    { href: "/teacher/live", label: "Live classes", icon: "video" },
    { href: "/teacher/messages", label: "Messages", icon: "message" },
    { href: "/teacher/library", label: "Library", icon: "library" },
    { href: "/teacher/profile", label: "My profile", icon: "user" },
  ],
  parent: [
    { href: "/parent", label: "My children", icon: "child" },
    { href: "/parent/messages", label: "Messages", icon: "message" },
    { href: "/billing", label: "Plans and billing", icon: "money" },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: "home" },
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/academics", label: "Classes and subjects", icon: "subjects" },
    { href: "/admin/content", label: "Content", icon: "shield" },
    { href: "/admin/activity", label: "Activity and payments", icon: "log" },
    { href: "/admin/settings", label: "Settings", icon: "settings" },
  ],
};
