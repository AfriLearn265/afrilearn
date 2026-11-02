import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, timeAgo } from "@/lib/format";
import { formatNaira } from "@/lib/catalogue";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { resolveReport } from "../manage-actions";

export const metadata = { title: "Activity and reports" };

const describe: Record<string, string> = {
  "account.created": "created an account", "teacher.approved": "approved a teacher", "teacher.rejected": "declined a teacher",
  "user.status_changed": "changed an account status", "user.role_changed": "changed a role", "classroom.joined": "joined a classroom",
  "parent.linked_child": "linked a child", "assignment.submitted": "handed in an assignment", "assignment.graded": "graded a submission",
  "exam.started": "started a test", "exam.submitted": "submitted a test", "exam.answer_graded": "marked a theory answer",
  "notification.broadcast": "sent an announcement", "payment.confirmed": "completed a payment",
};

export default async function Activity() {
  await requireRole("admin");
  const supabase = await createClient();
  const [{ data: logs }, { data: reports }, { data: payments }] = await Promise.all([
    supabase.from("activity_logs").select("id, action, entity_type, metadata, created_at, actor_id").order("created_at", { ascending: false }).limit(60),
    supabase.from("reports").select("id, target_type, reason, status, created_at, reporter_id").order("created_at", { ascending: false }).limit(30),
    supabase.from("payments").select("id, reference, amount_kobo, status, provider, created_at, user_id, subscription_plans(name)").order("created_at", { ascending: false }).limit(30),
  ]);
  const ids = [...new Set([...(logs ?? []).map((l) => l.actor_id), ...(reports ?? []).map((r) => r.reporter_id), ...(payments ?? []).map((p) => p.user_id)].filter(Boolean))] as string[];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const name = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  return (
    <>
      <PageHeader title="Activity, reports and payments" intro="An audit trail of sensitive actions, content reported by users, and payment records from Paystack." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Activity log">
          {(logs ?? []).length === 0 ? <EmptyState title="No activity yet." /> : (
            <ul className="divide-y divide-line text-sm">
              {(logs ?? []).map((l) => (
                <li key={l.id} className="flex justify-between gap-3 py-2">
                  <span><strong>{name.get(l.actor_id ?? "") ?? "System"}</strong> {describe[l.action] ?? l.action}</span>
                  <span className="shrink-0 text-muted">{timeAgo(l.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="grid content-start gap-6">
          <Panel title="Reports">
            {(reports ?? []).length === 0 ? <p className="text-sm text-muted">No one has reported anything.</p> : (
              <ul className="grid gap-3 text-sm">
                {(reports ?? []).map((r) => (
                  <li key={r.id} className="rounded-xl border border-line p-3">
                    <p><strong>{name.get(r.reporter_id)}</strong> reported a {r.target_type}: {r.reason}</p>
                    <p className="text-muted">{formatDateTime(r.created_at)}, {r.status}</p>
                    {(r.status === "open" || r.status === "reviewing") && (
                      <div className="mt-2 flex gap-3">
                        {(["resolved", "dismissed"] as const).map((s) => (
                          <form key={s} action={resolveReport}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={s} />
                            <button type="submit" className="font-semibold capitalize text-adire-700 hover:underline">{s === "resolved" ? "Mark resolved" : "Dismiss"}</button></form>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Payments">
            {(payments ?? []).length === 0 ? <p className="text-sm text-muted">No payments yet.</p> : (
              <ul className="divide-y divide-line text-sm">
                {(payments ?? []).map((p) => (
                  <li key={p.id} className="flex justify-between gap-3 py-2">
                    <span><strong>{name.get(p.user_id)}</strong>, {(p.subscription_plans as unknown as { name: string } | null)?.name}<br /><span className="text-muted">{p.reference}</span></span>
                    <span className="text-right"><span className="block font-semibold tabular">{formatNaira(p.amount_kobo)}</span><span className={p.status === "success" ? "text-leaf-700" : "text-muted"}>{p.status}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
