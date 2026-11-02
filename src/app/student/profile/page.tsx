import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/app/AppShell";
import { ActionForm, type ActionResult } from "@/components/app/ActionForm";
import { CopyButton } from "@/components/app/CopyButton";
import { Field, Input, Select } from "@/components/ui/Field";
import { interestOptions } from "@/config/curriculum";

export const metadata = { title: "Profile" };

async function saveProfile(fd: FormData): Promise<ActionResult> {
  "use server";
  const { userId } = await requireRole("student");
  const supabase = await createClient();
  const name = String(fd.get("full_name") ?? "").trim();
  if (name.length < 2) return { error: "Enter your name." };
  const [a, b] = await Promise.all([
    supabase.from("profiles").update({ full_name: name }).eq("id", userId),
    supabase.from("students").update({
      class_id: String(fd.get("class_id") ?? "") || null,
      interests: fd.getAll("interests").map(String).slice(0, 12),
      leaderboard_opt_in: fd.get("leaderboard_opt_in") === "on",
    }).eq("profile_id", userId),
  ]);
  if (a.error || b.error) return { error: (a.error ?? b.error)!.message };
  revalidatePath("/student", "layout");
  return { message: "Profile saved." };
}

export default async function Profile() {
  const { userId, email, profile } = await requireRole("student");
  const supabase = await createClient();
  const [{ data: me }, { data: classes }, { data: parents }] = await Promise.all([
    supabase.from("students").select("class_id, interests, leaderboard_opt_in, link_code, guardian_name").eq("profile_id", userId).single(),
    supabase.from("classes").select("id, name").order("sort_order"),
    supabase.from("parent_children").select("parent_id, relationship").eq("student_id", userId),
  ]);
  const ids = (parents ?? []).map((p) => p.parent_id);
  const { data: names } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const nameOf = new Map((names ?? []).map((n) => [n.id, n.full_name]));
  const interests = new Set((me?.interests as string[] | undefined) ?? []);
  return (
    <>
      <PageHeader title="Your profile" intro={email ?? undefined} />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Details">
          <ActionForm action={saveProfile} submitLabel="Save profile" resetOnSuccess={false}>
            <Field label="Full name" htmlFor="full_name"><Input id="full_name" name="full_name" defaultValue={profile.full_name} /></Field>
            <Field label="Class" htmlFor="class_id">
              <Select id="class_id" name="class_id" defaultValue={me?.class_id ?? ""}>{[<option key="" value="">Not set</option>, ...(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)]}</Select>
            </Field>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink-soft">Interests</legend>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((i) => (
                  <label key={i} className="cursor-pointer">
                    <input type="checkbox" name="interests" value={i} defaultChecked={interests.has(i)} className="peer sr-only" />
                    <span className="inline-flex rounded-full border border-line px-3 py-1.5 text-sm peer-checked:border-adire-700 peer-checked:bg-adire-700 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-sun-300">{i}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="leaderboard_opt_in" defaultChecked={!!me?.leaderboard_opt_in} className="mt-0.5 size-4 accent-adire-700" />
              <span>Show my first name and points on class leaderboards (only where my teacher has turned them on).</span>
            </label>
          </ActionForm>
        </Panel>
        <div className="grid content-start gap-6">
          <Panel title="Parent link code">
            <div className="flex flex-wrap items-center gap-3">
              <p className="rounded-xl bg-wash px-4 py-2 font-display text-2xl font-bold tracking-[0.2em] text-adire-800">{me?.link_code}</p>
              {me?.link_code && <CopyButton value={me.link_code} />}
            </div>
          </Panel>
          <Panel title="Linked parents and guardians">
            {(parents ?? []).length === 0 ? <p className="text-sm text-muted">No parent has linked to your account yet.{me?.guardian_name ? ` ${me.guardian_name} gave consent when you signed up.` : ""}</p> : (
              <ul className="grid gap-2 text-sm">{(parents ?? []).map((p, i) => <li key={i}><strong>{nameOf.get(p.parent_id) ?? "A parent"}</strong>, your {p.relationship}</li>)}</ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
