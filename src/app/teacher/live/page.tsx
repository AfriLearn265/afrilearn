import { revalidatePath } from "next/cache";
import { Video } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { ActionForm, type ActionResult } from "@/components/app/ActionForm";
import { ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";

export const metadata = { title: "Live classes" };

async function schedule(fd: FormData): Promise<ActionResult> {
  "use server";
  const { userId } = await requireRole("teacher");
  const title = String(fd.get("title") ?? "").trim();
  const start = String(fd.get("starts_at") ?? "");
  const classroom = String(fd.get("classroom_id") ?? "");
  if (!title || !start || !classroom) return { error: "Choose a classroom, a title and a start time." };
  const supabase = await createClient();
  const { error } = await supabase.from("live_classes").insert({
    title, classroom_id: classroom, teacher_id: userId, starts_at: new Date(`${start}:00+01:00`).toISOString(),
    duration_minutes: Number(fd.get("duration_minutes") ?? 60), description: String(fd.get("description") ?? "").trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/teacher/live");
  return { message: "Scheduled. Students and parents have been notified." };
}

async function cancel(fd: FormData) {
  "use server";
  await requireRole("teacher");
  const supabase = await createClient();
  await supabase.from("live_classes").update({ status: "cancelled" }).eq("id", String(fd.get("id")));
  revalidatePath("/teacher/live");
}

type Live = { id: string; title: string; starts_at: string; duration_minutes: number; status: string; classrooms: { name: string } | null; attendance: { count: number }[] };
const clock = () => Date.now();

export default async function TeacherLive() {
  const { userId } = await requireRole("teacher");
  const supabase = await createClient();
  const [{ data }, { data: rooms }] = await Promise.all([
    supabase.from("live_classes").select("id, title, starts_at, duration_minutes, status, classrooms(name), attendance(count)").eq("teacher_id", userId).order("starts_at", { ascending: false }).limit(30),
    supabase.from("classrooms").select("id, name").eq("teacher_id", userId).eq("is_archived", false).order("name"),
  ]);
  const now = clock();
  const list = (data ?? []) as unknown as Live[];
  return (
    <>
      <PageHeader title="Live classes" intro="Teach face to face with screen sharing, chat and raised hands. Students who join are marked present automatically." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Your live classes">
          {list.length === 0 ? <EmptyState title="Nothing scheduled." /> : (
            <ul className="divide-y divide-line">
              {list.map((l) => {
                const end = new Date(l.starts_at).getTime() + l.duration_minutes * 60000;
                const current = l.status !== "cancelled" && end > now;
                return (
                  <li key={l.id} className="flex flex-wrap items-center gap-3 py-3.5">
                    <Video className="size-5 text-adire-700" aria-hidden="true" />
                    <span className="min-w-0 flex-1"><span className="block font-semibold">{l.title}</span><span className="text-sm text-muted">{l.classrooms?.name}, {formatDateTime(l.starts_at)}, {l.attendance?.[0]?.count ?? 0} attended{l.status === "cancelled" ? ", cancelled" : ""}</span></span>
                    {current && <ButtonLink href={`/live/${l.id}`} size="sm" variant="accent">Start class</ButtonLink>}
                    {current && l.status === "scheduled" && <form action={cancel}><input type="hidden" name="id" value={l.id} /><button className="text-sm font-semibold text-coral-700 hover:underline" type="submit">Cancel</button></form>}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="Schedule a class">
          {(rooms ?? []).length === 0 ? <EmptyState title="Create a classroom first." /> : (
            <ActionForm action={schedule} submitLabel="Schedule class" pendingLabel="Scheduling">
              <Field label="Classroom" htmlFor="classroom_id"><Select id="classroom_id" name="classroom_id" defaultValue="">{[<option key="" value="" disabled>Choose</option>, ...(rooms ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)]}</Select></Field>
              <Field label="Title" htmlFor="title"><Input id="title" name="title" placeholder="Revision: quadratic equations" /></Field>
              <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                <Field label="Starts (Lagos time)" htmlFor="starts_at"><Input id="starts_at" name="starts_at" type="datetime-local" /></Field>
                <Field label="Minutes" htmlFor="duration_minutes"><Input id="duration_minutes" name="duration_minutes" type="number" min={10} max={300} defaultValue={60} /></Field>
              </div>
              <Field label="What to prepare" htmlFor="description" hint="Optional"><Textarea id="description" name="description" rows={2} /></Field>
            </ActionForm>
          )}
        </Panel>
      </div>
    </>
  );
}
