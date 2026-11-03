import Link from "next/link";
import { brand } from "@/config/brand";

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

export function Logo({ href = "/", tone = "dark", className = "" }: { href?: string; tone?: "dark" | "light"; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 rounded-lg ${className}`} aria-label={`${brand.name} home`}>
      <LogoMark />
      <span className={`font-display text-[1.35rem] font-bold tracking-tight ${tone === "light" ? "text-white" : "text-ink"}`}>
        {brand.name}
      </span>
    </Link>
  );
}
