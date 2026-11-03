import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { brand as defaults } from "@/config/brand";

export type Brand = {
  name: string; tagline: string; description: string; supportEmail: string; country: string;
  logoUrl: string | null; announcement: { text: string; link: string | null } | null;
};

const fallback: Brand = {
  name: defaults.name, tagline: defaults.tagline, description: defaults.description, supportEmail: defaults.supportEmail,
  country: defaults.country, logoUrl: null, announcement: null,
};

/**
 * The site's name, tagline, logo and banner, as set by an administrator in Settings.
 * Falls back to src/config/brand.ts if the database can't be reached.
 */
export const getBrand = cache(async (): Promise<Brand> => {
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await createPublicClient().from("platform_settings").select("key, value")
      .in("key", ["brand", "support_email", "announcement"]);
    if (error || !data) return fallback;
    const v = new Map(data.map((r) => [r.key, r.value as unknown]));
    const b = (v.get("brand") ?? {}) as { name?: string; tagline?: string; logo_url?: string | null };
    const a = (v.get("announcement") ?? {}) as { enabled?: boolean; text?: string; link?: string };
    const email = v.get("support_email");
    return {
      ...fallback,
      name: b.name?.trim() || fallback.name,
      tagline: b.tagline?.trim() || fallback.tagline,
      logoUrl: b.logo_url || null,
      supportEmail: typeof email === "string" && email.includes("@") ? email : fallback.supportEmail,
      announcement: a.enabled && a.text?.trim() ? { text: a.text.trim(), link: a.link?.trim() || null } : null,
    };
  } catch {
    return fallback;
  }
});
