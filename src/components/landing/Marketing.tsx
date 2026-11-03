import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { photos, type Photo as PhotoData, type PhotoKey } from "@/config/photos";

/** A photo that fills its (relatively positioned) parent. */
export function Photo({ name, sizes, className, preload }: { name: PhotoKey; sizes: string; className?: string; preload?: boolean }) {
  const p: PhotoData = photos[name];
  return (
    <Image src={p.src} alt={p.alt} fill sizes={sizes} preload={preload} quality={70}
      className={clsx("object-cover", className)} style={p.position ? { objectPosition: p.position } : undefined} />
  );
}

/**
 * An original pattern drawn from adire eleko, the Yoruba resist-dyed indigo cloth:
 * ringed suns, stitched crosses, diamonds and dotted lines on a repeating tile.
 */
export function AdirePattern({ id, className }: { id: string; className?: string }) {
  return (
    <svg aria-hidden="true" className={clsx("pointer-events-none absolute inset-0 h-full w-full", className)}>
      <defs>
        <pattern id={id} width="128" height="128" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="32" cy="32" r="20" />
            <circle cx="32" cy="32" r="11" />
            <path d="M96 12v40M76 32h40" strokeDasharray="3 5" strokeLinecap="round" />
            <path d="M32 78l18 18-18 18-18-18z" />
            <circle cx="96" cy="96" r="7" />
            <path d="M96 76v8M96 108v8M76 96h8M108 96h8M82 82l5 5M105 105l5 5M110 82l-5 5M87 105l-5 5" strokeLinecap="round" />
          </g>
          <g fill="currentColor">
            <circle cx="32" cy="32" r="3" />
            <circle cx="32" cy="96" r="3" />
            <circle cx="64" cy="64" r="2.5" /><circle cx="64" cy="8" r="2" /><circle cx="64" cy="120" r="2" />
            <circle cx="8" cy="64" r="2" /><circle cx="120" cy="64" r="2" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Indigo page header shared by every public page: title on the left, a photo in an arch on the right. */
export function PageHero({ id, title, intro, photo, children }: {
  id: string; title: string; intro: string; photo?: PhotoKey; children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-adire-900 text-white">
      <AdirePattern id={`${id}-adire`} className="-z-10 text-adire-700/70 [mask-image:radial-gradient(75%_90%_at_85%_40%,black,transparent)]" />
      <div className={clsx("container-page grid items-center gap-10 py-12 md:gap-12 md:py-20", photo && "lg:grid-cols-[1.15fr_0.85fr]")}>
        <div>
          <h1 className="max-w-[17ch] text-[2.5rem] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-5xl lg:text-[3.9rem]">{title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-adire-100 md:text-xl">{intro}</p>
          {children && <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">{children}</div>}
        </div>
        {photo && <ArchPhoto name={photo} />}
      </div>
    </section>
  );
}

export function ArchPhoto({ name, className }: { name: PhotoKey; className?: string }) {
  return (
    <div className={clsx("relative mx-auto aspect-[4/5] w-full max-w-[19rem] sm:max-w-[22rem] lg:mr-0 lg:ml-auto", className)}>
      <span aria-hidden="true" className="absolute -right-5 -top-5 size-24 rounded-full bg-sun-400 sm:size-28" />
      <div className="absolute inset-0 overflow-hidden rounded-t-full rounded-b-[2rem] ring-1 ring-white/15">
        <Photo name={name} sizes="(min-width: 640px) 22rem, 19rem" preload />
      </div>
    </div>
  );
}

export function SectionHeading({ title, intro, light, className }: { title: string; intro?: ReactNode; light?: boolean; className?: string }) {
  return (
    <div className={clsx("max-w-2xl", className)}>
      <h2 className={clsx("text-[2.1rem] font-bold leading-[1.08] md:text-5xl", light && "text-white")}>{title}</h2>
      {intro && <p className={clsx("mt-4 text-lg leading-relaxed", light ? "text-adire-100" : "text-muted")}>{intro}</p>}
    </div>
  );
}

/** A photo with its label laid over it, linking to a page. */
export function PhotoTile({ href, photo, title, text, cta, sizes, className }: {
  href: string; photo: PhotoKey; title: string; text: string; cta: string; sizes: string; className?: string;
}) {
  return (
    <Link href={href} className={clsx(
      "group relative isolate flex min-h-[25rem] flex-col justify-end overflow-hidden rounded-[1.75rem] p-6 text-white sm:min-h-[20rem] md:p-7",
      "focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-sun-400", className)}>
      <Photo name={photo} sizes={sizes} className="-z-10 transition-transform duration-700 group-hover:scale-[1.03]" />
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-adire-900/95 via-adire-900/45 to-adire-900/0" />
      <h3 className="text-2xl font-bold text-white">{title}</h3>
      <p className="mt-1.5 max-w-md text-adire-50">{text}</p>
      <span className="mt-4 text-sm font-semibold text-sun-300 underline-offset-4 group-hover:underline">{cta}</span>
    </Link>
  );
}

/** A real sequence of steps, numbered because the order matters. */
export function Steps({ steps, className }: { steps: [string, string][]; className?: string }) {
  return (
    <ol className={clsx("relative grid gap-8 md:gap-6", steps.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4", className)}>
      {steps.map(([title, text], i) => (
        <li key={title} className="relative flex gap-5 md:block">
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="absolute left-[1.3rem] top-11 h-[calc(100%-0.75rem)] w-[3px] rounded-full bg-adire-100 md:left-11 md:top-[1.3rem] md:h-[3px] md:w-[calc(100%-1.25rem)]" />
          )}
          <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-adire-700 font-display text-lg font-bold text-white">{i + 1}</span>
          <div className="md:mt-6">
            <h3 className="font-sans text-lg font-semibold tracking-normal">{title}</h3>
            <p className="mt-1.5 text-muted">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Closing call to action with a photo bleeding off the right edge. */
export function CtaBand({ title, text, photo = "joy", children }: { title: string; text: string; photo?: PhotoKey; children: ReactNode }) {
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="relative isolate grid overflow-hidden rounded-[2rem] bg-adire-700 text-white md:grid-cols-[1.2fr_0.8fr]">
        <AdirePattern id="cta-adire" className="-z-10 text-adire-600/60 [mask-image:linear-gradient(to_right,black,transparent_70%)]" />
        <div className="px-6 py-9 sm:px-7 sm:py-10 md:px-12 md:py-14">
          <h2 className="text-3xl font-bold text-white md:text-4xl">{title}</h2>
          <p className="mt-3 max-w-md text-lg text-adire-100">{text}</p>
          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">{children}</div>
        </div>
        <div className="relative hidden min-h-[16rem] md:block">
          <Photo name={photo} sizes="(min-width: 768px) 40vw, 0px" />
        </div>
      </div>
    </section>
  );
}
