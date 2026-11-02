import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, timeAgo } from "@/lib/format";
import { PageHeader, Panel, EmptyState } from "@/components/app/AppShell";
import { setUserRole, setUserStatus } from "../manage-actions";

export const metadata = { title: "Users" };

type U = { id: string; full_name: string; email: string; role: string; status: string; created_at: string; last_sign_in_at: string | null; total_count: number };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ role?: string; q?: string; page?: string }> }) {
  const { userId } = await requireRole("admin");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_users", { p_role: sp.role || null, p_search: sp.q || null, p_limit: 50, p_offset: (page - 1) * 50 });
  const users = (data ?? []) as U[];
  const total = users[0]?.total_count ?? 0;
  const qs = (p: number) => `/admin/users?${new URLSearchParams({ ...(sp.role ? { role: sp.role } : {}), ...(sp.q ? { q: sp.q } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Users" intro="Every account on the platform. Role and status changes take effect immediately and are recorded in the activity log." />
      <form action="/admin/users" className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" name="q" defaultValue={sp.q} placeholder="Search by name or email" className="h-10 min-w-56 flex-1 rounded-xl border border-line bg-white px-3" />
        <label htmlFor="role" className="sr-only">Role</label>
        <select id="role" name="role" defaultValue={sp.role ?? ""} className="h-10 rounded-xl border border-line bg-white px-3">
          <option value="">All roles</option><option value="student">Students</option><option value="teacher">Teachers</option><option value="parent">Parents</option><option value="admin">Administrators</option>
        </select>
        <button type="submit" className="h-10 rounded-xl bg-adire-700 px-4 font-semibold text-white">Search</button>
      </form>
      <Panel>
        {users.length === 0 ? <EmptyState title="No users match." /> : (
          <div className="-mx-5 overflow-x-auto md:-mx-6">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="text-muted"><tr className="border-b border-line">
                <th className="px-5 py-2.5 font-medium md:px-6">Name</th><th className="px-3 py-2.5 font-medium">Role</th><th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Joined</th><th className="px-3 py-2.5 font-medium">Last seen</th><th className="px-5 py-2.5 md:px-6" />
              </tr></thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3 md:px-6"><p className="font-semibold">{u.full_name}</p><p className="text-muted">{u.email}</p></td>
                    <td className="px-3 py-3">
                      {u.id === userId ? <span className="capitalize">{u.role}</span> : (
                        <form action={async (fd) => { "use server"; await setUserRole(fd); }} className="flex gap-1">
                          <input type="hidden" name="user_id" value={u.id} />
                          <label className="sr-only" htmlFor={`r-${u.id}`}>Role</label>
                          <select id={`r-${u.id}`} name="role" defaultValue={u.role} className="h-8 rounded-lg border border-line bg-white px-2 text-sm">
                            <option value="student">Student</option><option value="teacher">Teacher</option><option value="parent">Parent</option><option value="admin">Admin</option>
                          </select>
                          <button type="submit" className="rounded-lg border border-line px-2 text-xs font-semibold hover:bg-wash">Set</button>
                        </form>
                      )}
                    </td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.status === "active" ? "bg-leaf-100 text-leaf-700" : u.status === "pending" ? "bg-sun-100" : "bg-coral-100 text-coral-700"}`}>{u.status}</span></td>
                    <td className="px-3 py-3 text-muted">{formatDate(u.created_at)}</td>
                    <td className="px-3 py-3 text-muted">{u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : "Never"}</td>
                    <td className="px-5 py-3 text-right md:px-6">
                      {u.id !== userId && (
                        <form action={setUserStatus}>
                          <input type="hidden" name="user_id" value={u.id} /><input type="hidden" name="status" value={u.status === "suspended" ? "active" : "suspended"} />
                          <button type="submit" className={`font-semibold hover:underline ${u.status === "suspended" ? "text-leaf-700" : "text-coral-700"}`}>{u.status === "suspended" ? "Reactivate" : "Suspend"}</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 50 && (
          <div className="mt-4 flex justify-between text-sm">
            {page > 1 ? <a href={qs(page - 1)} className="font-semibold text-adire-700">Previous</a> : <span />}
            <span className="text-muted">Page {page} of {Math.ceil(total / 50)}</span>
            {page * 50 < total ? <a href={qs(page + 1)} className="font-semibold text-adire-700">Next</a> : <span />}
          </div>
        )}
      </Panel>
    </>
  );
}
