import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, CircleCheck, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TOPIC_FIELDS, type TopicRow } from "@/lib/curriculum";
import { VIDEO_FIELDS, formatDuration, playbackFor, withMedia, type ClassVideo } from "@/lib/videos";
import { TERM_NAMES, lookForSubject } from "@/config/subjects";
import { TopicTabs } from "@/components/app/TopicTabs";
import { TopicQuiz, type QuizQuestion } from "@/components/app/TopicQuiz";
import { VideoPlayer } from "@/components/app/VideoPlayer";
import { Markdown } from "@/components/app/Markdown";
import { Mascot } from "@/components/brand/Mascot";
import { markTopicDone } from "../../topic-actions";

export const metadata = { title: "Lesson" };

/**
 * One topic: watch the video, read the notes, then play the quiz. The address is a short random code,
 * so it never spells out the class, subject or topic, and the video itself never appears as a plain link.
 */
export default async function TopicPage({ params }: { params: Promise<{ code: string }> }) {
  const { userId, profile } = await requireRole("student");
  const { code } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase.from("curriculum_topics").select(`${TOPIC_FIELDS}, notes, subjects(code, name)`).eq("code", code).maybeSingle();
  if (!row) notFound();
  const topic = row as unknown as TopicRow & { notes: string | null; subjects: { code: string; name: string } | null };
  const subjectCode = topic.subjects?.code ?? "";
  const look = lookForSubject(subjectCode);

  const [{ data: vids }, { data: qs }, { data: progress }, { data: siblings }] = await Promise.all([
    supabase.from("class_videos").select(VIDEO_FIELDS).eq("topic_id", topic.id).eq("is_published", true).order("created_at"),
    supabase.from("topic_questions").select("id, prompt, options, sort_order").eq("topic_id", topic.id).order("sort_order"),
    supabase.from("topic_progress").select("completed_at, best_percent").eq("student_id", userId).eq("topic_id", topic.id).maybeSingle(),
    supabase.from("curriculum_topics").select("code, title, term, sort_order").eq("class_id", topic.class_id).eq("subject_id", topic.subject_id)
      .eq("is_published", true).order("term").order("sort_order"),
  ]);
  const videos = await withMedia((vids ?? []) as unknown as ClassVideo[], { video: true });
  const main = videos[0];
  const playback = main ? await playbackFor(main, profile.full_name) : null;
  const list = siblings ?? [];
  const at = list.findIndex((s) => s.code === topic.code);
  const prev = at > 0 ? list[at - 1] : null;
  const next = at >= 0 && at < list.length - 1 ? list[at + 1] : null;
  const done = !!progress?.completed_at;
  const questions = (qs ?? []) as QuizQuestion[];

  const videoPanel = main && playback ? (
    <div className="grid gap-4">
      <VideoPlayer id={main.id} title={main.title} playback={playback} poster={main.posterUrl} watermark={profile.full_name} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span className="font-display text-lg font-semibold text-ink">{main.title}</span>
        {formatDuration(main.duration_seconds) && <span className="inline-flex items-center gap-1"><Clock className="size-4" aria-hidden="true" />{formatDuration(main.duration_seconds)}</span>}
      </div>
      {videos.length > 1 && (
        <p className="text-sm text-muted">More videos on this topic: {videos.slice(1).map((v, i) => (
          <Link key={v.id} href={`/student/videos/${v.id}`} className="font-semibold text-grape-700 hover:underline">{i ? ", " : ""}{v.title}</Link>
        ))}</p>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 rounded-[1.6rem] bg-wash p-8 text-center sm:flex-row sm:text-left">
      <Mascot pose="wave" prop="book" className="w-28 shrink-0" />
      <div>
        <p className="font-display text-xl font-semibold">The video for this topic is coming soon.</p>
        <p className="mt-1 text-ink-soft">Start with the notes, then try the quiz.</p>
      </div>
    </div>
  );

  const notesPanel = topic.notes ? (
    <article className="rounded-[1.6rem] border-2 border-line bg-white p-5 sm:p-7"><Markdown source={topic.notes} /></article>
  ) : (
    <p className="rounded-[1.4rem] bg-wash p-6 text-center text-ink-soft">Notes for this topic are on their way.</p>
  );

  return (
    <div className="grid gap-6">
      <Link href={`/student/subject/${subjectCode}${topic.term ? `?term=${topic.term}` : ""}`} className="inline-flex items-center gap-1 justify-self-start font-display font-semibold text-grape-700 hover:underline">
        <ChevronLeft className="size-4" aria-hidden="true" />{look.short === "Subject" ? topic.subjects?.name : look.short} · {TERM_NAMES[topic.term]}
      </Link>

      <header className={clsx("rounded-[1.75rem] p-5 sm:p-6", look.soft)}>
        {topic.theme && <p className={clsx("text-xs font-bold uppercase tracking-[0.12em]", look.text)}>{topic.theme}{topic.sub_theme && topic.sub_theme !== topic.theme ? ` · ${topic.sub_theme}` : ""}</p>}
        <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{topic.title}</h1>
        {topic.summary && <p className="mt-2 max-w-2xl text-ink-soft">{topic.summary}</p>}
        {done && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-leaf-500 px-3 py-1 text-sm font-semibold text-white"><CircleCheck className="size-4" aria-hidden="true" />Done{progress?.best_percent != null ? ` · best quiz ${progress.best_percent}%` : ""}</p>}
      </header>

      <TopicTabs video={videoPanel} notes={notesPanel} quiz={<TopicQuiz topicId={topic.id} questions={questions} />} initial={main ? "video" : "notes"} />

      {!done && questions.length === 0 && (
        <form action={markTopicDone.bind(null, topic.id)}>
          <button className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-lime-400 px-6 font-display font-semibold shadow-[0_4px_0_var(--color-ink)] transition-transform hover:-translate-y-px">
            <CircleCheck className="size-5" aria-hidden="true" />I&apos;ve finished this topic
          </button>
        </form>
      )}

      <nav aria-label="Other topics" className="grid gap-3 border-t-2 border-line pt-5 sm:grid-cols-2">
        {prev ? (
          <Link href={`/student/t/${prev.code}`} className="group rounded-[1.4rem] border-2 border-line bg-white p-4 hover:border-grape-300">
            <span className="flex items-center gap-1 text-sm font-semibold text-muted"><ChevronLeft className="size-4" aria-hidden="true" />Previous</span>
            <span className="mt-1 block font-display font-semibold">{prev.title}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/student/t/${next.code}`} className="group rounded-[1.4rem] border-2 border-line bg-white p-4 text-right hover:border-grape-300">
            <span className="flex items-center justify-end gap-1 text-sm font-semibold text-muted">Next<ChevronRight className="size-4" aria-hidden="true" /></span>
            <span className="mt-1 block font-display font-semibold">{next.title}</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
