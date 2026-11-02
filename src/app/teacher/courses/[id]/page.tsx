import { redirect } from "next/navigation";

// The full course builder ships in the next push; until then return to the list.
export default function CourseBuilderPlaceholder() {
  redirect("/teacher/courses");
}
