import Link from "next/link";
import clsx from "clsx";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, BookOpen, CircleCheck, Download, Eye, GraduationCap, Megaphone,
  MonitorPlay, Puzzle, Star, UserPlus, Users,
} from "lucide-react";
import { greeting, timeAgo } from "@/lib/format";
import { formatNaira } from "@/lib/catalogue";
import { Panel } from "@/components/app/AppShell";
import { ActivityChart, Sparkline, type DailyPoint } from "@/components/app/InsightCharts";
import { TeacherReview, type Application } from "@/app/admin/TeacherReview";
import { classNumber, lookFor } from "@/config/classLook";
import { TERM_NAMES, lookForSubject } from "@/config/subjects";
import { SubjectArt } from "@/components/brand/SubjectArt";
import { Mascot } from "@/components/brand/Mascot";

export type Insights = {
  days: number; term: 1 | 2 | 3;
  kpis: {
    signups: number; signups_prev: number; active: number; active_prev: number; videos: number; videos_prev: number;
    quizzes: number; quizzes_prev: number; revenue: number; revenue_prev: number; pupils: number; parents: number; teachers: number;
    rating: number | null; ratings: number;
  };
  daily: DailyPoint[];
  classes: { code: string; name: string; pupils: number; active: number; teachers: number; term_topics: number; term_done: number }[];
  coverage: { class_code: string; class_name: string; subject_code: string; subject_name: string; topics: number; with_video: number; with_notes: number; with_quiz: number }[];
  top_lessons: { code: string; title: string; class_name: string; subject_code: string; views: number; plays: number; stars: number | null }[];
  weak_lessons: { code: string; title: string; class_name: string; subject_code: string; avg_score: number; attempts: number; stars: number | null }[];
  top_pupils: { full_name: string; class_name: string | null; points: number; actions: number }[];
  teachers: { full_name: string; videos: number; videos_recent: number; views: number; classrooms: number; last_seen_at: string | null }[];
  attention: {
    teachers_pending: number; reports_open: number; videos_hidden: number; videos_unlinked: number;
    term_topics_no_video: number; term_topics_no_notes: number; pupils_no_class: number; classes_no_teacher: number;
  };
};
export type Activity = { id: number; action: string; created_at: string; actor: { full_name: string; role: string } | null };

export const RANGES = [7, 30, 90] as const;
const actionLabel: Record<string, string> = {
  "account.created": "created an account", "classroom.joined": "joined a classroom", "exam.started": "started a test",
  "exam.submitted": "submitted a test", "exam.answer_graded": "marked a theory answer", "assignment.submitted": "handed in an assignment",
  "assignment.graded": "graded an assignment", "parent.linked_child": "linked a child", "teacher.approved": "approved a teacher",
  "teacher.rejected": "declined a teacher application", "notification.broadcast": "sent an announcement",
  "user.role_changed": "changed a user's role", "user.status_changed": "changed a user's status",
};
const nf = new Intl.NumberFormat("en-NG");

/** Everything the control room shows, kept apart from the data loading so it can be previewed on its own. */
export function AdminDashboard({ insights: d, days, name, apps, activity }: {
  insights: Insights; days: number; name: string; apps: Application[]; activity: Activity[];
}) {
  const k = d.kpis;
  const a = d.attention;
  const todo = [
    { n: a.teachers_pending, text: "teacher applications to review", href: "#applications" },
    { n: a.reports_open, text: "reports from users to check", href: "/admin/content" },
    { n: a.term_topics_no_video, text: `${TERM_NAMES[d.term].toLowerCase()} topics without a video`, href: "/admin/curriculum" },
    { n: a.term_topics_no_notes, text: `${TERM_NAMES[d.term].toLowerCase()} topics without notes`, href: "/admin/curriculum" },
    { n: a.videos_unlinked, text: "videos not linked to a topic", href: "/admin/videos" },
    { n: a.videos_hidden, text: "hidden videos", href: "/admin/videos" },
    { n: a.pupils_no_class, text: "pupils without a class", href: "/admin/users?role=student" },
    { n: a.classes_no_teacher, text: "classes with pupils but no teacher", href: "/admin/academics" },
  ].filter((t) => Number(t.n) > 0);
  const subjectsInGrid = ["english", "mathematics", "basic-science"];
  const classRows = d.classes;

  return (
    <>
      <section className="relative isolate mb-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(150deg,var(--color-grape-950),var(--color-grape-700))] p-6 text-white sm:p-8">
        <span aria-hidden="true" className="absolute -right-16 -top-24 -z-10 size-80 rounded-full bg-bubble-400/25 blur-3xl" />
        <div className="grid items-center gap-5 md:grid-cols-[1fr_auto]">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-sun-300">Control room · {TERM_NAMES[d.term]}</p>
            <h1 className="mt-1 text-[2.1rem] font-semibold leading-[1.05] sm:text-5xl">{greeting()}, {name}!</h1>
            <p className="mt-2 max-w-xl text-grape-100">{nf.format(k.pupils)} pupils, {nf.format(k.parents)} parents and {nf.format(k.teachers)} teachers on the platform.</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <nav aria-label="Period" className="inline-flex rounded-full bg-white/10 p-1">
                {RANGES.map((r) => (
                  <Link key={r} href={r === 30 ? "/admin" : `/admin?range=${r}`} aria-current={r === days ? "page" : undefined}
                    className={clsx("rounded-full px-4 py-1.5 font-display text-sm font-semibold", r === days ? "bg-white text-grape-800" : "text-grape-100 hover:text-white")}>
                    {r} days
                  </Link>
                ))}
              </nav>
              <a href={`/admin/report?range=${days}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-white/30 px-4 font-display text-sm font-semibold hover:border-white hover:bg-white/10">
                <Download className="size-4" aria-hidden="true" />Download report
              </a>
            </div>
          </div>
          <Mascot pose="stand" prop="cap" className="hidden w-40 md:block" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={UserPlus} label="New accounts" value={k.signups} prev={k.signups_prev} days={days} spark={d.daily.map((x) => x.signups)} color="#18A058" />
        <Kpi icon={Users} label="Active pupils" value={k.active} prev={k.active_prev} days={days} note={`of ${nf.format(k.pupils)} pupils`} />
        <Kpi icon={MonitorPlay} label="Videos watched" value={k.videos} prev={k.videos_prev} days={days} spark={d.daily.map((x) => x.videos)} color="#5A2AD9" />
        <Kpi icon={Puzzle} label="Quizzes taken" value={k.quizzes} prev={k.quizzes_prev} days={days} spark={d.daily.map((x) => x.quizzes)} color="#FF7A1A" />
        <Kpi icon={GraduationCap} label="Revenue" value={k.revenue} prev={k.revenue_prev} days={days} money />
        <Kpi icon={Star} label="Lesson rating" display={k.rating != null ? `${k.rating}★` : "–"} note={k.ratings ? `from ${nf.format(k.ratings)} ratings` : "No ratings yet"} />
      </div>

      {apps.length > 0 && (
        <Panel title={`Teacher applications waiting for you (${apps.length})`} className="mt-6 scroll-mt-24 border-sun-400">
          <div id="applications" className="grid gap-4">{apps.map((app) => <TeacherReview key={app.id} app={app} />)}</div>
        </Panel>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel title={`Learning activity, last ${days} days`}>
          <ActivityChart data={d.daily} />
        </Panel>
        <Panel title="To do">
          {todo.length === 0 ? (
            <p className="flex items-center gap-2 font-semibold text-leaf-700"><CircleCheck className="size-5" aria-hidden="true" />All clear. Nothing needs you right now.</p>
          ) : (
            <ul className="grid gap-2">
              {todo.map((t) => (
                <li key={t.text}>
                  <Link href={t.href} className="flex items-center gap-3 rounded-2xl bg-wash px-3 py-2.5 hover:bg-grape-100">
                    <span className="grid h-8 min-w-8 place-items-center rounded-full bg-white px-2 font-display font-semibold tabular text-grape-700">{nf.format(t.n)}</span>
                    <span className="text-sm font-semibold">{t.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 grid grid-cols-2 gap-2 border-t-2 border-line pt-4">
            {[
              { href: "/admin/pupils", label: "Add pupils", icon: UserPlus },
              { href: "/admin/videos", label: "Add a video", icon: MonitorPlay },
              { href: "/admin/curriculum", label: "Topics and notes", icon: BookOpen },
              { href: "/admin/settings", label: "Send a notice", icon: Megaphone },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-2 rounded-2xl border-2 border-line px-3 py-2.5 text-sm font-semibold hover:border-grape-300 hover:bg-grape-50">
                <Icon className="size-4 text-grape-600" aria-hidden="true" />{label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <section aria-labelledby="ready-title" className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="ready-title" className="text-2xl font-semibold sm:text-3xl">Content readiness</h2>
            <p className="mt-1 text-sm text-muted">How many of each class&apos;s topics have a video, notes and a quiz. Tap a box to fill the gaps.</p>
          </div>
          <Legend />
        </div>
        <div className="overflow-x-auto rounded-[1.6rem] border-2 border-line bg-white">
          <table className="w-full min-w-[38rem] text-left sm:min-w-[46rem]">
            <thead>
              <tr className="border-b-2 border-line">
                <th scope="col" className="px-4 py-3 font-display text-sm font-semibold text-muted">Class</th>
                {subjectsInGrid.map((code) => (
                  <th key={code} scope="col" className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-display font-semibold">
                      <span className={clsx("grid size-7 place-items-center rounded-full", lookForSubject(code).bg)}><SubjectArt code={code} className="h-4 w-auto" /></span>
                      {lookForSubject(code).short}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-line">
              {classRows.map((c) => (
                <tr key={c.code}>
                  <th scope="row" className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span className={clsx("grid size-10 place-items-center rounded-xl font-display text-xl font-semibold", lookFor(c.code).bg)}>{classNumber(c.name)}</span>
                      <span className="hidden font-display font-semibold sm:inline">{c.name}</span>
                    </span>
                  </th>
                  {subjectsInGrid.map((code) => {
                    const cell = d.coverage.find((x) => x.class_code === c.code && x.subject_code === code);
                    const n = Number(cell?.topics ?? 0);
                    return (
                      <td key={code} className="px-4 py-3 align-middle">
                        {n === 0 ? (
                          <Link href={`/admin/curriculum?class=${c.code}&subject=${code}`} className="text-sm font-semibold text-muted hover:text-grape-700">No topics yet · add</Link>
                        ) : (
                          <Link href={`/admin/curriculum?class=${c.code}&subject=${code}`} className="group grid gap-1.5 rounded-xl p-1 hover:bg-wash">
                            <span className="text-xs font-semibold text-muted">{n} topics</span>
                            <Bar label="Video" value={Number(cell?.with_video)} total={n} tone="bg-grape-500" />
                            <Bar label="Notes" value={Number(cell?.with_notes)} total={n} tone="bg-sky-400" />
                            <Bar label="Quiz" value={Number(cell?.with_quiz)} total={n} tone="bg-tangerine-400" />
                          </Link>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="classes-title" className="mt-8">
        <h2 id="classes-title" className="mb-4 text-2xl font-semibold sm:text-3xl">Classes this term</h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classRows.map((c) => {
            const look = lookFor(c.code);
            const pupils = Number(c.pupils);
            const possible = pupils * Number(c.term_topics);
            const progress = possible ? Math.round((Number(c.term_done) / possible) * 100) : 0;
            const warnings = [pupils > 0 && Number(c.teachers) === 0 && "Needs a teacher", pupils === 0 && "No pupils yet"].filter(Boolean) as string[];
            return (
              <li key={c.code} className="overflow-hidden rounded-[1.6rem] border-2 border-line bg-white">
                <div className={clsx("flex items-center gap-3 px-5 py-3", look.bg)}>
                  <span className="font-display text-4xl font-semibold leading-none">{classNumber(c.name)}</span>
                  <span className="font-display text-lg font-semibold">{c.name}</span>
                  <Link href={`/scheme-of-work?class=${c.code}&term=${d.term}`} className="ml-auto rounded-full bg-white/80 px-3 py-1 text-xs font-bold hover:bg-white">Scheme</Link>
                </div>
                <dl className="grid grid-cols-3 gap-2 px-5 pt-4 text-center">
                  <div><dt className="text-xs text-muted">Pupils</dt><dd className="font-display text-2xl font-semibold tabular">{pupils}</dd></div>
                  <div><dt className="text-xs text-muted">Active</dt><dd className="font-display text-2xl font-semibold tabular">{Number(c.active)}</dd></div>
                  <div><dt className="text-xs text-muted">Teachers</dt><dd className="font-display text-2xl font-semibold tabular">{Number(c.teachers)}</dd></div>
                </dl>
                <div className="px-5 pb-4 pt-3">
                  <div className="flex justify-between text-xs font-semibold text-muted"><span>Term topics finished</span><span className="tabular">{progress}%</span></div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-wash"><div className={clsx("h-full rounded-full", look.bg)} style={{ width: `${Math.max(progress, 2)}%` }} /></div>
                  <p className="mt-1.5 text-xs text-muted">{Number(c.term_topics)} topics this term</p>
                </div>
                {warnings.length > 0 && (
                  <p className="flex items-center gap-2 border-t-2 border-line bg-sun-100 px-5 py-2.5 text-sm font-semibold text-ink-soft">
                    <AlertTriangle className="size-4 text-tangerine-700" aria-hidden="true" />{warnings.join(", ")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Panel title="Most popular lessons">
          {d.top_lessons.length === 0 ? <p className="text-sm text-muted">No lessons watched yet.</p> : (
            <ol className="grid gap-3">
              {d.top_lessons.map((l, i) => (
                <li key={l.code} className="flex items-center gap-3 text-sm">
                  <span className={clsx("grid size-8 shrink-0 place-items-center rounded-full font-display font-semibold", lookForSubject(l.subject_code).bg)}>{i + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{l.title}</span><span className="text-xs text-muted">{l.class_name}</span></span>
                  <span className="inline-flex shrink-0 items-center gap-1 tabular text-muted"><Eye className="size-3.5" aria-hidden="true" />{nf.format(Number(l.views))}</span>
                  {l.stars != null && <span className="inline-flex shrink-0 items-center gap-0.5 tabular"><Star className="size-3.5 fill-sun-400 text-sun-600" aria-hidden="true" />{l.stars}</span>}
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title="Lessons pupils find hard">
          {d.weak_lessons.length === 0 ? <p className="text-sm text-muted">Topics where the average quiz score is under 70% show up here, so teachers know what to explain again.</p> : (
            <ol className="grid gap-3">
              {d.weak_lessons.map((l) => (
                <li key={l.code} className="flex items-center gap-3 text-sm">
                  <span className="grid h-8 w-12 shrink-0 place-items-center rounded-full bg-coral-100 font-display font-semibold tabular text-coral-700">{l.avg_score}%</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{l.title}</span><span className="text-xs text-muted">{l.class_name} · {l.attempts} {Number(l.attempts) === 1 ? "pupil" : "pupils"}</span></span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title={`Most active pupils, ${days} days`}>
          {d.top_pupils.length === 0 ? <p className="text-sm text-muted">No pupil activity in this period.</p> : (
            <ol className="grid gap-3">
              {d.top_pupils.map((p, i) => (
                <li key={`${p.full_name}-${i}`} className="flex items-center gap-3 text-sm">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sun-400 font-display font-semibold">{i + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{p.full_name}</span><span className="text-xs text-muted">{p.class_name ?? "No class"}</span></span>
                  <span className="shrink-0 text-right text-xs text-muted"><span className="block font-display text-base font-semibold text-ink tabular">{nf.format(Number(p.actions))}</span>actions</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel title="Teachers" action={<Link href="/admin/users?role=teacher" className="text-sm font-semibold text-grape-700 hover:underline">All teachers</Link>}>
          {d.teachers.length === 0 ? <p className="text-sm text-muted">No active teachers yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr><th scope="col" className="pb-2 font-semibold">Teacher</th><th scope="col" className="pb-2 text-right font-semibold">Videos</th><th scope="col" className="pb-2 text-right font-semibold">New</th><th scope="col" className="pb-2 text-right font-semibold">Views</th><th scope="col" className="pb-2 text-right font-semibold">Classrooms</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {d.teachers.map((t) => (
                    <tr key={t.full_name}>
                      <td className="py-2.5 font-semibold">{t.full_name}{t.last_seen_at && <span className="block text-xs font-normal text-muted">Seen {timeAgo(t.last_seen_at)}</span>}</td>
                      <td className="py-2.5 text-right tabular">{Number(t.videos)}</td>
                      <td className="py-2.5 text-right tabular">{Number(t.videos_recent) > 0 ? <span className="font-semibold text-leaf-700">+{Number(t.videos_recent)}</span> : "–"}</td>
                      <td className="py-2.5 text-right tabular">{nf.format(Number(t.views))}</td>
                      <td className="py-2.5 text-right tabular">{Number(t.classrooms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Latest activity" action={<Link href="/admin/activity" className="text-sm font-semibold text-grape-700 hover:underline">All activity</Link>}>
          {activity.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : (
            <ul className="divide-y divide-line text-sm">
              {activity.map((x) => (
                <li key={x.id} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="min-w-0"><span className="font-semibold">{x.actor?.full_name || "Someone"}</span>{x.actor?.role ? <span className="text-muted"> ({x.actor.role})</span> : null} {actionLabel[x.action] ?? x.action.replace(".", " ")}</span>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(x.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

/** A headline number with its change against the period before, and a small trend line. */
function Kpi({ icon: Icon, label, value, prev, days, note, spark, color, money, display }: {
  icon: typeof Users; label: string; value?: number; prev?: number; days?: number; note?: string; spark?: number[]; color?: string; money?: boolean; display?: string;
}) {
  const v = Number(value ?? 0);
  const p = Number(prev ?? 0);
  const change = prev === undefined ? null : p === 0 ? (v > 0 ? "new" : null) : Math.round(((v - p) / p) * 100);
  const shown = display ?? (money ? formatNaira(v) : nf.format(v));
  return (
    <div className="flex min-w-0 flex-col rounded-[1.5rem] border-2 border-line bg-white p-4">
      <p className="flex items-center gap-2 text-[0.8rem] font-semibold text-muted"><Icon className="size-4 text-grape-500" aria-hidden="true" />{label}</p>
      <p className="mt-1.5 truncate font-display text-[1.9rem] font-semibold leading-none tabular">{shown}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted">
        {change === "new" ? <span className="rounded-full bg-leaf-100 px-2 py-0.5 font-semibold text-leaf-700">New</span>
          : typeof change === "number" ? (
            <span className={clsx("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold", change >= 0 ? "bg-leaf-100 text-leaf-700" : "bg-coral-100 text-coral-700")}>
              {change >= 0 ? <ArrowUpRight className="size-3.5" aria-hidden="true" /> : <ArrowDownRight className="size-3.5" aria-hidden="true" />}{Math.abs(change)}%
            </span>
          ) : null}
        <span>{change !== null ? `vs previous ${days} days` : note ?? (days ? `last ${days} days` : "")}</span>
        {note && change !== null && <span className="basis-full">{note}</span>}
      </p>
      {spark && spark.some((x) => x > 0) && <div className="mt-auto pt-2"><Sparkline values={spark} color={color} /></div>}
    </div>
  );
}

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <span className="grid grid-cols-[3rem_1fr_2.6rem] items-center gap-2 text-xs">
      <span className="text-muted">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-wash"><span className={clsx("block h-full rounded-full", tone)} style={{ width: `${pct}%` }} /></span>
      <span className="text-right font-semibold tabular">{value}/{total}</span>
    </span>
  );
}

function Legend() {
  return (
    <p className="flex flex-wrap gap-3 text-xs font-semibold text-muted">
      <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-grape-500" />Video</span>
      <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-sky-400" />Notes</span>
      <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-tangerine-400" />Quiz</span>
    </p>
  );
}
