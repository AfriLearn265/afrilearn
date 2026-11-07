import Link from "next/link";
import clsx from "clsx";
import { ChevronRight, MonitorPlay, NotebookText, Puzzle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { CORE_SUBJECTS, TERM_NAMES } from "@/config/subjects";
import { addQuestion, addTopic, deleteQuestion, deleteTopic, updateTopic } from "@/app/curriculum-actions";

type Topic = { id: string; code: string; term: number; theme: string | null; title: string; summary: string | null; notes: string | null; is_published: boolean; sort_order: number };
type StaffQuestion = { id: string; prompt: string; options: string[]; answer: number; explanation: string | null };

/**
 * Topics by term for each class and subject. Administrators add, move and remove topics;
 * teachers and administrators write the notes and quiz questions pupils see on each topic page.
 */
export async function CurriculumManager({ basePath, isAdmin, cls, subject, open }: {
  basePath: string; isAdmin: boolean; cls?: string; subject?: string; open?: string;
}) {
  const supabase = await createClient();
  const [{ data: classes }, { data: subjects }] = await Promise.all([
    supabase.from("classes").select("id, code, name").eq("is_active", true).order("sort_order"),
    supabase.from("subjects").select("id, code, name").in("code", [...CORE_SUBJECTS]),
  ]);
  const klass = classes?.find((c) => c.code === cls) ?? classes?.[0];
  const subj = subjects?.find((s) => s.code === subject) ?? subjects?.find((s) => s.code === "mathematics") ?? subjects?.[0];
  const href = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ class: klass?.code, subject: subj?.code, ...extra }).filter(([, v]) => v) as [string, string][]);
    return `${basePath}?${p.toString()}`;
  };
  if (!klass || !subj) return <PageHeader title="Topics by term" intro="Add a class and a subject first." />;

  const { data } = await supabase.from("curriculum_topics").select("id, code, term, theme, title, summary, notes, is_published, sort_order")
    .eq("class_id", klass.id).eq("subject_id", subj.id).order("term").order("sort_order");
  const topics = (data ?? []) as Topic[];
  const ids = topics.map((t) => t.id);
  const [{ data: qRows }, { data: vRows }] = ids.length
    ? await Promise.all([
        supabase.from("topic_questions").select("topic_id").in("topic_id", ids),
        supabase.from("class_videos").select("topic_id").in("topic_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const tally = (rows: { topic_id: string | null }[] | null) => (rows ?? []).reduce((m, r) => (r.topic_id ? m.set(r.topic_id, (m.get(r.topic_id) ?? 0) + 1) : m), new Map<string, number>());
  const qCount = tally(qRows);
  const vCount = tally(vRows);
  const current = topics.find((t) => t.code === open);
  const { data: qs } = current ? await supabase.rpc("staff_topic_questions", { p_topic: current.id }) : { data: null };
  const questions = (qs ?? []) as StaffQuestion[];

  return (
    <>
      <PageHeader title="Topics by term" intro="What each class learns in English, Mathematics and Basic Science, term by term. Pupils see these topics in this order, each with its video, notes and quiz." />

      <nav aria-label="Class" className="-mx-4 mb-3 overflow-x-auto px-4 scrollbar-none">
        <ul className="flex min-w-max gap-2">
          {classes?.map((c) => <li key={c.id}><Link href={href({ class: c.code, open: undefined })} className={chip(c.id === klass.id)}>{c.name}</Link></li>)}
        </ul>
      </nav>
      <nav aria-label="Subject" className="mb-6 flex flex-wrap gap-2">
        {subjects?.map((s) => <Link key={s.id} href={href({ subject: s.code, open: undefined })} className={chip(s.id === subj.id, true)}>{s.name}</Link>)}
      </nav>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid gap-6">
          {[1, 2, 3].map((term) => {
            const list = topics.filter((t) => t.term === term);
            return (
              <Panel key={term} title={`${TERM_NAMES[term]} · ${list.length} topic${list.length === 1 ? "" : "s"}`}>
                {list.length === 0 ? <p className="text-sm text-muted">No topics in this term yet.</p> : (
                  <ol className="divide-y-2 divide-line">
                    {list.map((t) => (
                      <li key={t.id}>
                        <Link href={t.code === open ? href({ open: undefined }) : href({ open: t.code })}
                          className={clsx("flex items-center gap-3 py-3 hover:text-grape-700", !t.is_published && "opacity-60")}>
                          <span className="min-w-0 flex-1">
                            {t.theme && <span className="block text-xs font-bold uppercase tracking-[0.1em] text-faint">{t.theme}</span>}
                            <span className="font-semibold">{t.title}</span>{!t.is_published && <span className="ml-2 text-xs font-semibold text-muted">(hidden)</span>}
                          </span>
                          <span className="flex shrink-0 items-center gap-3 text-xs font-semibold text-muted">
                            <span className={clsx("inline-flex items-center gap-1", t.notes ? "text-leaf-700" : "")}><NotebookText className="size-4" aria-hidden="true" />{t.notes ? "Notes" : "No notes"}</span>
                            <span className="inline-flex items-center gap-1"><Puzzle className="size-4" aria-hidden="true" />{qCount.get(t.id) ?? 0}</span>
                            <span className="inline-flex items-center gap-1"><MonitorPlay className="size-4" aria-hidden="true" />{vCount.get(t.id) ?? 0}</span>
                          </span>
                          <ChevronRight className={clsx("size-4 shrink-0 transition-transform", t.code === open && "rotate-90")} aria-hidden="true" />
                        </Link>
                        {current?.id === t.id && (
                          <div className="mb-4 grid gap-6 rounded-[1.4rem] bg-wash p-4 sm:p-5">
                            <ActionForm action={updateTopic} submitLabel="Save topic" pendingLabel="Saving" resetOnSuccess={false}>
                              <input type="hidden" name="id" value={t.id} />
                              <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
                                <Field label="Title" htmlFor={`title-${t.id}`}><Input id={`title-${t.id}`} name="title" defaultValue={t.title} maxLength={200} /></Field>
                                <Field label="Term" htmlFor={`term-${t.id}`}>
                                  <Select id={`term-${t.id}`} name="term" defaultValue={String(t.term)}>
                                    {[1, 2, 3].map((n) => <option key={n} value={n}>{TERM_NAMES[n]}</option>)}
                                  </Select>
                                </Field>
                                <Field label="Theme" htmlFor={`theme-${t.id}`} hint="e.g. Reading, or Number and Numeration"><Input id={`theme-${t.id}`} name="theme" defaultValue={t.theme ?? ""} maxLength={80} /></Field>
                                <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold"><input type="checkbox" name="is_published" defaultChecked={t.is_published} className="size-4 accent-grape-600" />Pupils can see it</label>
                              </div>
                              <Field label="One-line summary" htmlFor={`sum-${t.id}`} hint="Optional"><Input id={`sum-${t.id}`} name="summary" defaultValue={t.summary ?? ""} maxLength={400} /></Field>
                              <Field label="Lesson notes" htmlFor={`notes-${t.id}`} hint="Use ## for a heading, - for a list, **bold**, and | a | b | for a table.">
                                <Textarea id={`notes-${t.id}`} name="notes" rows={10} defaultValue={t.notes ?? ""} maxLength={20000} className="font-mono text-sm" />
                              </Field>
                            </ActionForm>

                            <div>
                              <h3 className="font-display text-lg font-semibold">Quiz questions</h3>
                              {questions.length === 0 ? <p className="mt-1 text-sm text-muted">No questions yet. Three to five short questions work well.</p> : (
                                <ol className="mt-3 grid gap-2">
                                  {questions.map((q, n) => (
                                    <li key={q.id} className="flex items-start justify-between gap-3 rounded-xl bg-white p-3">
                                      <div className="text-sm">
                                        <p className="font-semibold">{n + 1}. {q.prompt}</p>
                                        <p className="mt-1 text-muted">{q.options.map((o, i) => <span key={i} className={i === q.answer ? "font-semibold text-leaf-700" : ""}>{i ? " · " : ""}{o}{i === q.answer ? " ✓" : ""}</span>)}</p>
                                      </div>
                                      <ActionForm action={deleteQuestion} submitLabel="Remove" pendingLabel="Removing" variant="outline">
                                        <input type="hidden" name="id" value={q.id} />
                                      </ActionForm>
                                    </li>
                                  ))}
                                </ol>
                              )}
                              <ActionForm action={addQuestion} submitLabel="Add question" pendingLabel="Adding" className="mt-4 rounded-xl bg-white p-4">
                                <input type="hidden" name="topic_id" value={t.id} />
                                <Field label="Question" htmlFor={`q-${t.id}`}><Input id={`q-${t.id}`} name="prompt" maxLength={600} /></Field>
                                <fieldset className="grid gap-2 sm:grid-cols-2">
                                  <legend className="mb-1 text-sm font-semibold">Answer choices (tick the correct one)</legend>
                                  {[0, 1, 2, 3].map((i) => (
                                    <label key={i} className="flex items-center gap-2">
                                      <input type="radio" name="answer" value={i} defaultChecked={i === 0} className="size-4 accent-leaf-500" aria-label={`Choice ${String.fromCharCode(65 + i)} is correct`} />
                                      <Input name={`option${i}`} placeholder={`Choice ${String.fromCharCode(65 + i)}${i > 1 ? " (optional)" : ""}`} maxLength={200} />
                                    </label>
                                  ))}
                                </fieldset>
                                <Field label="Why it's right" htmlFor={`ex-${t.id}`} hint="Optional, shown after the pupil answers"><Input id={`ex-${t.id}`} name="explanation" maxLength={800} /></Field>
                              </ActionForm>
                            </div>

                            {isAdmin && (
                              <ActionForm action={deleteTopic} submitLabel="Remove this topic" pendingLabel="Removing" variant="outline">
                                <input type="hidden" name="id" value={t.id} />
                                <p className="text-xs text-muted">Removes the topic, its notes and quiz. Videos stay, unlinked.</p>
                              </ActionForm>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            );
          })}
        </div>
        {isAdmin && (
          <Panel title={`Add a topic to ${klass.name} ${subj.name}`} className="self-start">
            <ActionForm action={addTopic} submitLabel="Add topic" pendingLabel="Adding">
              <input type="hidden" name="class_id" value={klass.id} />
              <input type="hidden" name="subject_id" value={subj.id} />
              <Field label="Topic title" htmlFor="new-title"><Input id="new-title" name="title" maxLength={200} placeholder="e.g. Adding fractions" /></Field>
              <Field label="Term" htmlFor="new-term">
                <Select id="new-term" name="term" defaultValue="1">{[1, 2, 3].map((n) => <option key={n} value={n}>{TERM_NAMES[n]}</option>)}</Select>
              </Field>
              <Field label="Theme" htmlFor="new-theme" hint="Optional"><Input id="new-theme" name="theme" maxLength={80} placeholder="e.g. Number and Numeration" /></Field>
            </ActionForm>
          </Panel>
        )}
      </div>
    </>
  );
}

function chip(active: boolean, sun?: boolean) {
  return clsx("inline-flex h-10 items-center rounded-full border-2 px-4 font-display text-sm font-semibold transition-colors",
    active ? (sun ? "border-ink bg-sun-400 text-ink" : "border-ink bg-grape-600 text-white") : "border-line bg-white text-ink-soft hover:border-grape-300");
}
