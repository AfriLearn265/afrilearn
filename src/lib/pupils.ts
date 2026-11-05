import "server-only";
import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Pupil accounts made by a parent or the school. Young pupils often have no email address,
 * so they sign in with a short login ID (for example "amina.y482") that maps to an internal address.
 * No email is ever sent to these addresses.
 */
export const PUPIL_EMAIL_DOMAIN = "pupils.afrilearn.ng";

export function pupilEmail(loginId: string) {
  return `${loginId.trim().toLowerCase()}@${PUPIL_EMAIL_DOMAIN}`;
}

/** "Amina Yusuf" -> "amina.y482" */
function makeLoginId(fullName: string) {
  const parts = fullName.toLowerCase().normalize("NFKD").replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  const first = (parts[0] ?? "pupil").slice(0, 12);
  const initial = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}.${initial}${randomInt(100, 1000)}`;
}

const WORDS = ["mango", "tiger", "rocket", "banana", "zebra", "sunny", "pepper", "comet", "guava", "parrot", "lion", "river",
  "drum", "kite", "star", "eagle", "lemon", "cloud", "orange", "hippo", "panda", "melon", "tulip", "maple"];

/** Easy for a child to type and remember: "mango-rocket-47". */
export function friendlyPassword() {
  const a = WORDS[randomInt(WORDS.length)];
  let b = WORDS[randomInt(WORDS.length)];
  while (b === a) b = WORDS[randomInt(WORDS.length)];
  return `${a}-${b}-${randomInt(10, 100)}`;
}

export type NewPupil = { fullName: string; classCode: string; guardianName?: string | null; guardianEmail?: string | null; password?: string | null };
export type CreatedPupil = { id: string; fullName: string; loginId: string; password: string };

export async function createPupilAccount(p: NewPupil, createdBy: string): Promise<{ error?: string; pupil?: CreatedPupil }> {
  const admin = createAdminClient();
  if (!admin) return { error: "Pupil accounts can't be created yet: the server's Supabase secret key is missing." };
  const fullName = p.fullName.replace(/\s+/g, " ").trim().slice(0, 120);
  if (fullName.length < 2) return { error: "Enter the pupil's full name." };
  const password = p.password?.trim() || friendlyPassword();
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { error: "Use a password of at least 8 characters with letters and numbers, or leave it empty and we'll make one." };
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    const loginId = makeLoginId(fullName);
    const { data, error } = await admin.auth.admin.createUser({
      email: pupilEmail(loginId), password, email_confirm: true,
      user_metadata: {
        role: "student", full_name: fullName, class_code: p.classCode,
        guardian_name: p.guardianName ?? null, guardian_email: p.guardianEmail ?? null, guardian_consent: true,
        login_id: loginId, created_by: createdBy,
      },
    });
    if (!error && data.user) return { pupil: { id: data.user.id, fullName, loginId, password } };
    if (error && !/already|exists|registered/i.test(error.message)) return { error: error.message };
  }
  return { error: "We couldn't make a unique login ID. Try again." };
}
