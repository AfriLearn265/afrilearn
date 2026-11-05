import clsx from "clsx";
import { CritterFace, critterFromUrl } from "@/components/brand/Critters";

/** A person's photo, their chosen cartoon character, or their initials on a sun-yellow disc. */
export function Avatar({ name, url, className = "size-10 text-base" }: { name: string; url: string | null | undefined; className?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
  const critter = critterFromUrl(url);
  if (critter) return <CritterFace kind={critter} className={className} />;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded photo from storage
    return <img src={url} alt="" className={clsx("shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <span aria-hidden="true" className={clsx("grid shrink-0 place-items-center rounded-full bg-sun-400 font-display font-bold text-ink", className)}>
      {initials}
    </span>
  );
}
