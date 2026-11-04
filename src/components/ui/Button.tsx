import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger" | "light" | "onDark";
type Size = "sm" | "md" | "lg";

// A chunky "pressable" look: a solid shadow under the pill that shrinks when it is pressed.
const press = {
  grape: "shadow-[0_4px_0_var(--color-grape-900)] hover:shadow-[0_5px_0_var(--color-grape-900)] active:shadow-[0_1px_0_var(--color-grape-900)]",
  ink: "shadow-[0_4px_0_var(--color-ink)] hover:shadow-[0_5px_0_var(--color-ink)] active:shadow-[0_1px_0_var(--color-ink)]",
  coral: "shadow-[0_4px_0_var(--color-coral-700)] hover:shadow-[0_5px_0_var(--color-coral-700)] active:shadow-[0_1px_0_var(--color-coral-700)]",
  soft: "shadow-[0_4px_0_rgb(23_10_58/0.35)] hover:shadow-[0_5px_0_rgb(23_10_58/0.35)] active:shadow-[0_1px_0_rgb(23_10_58/0.35)]",
};
const lift = "hover:-translate-y-px active:translate-y-[3px]";

const variants: Record<Variant, string> = {
  primary: `bg-grape-600 text-white hover:bg-grape-500 ${press.grape} ${lift}`,
  accent: `border-2 border-ink bg-sun-400 text-ink hover:bg-sun-300 ${press.ink} ${lift}`,
  outline: "border-2 border-line bg-white text-ink hover:border-grape-300 hover:bg-grape-50",
  ghost: "text-ink-soft hover:bg-wash hover:text-ink",
  danger: `bg-coral-500 text-white hover:bg-coral-700 ${press.coral} ${lift}`,
  light: `bg-white text-grape-800 hover:bg-grape-50 ${press.soft} ${lift}`,
  onDark: "border-2 border-white/40 text-white hover:border-white hover:bg-white/10",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-[0.95rem] gap-2",
  lg: "h-14 px-7 text-[1.05rem] gap-2.5",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return clsx(
    "inline-flex items-center justify-center rounded-full font-display font-semibold tracking-[0.005em] whitespace-nowrap transition-[transform,box-shadow,background-color,border-color]",
    "disabled:pointer-events-none disabled:opacity-55",
    variants[variant], sizes[size], extra,
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean };

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href, variant = "primary", size = "md", className, children, ...props
}: { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode } & Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={clsx("animate-spin", className)} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
