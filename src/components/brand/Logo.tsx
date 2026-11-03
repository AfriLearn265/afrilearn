"use client";

import Link from "next/link";
import { useBrand } from "./BrandProvider";

/** Brand mark: a path climbing three steps toward a sun. Original artwork. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#2B3A9F" />
      <path d="M7 23.5h5.5v-5h5.5v-5h5.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="8.6" r="3" fill="#F6B93B" />
    </svg>
  );
}

/** The logo uploaded in Settings, or the built-in mark when there isn't one. */
export function BrandMark({ className = "size-8" }: { className?: string }) {
  const { logoUrl } = useBrand();
  if (!logoUrl) return <LogoMark className={className} />;
  // eslint-disable-next-line @next/next/no-img-element -- small uploaded logo, any size or format
  return <img src={logoUrl} alt="" className={`${className} rounded-[9px] object-contain`} />;
}

export function Logo({ href = "/", tone = "dark", className = "" }: { href?: string; tone?: "dark" | "light"; className?: string }) {
  const { name } = useBrand();
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 rounded-lg ${className}`} aria-label={`${name} home`}>
      <BrandMark />
      <span className={`font-display text-[1.35rem] font-bold tracking-tight ${tone === "light" ? "text-white" : "text-ink"}`}>
        {name}
      </span>
    </Link>
  );
}
