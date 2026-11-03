import clsx from "clsx";

/** A person's photo, or their initials on a sun-yellow disc when they haven't added one. */
export function Avatar({ name, url, className = "size-10 text-base" }: { name: string; url: string | null | undefined; className?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
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
