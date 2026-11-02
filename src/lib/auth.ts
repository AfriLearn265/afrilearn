import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome, type Role } from "@/config/brand";

export type Profile = {
  id: string;
  role: Role;
  status: "active" | "pending" | "suspended";
  full_name: string;
  avatar_url: string | null;
};

export type Session = {
  userId: string;
  email: string | null;
  profile: Profile;
};

/** Verified session + profile for this request (null when signed out). */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status, full_name, avatar_url")
    .eq("id", claims.sub)
    .maybeSingle<Profile>();
  if (!profile) return null;
  return { userId: claims.sub, email: (claims.email as string | undefined) ?? null, profile };
});

/** Where a signed-in user belongs right now. */
export function homeFor(profile: Profile) {
  if (profile.status === "suspended") return "/account/suspended";
  if (profile.role === "teacher" && profile.status !== "active") return "/pending";
  return roleHome[profile.role];
}

/** Guard for role areas. Redirects anyone who does not belong here. */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  const { profile } = session;
  if (profile.status === "suspended") redirect("/account/suspended");
  if (!roles.includes(profile.role) || profile.status !== "active") redirect(homeFor(profile));
  return session;
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "there";
}
