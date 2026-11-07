import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Flame, Lock, Star } from "lucide-react";
import { requireRole, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { greeting } from "@/lib/format";
import { subjectsForClass } from "@/lib/curriculum";
import { TERM_NAMES, currentTerm, lookForSubject } from "@/config/subjects";
import { photos } from "@/config/photos";
import { SubjectArt } from "@/components/brand/SubjectArt";
import { PromoCarousel, type Promo } from "@/components/app/PromoCarousel";

export const metadata = { title: "My subjects" };

const promos: Promo[] = [
  { title: "Unlock every lesson", text: "Go Premium for all videos, notes and quizzes in your class.", href: "/pricing", cta: "See plans", tone: "grape", art: { kind: "tiko", prop: "star" } },
  { title: "Is your school on AfriLearn?", text: "Schools across Nigeria are learning with us. Ask your teacher to join.", href: "/teachers", cta: "For schools", tone: "tangerine", art: { kind: "photo", src: photos.classGroup.src, alt: photos.classGroup.alt } },
  { title: "New lessons every week", text: "Watch, read the notes, then win stars in the quiz.", href: "/student/videos", cta: "Watch now", tone: "sky", art: { kind: "photo", src: photos.laptopGirl.src, alt: photos.laptopGirl.alt } },
];

/**
 * The pupil home: a sliding banner, then just the subjects. Tap a subject to see this term's topics,
 * tap a topic to watch, read and play the quiz. Everything else lives in the bottom menu.
 */
export default async function StudentHome() {
  const { profile, userId } = await requireRole("student");
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("points, streak_days, class_id, classes(name)").eq("profile_id", userId).single();
  const klass = me?.classes as unknown as { name: string } | null;
  const term = currentTerm();
  const subjects = me?.class_id ? await subjectsForClass(me.class_id, userId) : [];
  const termTopics = subjects.flatMap((s) => s.topics.filter((t) => t.term === term).map((t) => ({ ...t, subject: s })));
  const { data: doneRows } = termTopics.length
    ? await supabase.from("topic_progress").select("topic_id").eq("student_id", userId).not("completed_at", "is", null).in("topic_id", termTopics.map((t) => t.id))
    : { data: [] };
  const done = new Set((doneRows ?? []).map((r) => r.topic_id as string));
  const next = termTopics.find((t) => !done.has(t.id) && t.subject.code === "mathematics") ?? termTopics.find((t) => !done.has(t.id));

  return (
    <div className="grid gap-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-grape-700">{greeting()},</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{firstName(profile.full_name)}</h1>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sun-100 px-3 py-1.5 font-display text-sm font-semibold text-ink"><Star className="size-4 fill-sun-400 text-sun-600" aria-hidden="true" />{me?.points ?? 0} stars</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tangerine-100 px-3 py-1.5 font-display text-sm font-semibold text-ink"><Flame className="size-4 text-tangerine-600" aria-hidden="true" />{me?.streak_days ?? 0} days</span>
        </div>
      </div>

      <PromoCarousel slides={promos} />

      <section aria-labelledby="subjects-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="subjects-title" className="text-2xl font-semibold">My subjects</h2>
          <p className="text-sm font-semibold text-muted">{klass?.name ?? "No class yet"} · {TERM_NAMES[term]}</p>
        </div>
        {subjects.length === 0 ? (
          <p className="mt-4 rounded-[1.4rem] bg-wash p-5 text-ink-soft">Your class hasn&apos;t been set yet. Ask your parent or teacher to choose your class in your profile.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {subjects.map((s) => {
              const look = lookForSubject(s.code);
              const total = s.topics.length;
              const ready = total > 0;
              const pctDone = total ? Math.round((s.done / total) * 100) : 0;
              const body = (
                <>
                  <span className={clsx("relative grid h-32 place-items-center rounded-[1.4rem] border-2 border-ink sm:h-36", look.bg)}>
                    <SubjectArt code={s.code} className="h-24 w-auto sm:h-28" />
                    {!ready && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink"><Lock className="size-3.5" aria-hidden="true" />Soon</span>}
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-2">
                    <span className="font-display text-2xl font-semibold">{look.short}</span>
                    {ready && <ArrowRight className="size-5 text-grape-600 transition-transform group-hover:translate-x-1" aria-hidden="true" />}
                  </span>
                  {ready ? (
                    <>
                      <span className="mt-1 block text-sm text-muted">{s.topics.filter((t) => t.term === term).length} topics this term · {total} this year</span>
                      <span className="mt-3 flex items-center gap-2">
                        <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-wash"><span className={clsx("block h-full rounded-full", look.bg)} style={{ width: `${Math.max(pctDone, 3)}%` }} /></span>
                        <span className="text-xs font-bold tabular text-ink-soft">{s.done}/{total}</span>
                      </span>
                    </>
                  ) : <span className="mt-1 block text-sm text-muted">Topics are on their way.</span>}
                </>
              );
              return (
                <li key={s.id}>
                  {ready ? (
                    <Link href={`/student/subject/${s.code}`} className="group block rounded-[1.75rem] border-2 border-line bg-white p-3 pb-4 transition hover:-translate-y-1 hover:border-ink hover:shadow-[4px_5px_0_var(--color-ink)]">{body}</Link>
                  ) : (
                    <div className="block rounded-[1.75rem] border-2 border-dashed border-line bg-white/70 p-3 pb-4 opacity-80">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {next && (
        <section aria-labelledby="next-title" className="rounded-[1.75rem] border-2 border-ink bg-sun-100 p-5 shadow-[4px_5px_0_var(--color-ink)] sm:p-6">
          <p id="next-title" className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-sun-600">Up next in {lookForSubject(next.subject.code).short}</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-2xl font-semibold">{next.title}</p>
            <Link href={`/student/t/${next.code}`} className="inline-flex h-12 items-center gap-2 rounded-full bg-grape-600 px-6 font-display font-semibold text-white shadow-[0_4px_0_var(--color-grape-900)] transition-transform hover:-translate-y-px">
              Start lesson<ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[1.75rem] bg-grape-900 text-white">
        <div className="grid items-center sm:grid-cols-[1fr_1.1fr]">
          <div className="relative z-10 p-6 sm:p-8">
            <p className="font-display text-2xl font-semibold leading-tight sm:text-3xl">Learn anywhere, any time.</p>
            <p className="mt-2 text-grape-100">Short videos, clear notes and fun quizzes, made for Nigerian classrooms.</p>
          </div>
          <div className="relative h-52 sm:h-64">
            <Image src={photos.headphones.src} alt={photos.headphones.alt} fill sizes="(min-width: 640px) 520px, 100vw" className="object-cover object-[50%_30%]" />
            <span aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-grape-900 sm:block" />
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-grape-900 sm:hidden" />
          </div>
        </div>
      </section>
    </div>
  );
}
