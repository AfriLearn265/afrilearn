import Link from "next/link";
import { revalidatePath } from "next/cache";
import clsx from "clsx";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm, type ActionResult } from "@/components/app/ActionForm";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";

/**
 * Moderated parent–teacher messaging. Students are never participants, and
 * administrators can read every thread. Rules are enforced by RLS policies.
 */
async function send(fd: FormData): Promise<ActionResult> {
  "use server";
  const { userId } = await requireRole("parent", "teacher");
  const body = String(fd.get("body") ?? "").trim();
  if (!body) return { error: "Write a message." };
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({ thread_id: String(fd.get("thread_id")), sender_id: userId, body });
  if (error) return { error: "Your message couldn't be sent. The conversation may be closed." };
  await supabase.from("message_threads").update({ status: "open" }).eq("id", String(fd.get("thread_id")));
  revalidatePath("/", "layout");
  return { message: "Sent." };
}

async function start(fd: FormData): Promise<ActionResult> {
  "use server";
  const { userId, profile } = await requireRole("parent", "teacher");
  const [studentId, otherId] = String(fd.get("pair") ?? "").split(":");
  const subject = String(fd.get("subject") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  if (!studentId || !otherId || !subject || !body) return { error: "Choose who to write to, add a subject and a message." };
  const supabase = await createClient();
  const row = profile.role === "parent" ? { parent_id: userId, teacher_id: otherId, student_id: studentId, subject } : { parent_id: otherId, teacher_id: userId, student_id: studentId, subject };
  const { data, error } = await supabase.from("message_threads").insert(row).select("id").single();
  if (error) return { error: "You can only message the teachers of your own children, or parents of your own students." };
  await supabase.from("messages").insert({ thread_id: data.id, sender_id: userId, body });
  revalidatePath("/", "layout");
  return { message: "Conversation started." };
}

async function report(fd: FormData) {
  "use server";
  const { userId } = await requireRole("parent", "teacher");
  const supabase = await createClient();
  await supabase.from("messages").update({ is_flagged: true }).eq("id", String(fd.get("message_id")));
  await supabase.from("reports").insert({ reporter_id: userId, target_type: "message", target_id: String(fd.get("message_id")), reason: "Reported from a conversation" });
  revalidatePath("/", "layout");
}

type Thread = { id: string; subject: string; status: string; updated_at: string; parent_id: string; teacher_id: string; student_id: string };

export async function Messages({ basePath, threadId, pairs }: {
  basePath: string; threadId?: string; pairs: { value: string; label: string }[];
}) {
  const { userId } = await requireRole("parent", "teacher");
  const supabase = await createClient();
  const { data: threadsData } = await supabase.from("message_threads").select("id, subject, status, updated_at, parent_id, teacher_id, student_id").order("updated_at", { ascending: false });
  const threads = (threadsData ?? []) as Thread[];
  const ids = [...new Set(threads.flatMap((t) => [t.parent_id, t.teacher_id, t.student_id]))];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const name = new Map((people ?? []).map((p) => [p.id, p.full_name]));
  const current = threads.find((t) => t.id === threadId) ?? threads[0];
  const { data: msgs } = current ? await supabase.from("messages").select("id, sender_id, body, created_at, is_flagged").eq("thread_id", current.id).order("created_at") : { data: [] };

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <div className="grid content-start gap-6">
        <Panel title="Conversations">
          {threads.length === 0 ? <p className="text-sm text-muted">No conversations yet.</p> : (
            <ul className="grid gap-1">
              {threads.map((t) => {
                const other = t.parent_id === userId ? t.teacher_id : t.parent_id;
                return (
                  <li key={t.id}><Link href={`${basePath}?t=${t.id}`} className={clsx("block rounded-xl px-3 py-2.5", t.id === current?.id ? "bg-adire-700 text-white" : "hover:bg-wash")}>
                    <span className="block font-semibold leading-tight">{t.subject}</span>
                    <span className={clsx("text-xs", t.id === current?.id ? "text-adire-100" : "text-muted")}>{name.get(other)}, about {name.get(t.student_id)}, {timeAgo(t.updated_at)}</span>
                  </Link></li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="New conversation">
          {pairs.length === 0 ? <p className="text-sm text-muted">You can message teachers once your child has joined a classroom.</p> : (
            <ActionForm action={start} submitLabel="Send" pendingLabel="Sending">
              <Field label="To" htmlFor="pair"><Select id="pair" name="pair" defaultValue="">{[<option key="" value="" disabled>Choose</option>, ...pairs.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)]}</Select></Field>
              <Field label="Subject" htmlFor="subject"><Input id="subject" name="subject" /></Field>
              <Field label="Message" htmlFor="new-body"><Textarea id="new-body" name="body" rows={3} /></Field>
            </ActionForm>
          )}
        </Panel>
      </div>
      <Panel>
        {!current ? <EmptyState title="Choose or start a conversation." /> : (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div><h2 className="font-sans text-lg font-semibold tracking-normal">{current.subject}</h2><p className="text-sm text-muted">About {name.get(current.student_id)}</p></div>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted"><ShieldCheck className="size-4 text-leaf-500" aria-hidden="true" />Moderated: visible to school administrators</p>
            </div>
            <ul className="grid gap-3">
              {(msgs ?? []).map((m) => (
                <li key={m.id} className={clsx("max-w-[85%] rounded-2xl px-4 py-3", m.sender_id === userId ? "ml-auto rounded-br-md bg-adire-700 text-white" : "rounded-bl-md bg-wash")}>
                  <p className="whitespace-pre-line">{m.body}</p>
                  <p className={clsx("mt-1 flex gap-3 text-xs", m.sender_id === userId ? "text-adire-100" : "text-muted")}>
                    <span>{name.get(m.sender_id)}, {timeAgo(m.created_at)}</span>
                    {m.sender_id !== userId && (m.is_flagged ? <span>Reported</span> : (
                      <form action={report}><input type="hidden" name="message_id" value={m.id} /><button type="submit" className="underline">Report</button></form>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
            <ActionForm action={send} submitLabel="Reply" pendingLabel="Sending">
              <input type="hidden" name="thread_id" value={current.id} />
              <label htmlFor="reply" className="sr-only">Reply</label>
              <Textarea id="reply" name="body" rows={3} placeholder="Write a reply" />
            </ActionForm>
          </div>
        )}
      </Panel>
    </div>
  );
}
