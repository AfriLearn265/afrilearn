const TZ = "Africa/Lagos";

export function timeAgo(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

export function formatDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-NG", { timeZone: TZ, ...opts }).format(new Date(iso));
}

export function formatDateTime(iso: string | Date) {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  }).format(new Date(iso));
}

export function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-NG", { timeZone: TZ, hour: "numeric", hour12: false }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export function pct(n: number | null | undefined) {
  return n == null ? "–" : `${Math.round(Number(n))}%`;
}
