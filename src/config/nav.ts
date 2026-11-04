import type { Role } from "@/config/brand";

export type IconName =
  | "home" | "classes" | "book" | "assignment" | "exam" | "results" | "library" | "spark" | "award" | "user"
  | "users" | "bank" | "grade" | "video" | "calendar" | "child" | "message" | "settings" | "shield" | "chart"
  | "subjects" | "money" | "flag" | "log" | "play" | "quiz";

export type NavItem = { href: string; label: string; icon: IconName };

/** Only pages that exist are listed, so every link in the sidebar works. */
export const navByRole: Record<Role, NavItem[]> = {
  student: [
    { href: "/student", label: "My day", icon: "home" },
    { href: "/student/videos", label: "Class videos", icon: "play" },
    { href: "/student/courses", label: "Courses", icon: "book" },
    { href: "/student/assignments", label: "Assignments", icon: "assignment" },
    { href: "/student/exams", label: "Tests", icon: "exam" },
    { href: "/student/cbt", label: "Practice quizzes", icon: "quiz" },
    { href: "/student/results", label: "Results", icon: "results" },
    { href: "/student/live", label: "Live classes", icon: "video" },
    { href: "/student/companion", label: "Ask Tiko", icon: "spark" },
    { href: "/student/library", label: "Library", icon: "library" },
    { href: "/student/achievements", label: "Achievements", icon: "award" },
    { href: "/student/profile", label: "Profile", icon: "user" },
  ],
  teacher: [
    { href: "/teacher", label: "Overview", icon: "home" },
    { href: "/teacher/videos", label: "Class videos", icon: "play" },
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
    { href: "/parent/videos", label: "Class videos", icon: "play" },
    { href: "/parent/messages", label: "Messages", icon: "message" },
    { href: "/billing", label: "Plans and billing", icon: "money" },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: "home" },
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/academics", label: "Classes and subjects", icon: "subjects" },
    { href: "/admin/videos", label: "Class videos", icon: "play" },
    { href: "/admin/content", label: "Content", icon: "shield" },
    { href: "/admin/activity", label: "Activity and payments", icon: "log" },
    { href: "/admin/settings", label: "Settings", icon: "settings" },
  ],
};
