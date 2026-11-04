import { permanentRedirect } from "next/navigation";

// This edition is for Primary 1 to 6 only. Common Entrance practice lives with Primary 6.
export default function ExamPrepPage() {
  permanentRedirect("/classes#p6");
}
