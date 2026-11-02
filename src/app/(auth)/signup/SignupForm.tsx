"use client";

import { useState } from "react";
import clsx from "clsx";
import { Eye, EyeOff, GraduationCap, Presentation, UsersRound } from "lucide-react";
import { signup } from "../actions";
import { useServerForm } from "@/components/ui/useServerForm";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui/Field";
import { guardianRequiredLevels, interestOptions, type CatalogueLevel, type LevelKey } from "@/config/curriculum";
import type { SubjectOption } from "@/lib/catalogue";

type Role = "student" | "teacher" | "parent";
type ClassOption = { code: string; name: string; level: LevelKey };

const roles: { value: Role; label: string; sub: string; icon: typeof GraduationCap }[] = [
  { value: "student", label: "Student", sub: "Learn and practise", icon: GraduationCap },
  { value: "parent", label: "Parent or guardian", sub: "Follow my children", icon: UsersRound },
  { value: "teacher", label: "Teacher", sub: "Apply to teach", icon: Presentation },
];

function Chip({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="inline-flex rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink-soft transition-colors
        hover:border-adire-300 peer-checked:border-adire-700 peer-checked:bg-adire-700 peer-checked:text-white
        peer-focus-visible:ring-4 peer-focus-visible:ring-sun-300">{label}</span>
    </label>
  );
}

export function SignupForm({ initialRole, initialClass, levels, classes, subjects }: {
  initialRole: Role; initialClass?: string; levels: CatalogueLevel[]; classes: ClassOption[]; subjects: SubjectOption[];
}) {
  const { state, pending, onSubmit, fieldError } = useServerForm(signup);
  const [role, setRole] = useState<Role>(initialRole);
  const [classCode, setClassCode] = useState(classes.some((c) => c.code === initialClass) ? initialClass! : "");
  const [show, setShow] = useState(false);
  const level = classes.find((c) => c.code === classCode)?.level;
  const needsGuardian = role === "student" && !!level && guardianRequiredLevels.includes(level);
  const err = (n: string) => fieldError(n);
  const aria = (n: string) => (err(n) ? { "aria-invalid": true as const, "aria-describedby": `${n}-error` } : {});

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-6" noValidate>
      {state.error && <Notice tone="error">{state.error}</Notice>}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-soft">This account is for</legend>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
          {roles.map(({ value, label, sub, icon: Icon }) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="peer sr-only" />
              <span className="flex h-full items-start gap-3 rounded-xl border border-line bg-white p-3.5 transition-colors hover:border-adire-300
                peer-checked:border-adire-700 peer-checked:bg-adire-50 peer-checked:shadow-[inset_0_0_0_1px_var(--color-adire-700)] peer-focus-visible:ring-4 peer-focus-visible:ring-sun-300">
                <Icon className="mt-0.5 size-5 shrink-0 text-adire-700" aria-hidden="true" />
                <span><span className="block font-semibold leading-tight">{label}</span><span className="text-sm text-muted">{sub}</span></span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={role === "student" && needsGuardian ? "Pupil's full name" : "Full name"} htmlFor="full_name" error={err("full_name")} className="sm:col-span-2">
          <Input id="full_name" name="full_name" autoComplete="name" required {...aria("full_name")} />
        </Field>
        <Field label="Email address" htmlFor="email" error={err("email")}
          hint={needsGuardian ? "A parent's email is fine" : undefined}>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required {...aria("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={err("password")} hint="8+ characters, letters and numbers">
          <div className="relative">
            <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="new-password" required className="pr-12" {...aria("password")} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-ink"
              aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
      </div>

      {role === "student" && (
        <>
          <Field label="Class or exam" htmlFor="class_code" error={err("class_code")}>
            <Select id="class_code" name="class_code" value={classCode} onChange={(e) => setClassCode(e.target.value)} required {...aria("class_code")}>
              <option value="" disabled>Choose your class</option>
              {levels.map((l) => (
                <optgroup key={l.key} label={l.name}>
                  {classes.filter((c) => c.level === l.key).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </optgroup>
              ))}
            </Select>
          </Field>

          {needsGuardian && (
            <fieldset className="grid gap-4 rounded-2xl border border-sun-400/60 bg-sun-100/60 p-5">
              <legend className="px-1 text-sm font-semibold">Parent or guardian</legend>
              <p className="text-sm text-ink-soft">Pupils in Nursery and Primary need a parent or guardian to set up their account. If you are the parent, you can also create a parent account later and link this pupil.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Parent or guardian's name" htmlFor="guardian_name" error={err("guardian_name")}>
                  <Input id="guardian_name" name="guardian_name" autoComplete="off" {...aria("guardian_name")} />
                </Field>
                <Field label="Their email address" htmlFor="guardian_email" error={err("guardian_email")}>
                  <Input id="guardian_email" name="guardian_email" type="email" inputMode="email" {...aria("guardian_email")} />
                </Field>
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="guardian_consent" className="mt-0.5 size-4 accent-adire-700" />
                <span>I am this pupil&apos;s parent or guardian and I agree to them using this account.</span>
              </label>
              {err("guardian_consent") && <p className="text-sm text-coral-700">{err("guardian_consent")}</p>}
            </fieldset>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-soft">What do you enjoy learning? <span className="font-normal text-muted">Optional</span></legend>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((i) => <Chip key={i} name="interests" value={i} label={i} />)}
            </div>
          </fieldset>

          <Field label="Class code from your teacher" htmlFor="join_code" hint="Optional, you can add it later">
            <Input id="join_code" name="join_code" maxLength={12} autoComplete="off" className="uppercase tracking-[0.2em]" placeholder="e.g. K7M2QX" />
          </Field>
        </>
      )}

      {role === "teacher" && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Phone number" htmlFor="phone" error={err("phone")}>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0803 000 0000" {...aria("phone")} />
            </Field>
            <Field label="Years of teaching" htmlFor="years_experience">
              <Input id="years_experience" name="years_experience" type="number" min={0} max={60} inputMode="numeric" />
            </Field>
            <Field label="Highest qualification" htmlFor="qualification" error={err("qualification")}>
              <Input id="qualification" name="qualification" placeholder="e.g. B.Ed Mathematics, NCE, PGDE" {...aria("qualification")} />
            </Field>
            <Field label="Current school or institution" htmlFor="institution" hint="Optional">
              <Input id="institution" name="institution" />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-soft">Subjects you can teach</legend>
            <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-xl border border-line bg-paper p-3">
              {subjects.map((s) => <Chip key={s.code} name="subject_codes" value={s.code} label={s.name} />)}
            </div>
            {err("subject_codes") && <p className="mt-1.5 text-sm text-coral-700">{err("subject_codes")}</p>}
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-soft">Classes you can handle</legend>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => <Chip key={c.code} name="class_codes" value={c.code} label={c.name} />)}
            </div>
            {err("class_codes") && <p className="mt-1.5 text-sm text-coral-700">{err("class_codes")}</p>}
          </fieldset>
          <Field label="About your teaching" htmlFor="bio" hint="Optional">
            <Textarea id="bio" name="bio" maxLength={2000} placeholder="Where you have taught and what your students achieved." />
          </Field>
          <Notice tone="info">An administrator reviews every teacher application. After you submit, you can upload your certificates from your application page.</Notice>
        </>
      )}

      {role === "parent" && (
        <>
          <Field label="Phone number" htmlFor="phone" hint="Optional">
            <Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" />
          </Field>
          <Notice tone="info">After you sign up, link each child with the code shown on their profile page.</Notice>
        </>
      )}

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-adire-700" />
          <span>I agree to the <a href="/terms" target="_blank" className="font-semibold text-adire-700 hover:underline">terms of use</a> and <a href="/privacy" target="_blank" className="font-semibold text-adire-700 hover:underline">privacy policy</a>.</span>
        </label>
        {err("terms") && <p className="mt-1.5 text-sm text-coral-700">{err("terms")}</p>}
      </div>

      <Button type="submit" size="lg" loading={pending} className={clsx(pending && "cursor-wait")}>
        {pending ? "Creating your account" : role === "teacher" ? "Submit teacher application" : role === "parent" ? "Create parent account" : "Create student account"}
      </Button>
    </form>
  );
}
