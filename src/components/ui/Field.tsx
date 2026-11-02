import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-xl border border-line bg-white px-3.5 text-[0.95rem] text-ink placeholder:text-faint " +
  "transition-colors hover:border-adire-200 focus:border-adire-500 focus:outline-none focus:ring-4 focus:ring-adire-100 " +
  "disabled:bg-wash disabled:text-muted aria-[invalid=true]:border-coral-500";

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-3 text-sm font-semibold text-ink-soft">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={clsx(control, "h-11", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={clsx(control, "h-11 appearance-none bg-[length:1.1rem] bg-[right_0.8rem_center] bg-no-repeat pr-10", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235A6189' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={clsx(control, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Field({ label, htmlFor, hint, error, children, className }: {
  label: ReactNode; htmlFor: string; hint?: ReactNode; error?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} hint={hint}>{label}</Label>
      {children}
      {error && <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-coral-700">{error}</p>}
    </div>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "error" | "success" | "warning"; title?: string; children?: ReactNode }) {
  const tones = {
    info: "border-adire-200 bg-adire-50 text-adire-900",
    error: "border-coral-500/30 bg-coral-100 text-coral-700",
    success: "border-leaf-500/30 bg-leaf-100 text-leaf-700",
    warning: "border-sun-400/60 bg-sun-100 text-ink",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={clsx("rounded-xl border px-4 py-3 text-sm leading-relaxed", tones[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-0.5" : undefined}>{children}</div>}
    </div>
  );
}
