import Link from "next/link";
import clsx from "clsx";
import { Award, BookOpen, ChartColumn, ClipboardCheck, Library, NotebookPen, UserRound, Video } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { CopyButton } from "@/components/app/CopyButton";
import { Field, Input } from "@/components/ui/Field";
import { joinClassroom, regenerateLinkCode } from "../actions";

export const metadata = { title: "More" };

const tiles = [
  { href: "/student/assignments", label: "Homework", icon: NotebookPen, tone: "bg-tangerine-100 text-tangerine-700" },
  { href: "/student/exams", label: "Tests", icon: ClipboardCheck, tone: "bg-sky-100 text-sky-600" },
  { href: "/student/results", label: "My results", icon: ChartColumn, tone: "bg-lime-100 text-lime-600" },
  { href: "/student/achievements", label: "Badges", icon: Award, tone: "bg-sun-100 text-sun-600" },
  { href: "/student/courses", label: "Courses", icon: BookOpen, tone: "bg-bubble-100 text-bubble-600" },
  { href: "/student/library", label: "Library", icon: Library, tone: "bg-grape-100 text-grape-700" },
  { href: "/student/live", label: "Live classes", icon: Video, tone: "bg-coral-100 text-coral-700" },
  { href: "/student/profile", label: "My profile", icon: UserRound, tone: "bg-wash text-ink-soft" },
];

/** Everything that isn't in the bottom menu, as big tiles, plus joining a classroom and linking a parent. */
export default async function MorePage() {
  const { userId } = await requireRole("student");
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("link_code").eq("profile_id", userId).single();
  return (
    <div className="grid gap-7">
      <h1 className="text-3xl font-semibold sm:text-4xl">More</h1>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(({ href, label, icon: Icon, tone }) => (
          <li key={href}>
            <Link href={href} className="flex h-full flex-col items-start gap-3 rounded-[1.4rem] border-2 border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-[3px_4px_0_var(--color-ink)]">
              <span className={clsx("grid size-12 place-items-center rounded-2xl", tone)}><Icon className="size-6" aria-hidden="true" /></span>
              <span className="font-display text-lg font-semibold">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Join a classroom">
          <ActionForm action={joinClassroom} submitLabel="Join classroom" pendingLabel="Joining">
            <Field label="Class code from your teacher" htmlFor="code"><Input id="code" name="code" maxLength={12} autoComplete="off" className="uppercase tracking-[0.25em]" placeholder="K7M2QX" /></Field>
          </ActionForm>
        </Panel>
        <Panel title="Link a parent or guardian">
          <p className="text-sm text-muted">Give this code to your parent or guardian. They enter it on their dashboard to follow your progress.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="rounded-xl bg-wash px-4 py-2 font-display text-2xl font-bold tracking-[0.2em] text-grape-800">{me?.link_code}</p>
            {me?.link_code && <CopyButton value={me.link_code} />}
          </div>
          <ActionForm action={regenerateLinkCode} submitLabel="Make a new code" pendingLabel="Making a new code" variant="outline" className="mt-4" resetOnSuccess={false}>
            <p className="text-xs text-muted">A new code stops the old one from working. Parents already linked stay linked.</p>
          </ActionForm>
        </Panel>
      </div>
    </div>
  );
}
