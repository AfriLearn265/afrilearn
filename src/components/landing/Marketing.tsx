import clsx from "clsx";
import type { ReactNode } from "react";
import { Mascot, Sparkle, WaveEdge } from "@/components/brand/Mascot";

type MascotPose = { pose?: "wave" | "stand" | "cheer"; prop?: "none" | "book" | "cap" | "star" };

/**
 * A playful pattern of tiny stars, circles and pluses on a repeating tile, drawn in the current colour.
 * (The name is kept from the first edition, which used an adire-inspired tile here.)
 */
export function AdirePattern({ id, className }: { id: string; className?: string }) {
  return (
    <svg aria-hidden="true" className={clsx("pointer-events-none absolute inset-0 h-full w-full", className)}>
      <defs>
        <pattern id={id} width="140" height="140" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="28" cy="30" r="9" />
            <path d="M104 18v18M95 27h18" />
            <path d="M30 100 q8 -12 16 0 t16 0" />
            <path d="M108 92 l5 10 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2z" />
          </g>
          <g fill="currentColor">
            <circle cx="70" cy="66" r="3" /><circle cx="128" cy="58" r="2" /><circle cx="70" cy="128" r="2.5" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Grape header shared by every public page: the title on the left and Tiko on the right. */
export function PageHero({ id, title, intro, mascot = { pose: "wave", prop: "book" }, children }: {
  id: string; title: string; intro: string; mascot?: MascotPose | false; children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-grape-700 text-white">
      <div aria-hidden="true" className="sky-dots absolute inset-0 -z-10 opacity-70" />
      <AdirePattern id={`${id}-pattern`} className="-z-10 text-grape-500/45 [mask-image:radial-gradient(70%_90%_at_85%_40%,black,transparent)]" />
      <div className={clsx("container-page grid items-center gap-8 pb-16 pt-12 md:gap-12 md:pb-24 md:pt-16", mascot && "lg:grid-cols-[1.2fr_0.8fr]")}>
        <div>
          <h1 className="max-w-[17ch] text-[2.6rem] font-semibold leading-[1.02] sm:text-5xl lg:text-[4rem]">{title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-grape-100 md:text-xl">{intro}</p>
          {children && <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">{children}</div>}
        </div>
        {mascot && (
          <div className="relative mx-auto w-full max-w-[19rem] sm:max-w-[22rem] lg:mr-0">
            <span aria-hidden="true" className="absolute inset-[8%] -z-10 rounded-full bg-sun-400/90" />
            <Sparkle className="absolute -left-2 top-2 size-9 animate-bob" color="#FF6BAA" />
            <Sparkle className="absolute -right-1 bottom-10 size-7 animate-bob [animation-delay:-2s]" color="#33C2F2" />
            <Mascot pose={mascot.pose} prop={mascot.prop} className="w-full drop-shadow-[0_18px_24px_rgb(23_10_58/0.35)]" />
          </div>
        )}
      </div>
      <WaveEdge className="absolute inset-x-0 -bottom-px" />
    </section>
  );
}

export function SectionHeading({ title, intro, light, center, className }: {
  title: string; intro?: ReactNode; light?: boolean; center?: boolean; className?: string;
}) {
  return (
    <div className={clsx("max-w-2xl", center && "mx-auto text-center", className)}>
      <h2 className={clsx("text-[2.2rem] font-semibold leading-[1.05] md:text-5xl", light && "text-white")}>{title}</h2>
      {intro && <p className={clsx("mt-4 text-lg leading-relaxed", light ? "text-grape-100" : "text-muted")}>{intro}</p>}
    </div>
  );
}

const stepColours = ["bg-tangerine-400", "bg-sun-400", "bg-lime-400", "bg-sky-400"];

/** A real sequence of steps, numbered because the order matters. */
export function Steps({ steps, className }: { steps: [string, string][]; className?: string }) {
  return (
    <ol className={clsx("relative grid gap-8 md:gap-6", steps.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4", className)}>
      {steps.map(([title, text], i) => (
        <li key={title} className="relative flex gap-5 md:block">
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="absolute left-[1.6rem] top-14 h-[calc(100%-1.5rem)] border-l-[3px] border-dashed border-grape-200 md:left-16 md:top-[1.6rem] md:h-0 md:w-[calc(100%-2.5rem)] md:border-l-0 md:border-t-[3px]" />
          )}
          <span className={clsx("sticker-sm relative z-10 grid size-[3.25rem] shrink-0 place-items-center rounded-2xl font-display text-2xl font-semibold text-ink", stepColours[i % 4], i % 2 ? "rotate-3" : "-rotate-3")}>{i + 1}</span>
          <div className="md:mt-6">
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="mt-1.5 text-muted">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Closing call to action: a sunshine sticker with Tiko cheering. */
export function CtaBand({ title, text, children, mascot = { pose: "cheer", prop: "star" } }: {
  title: string; text: string; children: ReactNode; mascot?: MascotPose;
}) {
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="sticker relative isolate grid items-center overflow-hidden rounded-[2.25rem] bg-sun-400 md:grid-cols-[1.3fr_0.7fr]">
        <AdirePattern id="cta-pattern" className="-z-10 text-sun-600/30" />
        <div className="px-6 py-10 sm:px-8 md:px-12 md:py-14">
          <h2 className="text-[2.1rem] font-semibold leading-[1.05] text-ink md:text-5xl">{title}</h2>
          <p className="mt-3 max-w-md text-lg text-ink-soft">{text}</p>
          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">{children}</div>
        </div>
        <div className="relative hidden h-full min-h-[15rem] items-end justify-center md:flex">
          <span aria-hidden="true" className="absolute -bottom-24 -right-10 size-80 rounded-full bg-tangerine-400" />
          <Mascot pose={mascot.pose} prop={mascot.prop} className="relative mb-4 w-[85%] max-w-[17rem]" />
        </div>
      </div>
    </section>
  );
}
