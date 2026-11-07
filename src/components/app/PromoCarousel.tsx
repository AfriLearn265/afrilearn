"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { Mascot, Sparkle } from "@/components/brand/Mascot";

export type Promo = {
  title: string; text: string; href: string; cta: string;
  tone: "grape" | "tangerine" | "sky";
  art: { kind: "tiko"; prop: "star" | "cap" | "book" } | { kind: "photo"; src: string; alt: string };
};

const tones = {
  grape: "bg-[radial-gradient(120%_140%_at_0%_0%,var(--color-grape-500)_0%,var(--color-grape-700)_45%,var(--color-grape-900)_100%)] text-white",
  tangerine: "bg-[radial-gradient(120%_140%_at_0%_0%,var(--color-sun-300)_0%,var(--color-tangerine-400)_55%,var(--color-tangerine-600)_100%)] text-ink",
  sky: "bg-[radial-gradient(120%_140%_at_0%_0%,var(--color-sky-100)_0%,var(--color-sky-300)_50%,var(--color-sky-400)_100%)] text-ink",
};

/** The sliding banner at the top of the pupil home: offers, school partnerships and news. Swipe or wait. */
export function PromoCarousel({ slides }: { slides: Promo[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const n = (i + slides.length) % slides.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = window.setInterval(() => go(index + 1), 5500);
    return () => window.clearInterval(t);
  }, [index, paused, go, slides.length]);

  return (
    <section aria-roledescription="carousel" aria-label="News and offers" className="relative"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div ref={track} onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-[1.75rem] scrollbar-none">
        {slides.map((s, i) => (
          <div key={s.title} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}
            className={clsx("relative isolate flex min-h-44 w-full shrink-0 snap-start items-center overflow-hidden sm:min-h-52", tones[s.tone])}>
            {s.tone === "grape" && <span aria-hidden="true" className="sky-dots absolute inset-0 -z-10 opacity-60" />}
            <div className="relative z-10 max-w-[62%] p-5 sm:max-w-[60%] sm:p-8">
              <p className="font-display text-[1.35rem] font-semibold leading-tight sm:text-3xl">{s.title}</p>
              <p className={clsx("mt-1.5 text-sm sm:text-base", s.tone === "grape" ? "text-grape-100" : "text-ink-soft")}>{s.text}</p>
              <Link href={s.href} tabIndex={i === index ? 0 : -1}
                className={clsx("mt-4 inline-flex h-10 items-center gap-1.5 rounded-full px-4 font-display text-sm font-semibold transition-transform hover:-translate-y-px",
                  s.tone === "grape" ? "border-2 border-ink bg-sun-400 text-ink shadow-[0_3px_0_var(--color-ink)]" : "bg-ink text-white shadow-[0_3px_0_rgb(0_0_0/0.25)]")}>
                {s.cta}<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            {s.art.kind === "tiko" ? (
              <div aria-hidden="true" className="absolute -bottom-3 right-1 w-[42%] max-w-60 sm:right-6">
                <Sparkle className="absolute -top-2 left-2 size-7" />
                <Mascot pose="cheer" prop={s.art.prop} className="w-full" />
              </div>
            ) : (
              <div className="absolute inset-y-0 right-0 w-[40%] sm:w-[42%]">
                <Image src={s.art.src} alt={s.art.alt} fill sizes="(min-width: 1024px) 420px, 40vw" className="object-cover" />
                <span aria-hidden="true" className={clsx("absolute inset-y-0 left-0 w-16 bg-gradient-to-r", s.tone === "sky" ? "from-sky-300" : "from-tangerine-400")} />
              </div>
            )}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {slides.map((s, i) => (
            <button key={s.title} type="button" onClick={() => go(i)} aria-label={`Show slide ${i + 1}`} aria-current={i === index}
              className={clsx("h-2.5 rounded-full transition-all", i === index ? "w-7 bg-grape-600" : "w-2.5 bg-grape-200 hover:bg-grape-300")} />
          ))}
        </div>
      )}
    </section>
  );
}
