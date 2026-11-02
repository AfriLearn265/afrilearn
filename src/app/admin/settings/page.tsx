import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai";
import { liveProvider } from "@/lib/live";
import { PageHeader, Panel } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { broadcast, savePlan, saveSettings } from "../manage-actions";

export const metadata = { title: "Platform settings" };

const flags: [string, string, string][] = [
  ["registration_open", "New sign-ups", "Allow new student, parent and teacher accounts."],
  ["paid_features_enabled", "Paid plans", "When off, every feature is free (pilot mode) and checkout is hidden."],
  ["leaderboards_enabled", "Class leaderboards", "Allow teachers to switch on opt-in leaderboards."],
  ["ai_companion_enabled", "AI learning companion", "Show the companion to students when an AI key is configured."],
  ["live_classes_enabled", "Live classes", "Allow teachers to schedule live classes."],
];

export default async function Settings() {
  await requireRole("admin");
  const supabase = await createClient();
  const [{ data: settings }, { data: plans }] = await Promise.all([
    supabase.from("platform_settings").select("key, value"),
    supabase.from("subscription_plans").select("id, key, name, price_kobo, is_active, is_featured, features, billing_interval").order("sort_order"),
  ]);
  const v = new Map((settings ?? []).map((s) => [s.key, s.value]));
  const integrations = [
    ["Supabase database", true, "Connected"],
    ["AI companion and question drafting", isAiConfigured(), "Add ANTHROPIC_API_KEY (or OPENAI_API_KEY) in Vercel"],
    ["Live classes (JaaS)", liveProvider().kind === "jaas", "Add JAAS_APP_ID, JAAS_API_KEY_ID and JAAS_PRIVATE_KEY; until then public Jitsi (5-minute embeds)"],
    ["Paystack payments", Boolean(process.env.PAYSTACK_SECRET_KEY), "Add PAYSTACK_SECRET_KEY (test key for the pilot)"],
    ["Server key for payments and child accounts", Boolean(process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY), "Add SUPABASE_SECRET_KEY"],
  ] as const;

  return (
    <>
      <PageHeader title="Platform settings" intro="Switch features on or off for everyone, edit plans and send announcements." />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="grid content-start gap-6">
          <Panel title="Features">
            <ActionForm action={saveSettings} submitLabel="Save settings" resetOnSuccess={false}>
              <ul className="grid gap-3">
                {flags.map(([k, label, hint]) => (
                  <li key={k}><label className="flex items-start gap-3"><input type="checkbox" name={k} defaultChecked={v.get(k) === true} className="mt-1 size-4 accent-adire-700" /><span><span className="block font-semibold">{label}</span><span className="text-sm text-muted">{hint}</span></span></label></li>
                ))}
              </ul>
              <Field label="AI questions per student per day" htmlFor="ai_daily_limit"><Input id="ai_daily_limit" name="ai_daily_limit" type="number" min={0} max={500} defaultValue={Number(v.get("ai_daily_limit") ?? 40)} className="w-32" /></Field>
            </ActionForm>
          </Panel>
          <Panel title="Integrations">
            <ul className="grid gap-3 text-sm">
              {integrations.map(([label, ok, hint]) => (
                <li key={label} className="flex items-start justify-between gap-3">
                  <span><span className="block font-semibold">{label}</span>{!ok && <span className="text-muted">{hint}</span>}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${ok ? "bg-leaf-100 text-leaf-700" : "bg-sun-100"}`}>{ok ? "Ready" : "Needs a key"}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Send an announcement">
            <ActionForm action={broadcast} submitLabel="Send notification">
              <Field label="To" htmlFor="b-role"><Select id="b-role" name="role" defaultValue=""><option value="">Everyone</option><option value="student">Students</option><option value="teacher">Teachers</option><option value="parent">Parents</option></Select></Field>
              <Field label="Title" htmlFor="b-title"><Input id="b-title" name="title" /></Field>
              <Field label="Message" htmlFor="b-body"><Textarea id="b-body" name="body" rows={3} /></Field>
            </ActionForm>
          </Panel>
        </div>
        <Panel title="Plans">
          <div className="grid gap-5">
            {(plans ?? []).map((p) => (
              <details key={p.id} className="rounded-xl border border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-sm text-muted">{p.price_kobo == null ? "Custom" : p.price_kobo === 0 ? "Free" : `₦${(p.price_kobo / 100).toLocaleString("en-NG")} per ${p.billing_interval}`}{p.is_active ? "" : ", hidden"}</span>
                </summary>
                <div className="border-t border-line p-4">
                  <ActionForm action={savePlan} submitLabel="Save plan" resetOnSuccess={false}>
                    <input type="hidden" name="id" value={p.id} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Name" htmlFor={`pn-${p.id}`}><Input id={`pn-${p.id}`} name="name" defaultValue={p.name} /></Field>
                      <Field label="Price in naira" htmlFor={`pp-${p.id}`} hint="Blank = custom"><Input id={`pp-${p.id}`} name="price" type="number" min={0} defaultValue={p.price_kobo == null ? "" : p.price_kobo / 100} /></Field>
                    </div>
                    <Field label="Features, one per line" htmlFor={`pf-${p.id}`}><Textarea id={`pf-${p.id}`} name="features" rows={4} defaultValue={(p.features as string[]).join("\n")} /></Field>
                    <div className="flex gap-5 text-sm">
                      <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={p.is_active} className="size-4 accent-adire-700" />Show on site</label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={p.is_featured} className="size-4 accent-adire-700" />Highlight</label>
                    </div>
                  </ActionForm>
                </div>
              </details>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
