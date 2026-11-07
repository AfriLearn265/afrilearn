import Image from "next/image";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Mascot, Sparkle, WaveEdge } from "@/components/brand/Mascot";
import { SubjectArt } from "@/components/brand/SubjectArt";

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

export type HeroTheme = "grape" | "sun" | "bubble" | "sky" | "tangerine" | "lime" | "lavender" | "ink" | "coral";
export type HeroArt =
  | { kind: "tiko"; pose?: MascotPose["pose"]; prop?: MascotPose["prop"] }
  | { kind: "photo"; src: string; alt: string; tiko?: boolean }
  | { kind: "numbers" } | { kind: "questions" } | { kind: "sheets" } | { kind: "phone" } | { kind: "subjects" } | { kind: "none" };

const heroThemes: Record<HeroTheme, { bg: string; text: string; intro: string; blob: string; dark: boolean }> = {
  grape: { bg: "bg-[linear-gradient(160deg,var(--color-grape-950),var(--color-grape-700))]", text: "text-white", intro: "text-grape-100", blob: "bg-bubble-400/25", dark: true },
  ink: { bg: "bg-ink", text: "text-white", intro: "text-grape-100", blob: "bg-sky-400/20", dark: true },
  sun: { bg: "bg-sun-400", text: "text-ink", intro: "text-ink/75", blob: "bg-tangerine-400/40", dark: false },
  bubble: { bg: "bg-bubble-100", text: "text-ink", intro: "text-ink-soft", blob: "bg-bubble-300/50", dark: false },
  sky: { bg: "bg-sky-300", text: "text-ink", intro: "text-ink/75", blob: "bg-sky-100/70", dark: false },
  tangerine: { bg: "bg-tangerine-400", text: "text-ink", intro: "text-ink/75", blob: "bg-sun-300/60", dark: false },
  lime: { bg: "bg-lime-300", text: "text-ink", intro: "text-ink/75", blob: "bg-lime-100/70", dark: false },
  lavender: { bg: "bg-grape-100", text: "text-ink", intro: "text-ink-soft", blob: "bg-grape-200/70", dark: false },
  coral: { bg: "bg-coral-100", text: "text-ink", intro: "text-ink-soft", blob: "bg-tangerine-300/50", dark: false },
};

/** Whether a page header's colour is dark, so its buttons can pick the right style. */
export const heroIsDark = (theme: HeroTheme) => heroThemes[theme].dark;

/**
 * The header at the top of each public page. Every page has its own colour and its own picture,
 * so moving from one page to the next is obvious at a glance.
 */
export function PageHero({ title, intro, theme = "grape", art = { kind: "tiko" }, children }: {
  id?: string; title: string; intro: string; theme?: HeroTheme; art?: HeroArt; children?: ReactNode;
}) {
  const t = heroThemes[theme];
  const hasArt = art.kind !== "none";
  return (
    <section className={clsx("relative isolate overflow-hidden print:hidden", t.bg, t.text)}>
      <span aria-hidden="true" className={clsx("absolute -right-24 -top-32 -z-10 size-[28rem] rounded-full blur-3xl", t.blob)} />
      <div className={clsx("container-page grid items-center gap-8 pb-16 pt-12 md:gap-12 md:pb-24 md:pt-16", hasArt ? "lg:grid-cols-[1.2fr_0.8fr]" : "text-center")}>
        <div className={clsx(!hasArt && "mx-auto max-w-3xl")}>
          <h1 className={clsx("text-[2.6rem] font-semibold leading-[1.02] sm:text-5xl lg:text-[4rem]", hasArt ? "max-w-[17ch]" : "mx-auto max-w-[20ch]")}>{title}</h1>
          <p className={clsx("mt-5 text-lg leading-relaxed md:text-xl", t.intro, hasArt ? "max-w-xl" : "mx-auto max-w-2xl")}>{intro}</p>
          {children && <div className={clsx("mt-8 grid gap-3 sm:flex sm:flex-wrap", !hasArt && "sm:justify-center")}>{children}</div>}
        </div>
        {hasArt && (
          // Phones keep only real photos here, so headers stay short and the page starts quickly.
          <div className={clsx("relative mx-auto w-full max-w-[19rem] sm:max-w-[22rem] lg:mr-0", art.kind !== "photo" && "hidden sm:block")}><HeroPicture art={art} /></div>
        )}
      </div>
      <WaveEdge className="absolute inset-x-0 -bottom-px" />
    </section>
  );
}

const blockTones = ["bg-tangerine-400", "bg-sun-300", "bg-lime-400", "bg-sky-400", "bg-bubble-400", "bg-grape-400"];

function HeroPicture({ art }: { art: HeroArt }) {
  switch (art.kind) {
    case "photo":
      return (
        <div className="relative">
          <span aria-hidden="true" className="absolute -right-3 -top-3 size-full rounded-[2.5rem] border-[3px] border-ink" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border-[3px] border-ink bg-white">
            <Image src={art.src} alt={art.alt} fill sizes="(min-width: 1024px) 352px, 80vw" className="object-cover" />
          </div>
          {art.tiko && <Mascot pose="wave" prop="book" className="absolute -bottom-8 -left-10 w-[45%] drop-shadow-[0_12px_16px_rgb(0_0_0/0.25)]" />}
          <Sparkle className="absolute -left-4 top-6 size-9 animate-bob" color="#FFCB2E" />
        </div>
      );
    case "numbers":
      return (
        <div aria-hidden="true" className="grid grid-cols-3 gap-3 p-2">
          {[1, 2, 3, 4, 5, 6].map((n, i) => (
            <span key={n} className={clsx("sticker grid aspect-square place-items-center rounded-[1.4rem] font-display text-5xl font-semibold text-ink sm:text-6xl", blockTones[i], i % 2 ? "rotate-3" : "-rotate-3", i === 4 && "translate-y-3")}>{n}</span>
          ))}
        </div>
      );
    case "questions":
      return (
        <div aria-hidden="true" className="relative aspect-square">
          {[["left-0 top-6 bg-white", "?"], ["right-2 top-0 bg-sun-400", "?"], ["bottom-6 left-10 bg-bubble-400", "!"]].map(([pos, ch], i) => (
            <span key={i} className={clsx("sticker absolute grid size-[44%] place-items-center rounded-[2rem] font-display text-7xl font-semibold text-ink", pos, i === 1 ? "rotate-6" : "-rotate-6")}>{ch}</span>
          ))}
          <Mascot pose="stand" prop="none" className="absolute -bottom-2 right-0 w-[50%]" />
        </div>
      );
    case "sheets":
      return (
        <div aria-hidden="true" className="relative aspect-square">
          {["left-2 top-8 -rotate-12 bg-sky-100", "left-1/4 top-2 rotate-3 bg-white", "right-2 top-10 rotate-12 bg-tangerine-100"].map((pos, i) => (
            <span key={i} className={clsx("sticker absolute flex h-[72%] w-[50%] flex-col gap-2 rounded-2xl p-4", pos)}>
              <span className="h-3 w-2/3 rounded-full bg-ink/80" />
              {[0, 1, 2, 3, 4].map((l) => <span key={l} className="h-2 rounded-full bg-ink/15" />)}
              <span className="mt-auto inline-flex self-start rounded-full bg-lime-400 px-2 py-0.5 text-xs font-bold text-ink">PDF</span>
            </span>
          ))}
        </div>
      );
    case "phone":
      return (
        <div aria-hidden="true" className="relative mx-auto w-[70%]">
          <div className="sticker relative aspect-[9/17] overflow-hidden rounded-[2.4rem] bg-grape-600 p-3">
            <div className="grid h-full place-items-center rounded-[1.8rem] bg-sun-400">
              <Mascot pose="cheer" prop="star" className="w-[85%]" />
            </div>
          </div>
          <Sparkle className="absolute -right-6 top-10 size-9 animate-bob" color="#9BDB4A" />
        </div>
      );
    case "subjects":
      return (
        <div aria-hidden="true" className="grid gap-3">
          {(["english", "mathematics", "basic-science"] as const).map((code, i) => (
            <span key={code} className={clsx("sticker grid h-24 place-items-center rounded-[1.4rem]", ["bg-sky-400", "bg-tangerine-400", "bg-lime-400"][i], i === 1 ? "translate-x-6 rotate-2" : "-rotate-2")}>
              <SubjectArt code={code} className="h-20 w-auto" />
            </span>
          ))}
        </div>
      );
    case "tiko":
      return (
        <>
          <span aria-hidden="true" className="absolute inset-[8%] -z-10 rounded-full bg-sun-400/90" />
          <Sparkle className="absolute -left-2 top-2 size-9 animate-bob" color="#FF6BAA" />
          <Sparkle className="absolute -right-1 bottom-10 size-7 animate-bob [animation-delay:-2s]" color="#33C2F2" />
          <Mascot pose={art.pose ?? "wave"} prop={art.prop ?? "book"} className="w-full drop-shadow-[0_18px_24px_rgb(23_10_58/0.35)]" />
        </>
      );
    default:
      return null;
  }
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
