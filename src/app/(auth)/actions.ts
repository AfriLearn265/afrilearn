"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import { guardianRequiredLevels, type LevelKey } from "@/config/curriculum";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; message?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function safeNext(value: FormDataEntryValue | null) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : null;
}

async function origin() {
  const h = await headers();
  return siteUrl(h.get("origin") ?? (h.get("host") ? `https://${h.get("host")}` : null));
}

function authMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Log in instead, or reset your password.";
    case "weak_password":
      return "Choose a stronger password: at least 8 characters with letters and numbers.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts in a short time. Wait a minute and try again.";
    case "email_address_not_authorized":
      return "We couldn't send a confirmation email to this address yet. Ask the administrator to finish email setup.";
    case "signup_disabled":
      return "New sign-ups are closed at the moment.";
    default:
      return fallback;
  }
}

export async function login(fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!EMAIL.test(email) || !password) return { error: "Enter your email address and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: `Confirm your email address first. Open the link we sent to ${email}.` };
    }
    if (error.code === "invalid_credentials") {
      return { error: "That email and password don't match an account. Check both and try again." };
    }
    return { error: authMessage(error.code, "We couldn't log you in. Try again in a moment.") };
  }
  redirect(safeNext(fd.get("next")) ?? "/dashboard");
}

export async function signup(fd: FormData): Promise<FormState> {
  const role = str(fd, "role");
  const full_name = str(fd, "full_name");
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const errors: Record<string, string> = {};

  if (!["student", "teacher", "parent"].includes(role)) errors.role = "Choose who this account is for.";
  if (full_name.length < 2) errors.full_name = "Enter your full name.";
  if (!EMAIL.test(email)) errors.email = "Enter a valid email address.";
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = "Use at least 8 characters, including letters and numbers.";
  }
  if (fd.get("terms") !== "on") errors.terms = "Accept the terms and privacy policy to continue.";

  const meta: Record<string, unknown> = { role, full_name };

  if (role === "student") {
    const classCode = str(fd, "class_code");
    if (!classCode) errors.class_code = "Choose your class or exam.";
    meta.class_code = classCode;
    meta.interests = fd.getAll("interests").map(String).slice(0, 12);
    if (classCode) {
      const { data } = await createPublicClient().from("classes").select("education_levels(key)").eq("code", classCode).maybeSingle();
      const level = (data?.education_levels as unknown as { key: LevelKey } | null)?.key;
      if (!level) errors.class_code = "Choose a class from the list.";
      if (level && guardianRequiredLevels.includes(level)) {
        const guardian_name = str(fd, "guardian_name");
        const guardian_email = str(fd, "guardian_email").toLowerCase();
        if (guardian_name.length < 2) errors.guardian_name = "Enter the parent or guardian's name.";
        if (!EMAIL.test(guardian_email)) errors.guardian_email = "Enter the parent or guardian's email address.";
        if (fd.get("guardian_consent") !== "on") errors.guardian_consent = "A parent or guardian must give consent for this account.";
        Object.assign(meta, { guardian_name, guardian_email, guardian_consent: fd.get("guardian_consent") === "on" });
      }
    }
  } else if (role === "teacher") {
    const subjects = fd.getAll("subject_codes").map(String);
    const classes = fd.getAll("class_codes").map(String);
    const qualification = str(fd, "qualification");
    const phone = str(fd, "phone");
    if (!qualification) errors.qualification = "Enter your highest teaching qualification.";
    if (!/^[+\d][\d\s-]{6,}$/.test(phone)) errors.phone = "Enter a phone number we can reach you on.";
    if (subjects.length === 0) errors.subject_codes = "Choose at least one subject you can teach.";
    if (classes.length === 0) errors.class_codes = "Choose at least one class you can handle.";
    Object.assign(meta, {
      phone, qualification, institution: str(fd, "institution"), years_experience: str(fd, "years_experience"),
      bio: str(fd, "bio"), subject_codes: subjects, class_codes: classes,
    });
  } else if (role === "parent") {
    meta.phone = str(fd, "phone");
  }

  if (Object.keys(errors).length) {
    return { error: "Some details need your attention.", fieldErrors: errors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: meta, emailRedirectTo: `${await origin()}/auth/callback?next=/dashboard` },
  });
  if (error) return { error: authMessage(error.code, error.message) };
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: authMessage("user_already_exists", "") };
  }
  if (!data.session) {
    redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
  }

  const joinCode = str(fd, "join_code");
  if (role === "student" && joinCode) {
    const { error: joinError } = await supabase.rpc("join_classroom", { p_code: joinCode });
    if (joinError) redirect(`/dashboard?notice=${encodeURIComponent(joinError.message)}`);
  }
  redirect("/dashboard?welcome=1");
}

export async function requestPasswordReset(fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  if (!EMAIL.test(email)) return { fieldErrors: { email: "Enter the email address you signed up with." } };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/reset-password`,
  });
  if (error && error.code !== "user_not_found") {
    return { error: authMessage(error.code, "We couldn't send the reset email. Try again in a moment.") };
  }
  return { message: `If an account uses ${email}, a reset link is on its way. It expires in one hour.` };
}

export async function updatePassword(fd: FormData): Promise<FormState> {
  const password = String(fd.get("password") ?? "");
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { fieldErrors: { password: "Use at least 8 characters, including letters and numbers." } };
  }
  if (password !== String(fd.get("confirm") ?? "")) return { fieldErrors: { confirm: "The two passwords don't match." } };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.code === "same_password" ? "Choose a password you haven't used before." : "Your reset link has expired. Request a new one." };
  }
  redirect("/dashboard?notice=" + encodeURIComponent("Password updated."));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
