import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

/**
 * Service-role client. Bypasses Row Level Security, so it is only used in
 * server code for tasks no user may perform directly: confirming payments
 * from a provider webhook and creating child accounts for parents.
 * Requires SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) on the server.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
