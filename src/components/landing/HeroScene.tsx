import clsx from "clsx";
import { Play, Radio, Star } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Mascot, Sparkle } from "@/components/brand/Mascot";

/** The home page picture: Tiko on a sun, surrounded by stickers of real moments from the platform. */
export function HeroScene() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[30rem] lg:mr-0">
      <span aria-hidden="true" className="absolute inset-[9%] rounded-full bg-sun-400 animate-hero-in" />
      <span aria-hidden="true" className="absolute inset-[9%] rounded-full border-[3px] border-dashed border-white/40 [transform:scale(1.13)]" />
      <Sparkle className="absolute left-[4%] top-[14%] size-10 animate-bob" color="#FF6BAA" />
      <Sparkle className="absolute bottom-[12%] right-[2%] size-8 animate-bob [animation-delay:-1.5s]" color="#9BDB4A" />
      <Sparkle className="absolute right-[18%] top-[1%] size-6 animate-bob [animation-delay:-3s]" color="#33C2F2" />

      <div className="absolute inset-x-[12%] bottom-[14%] animate-pop-in [animation-delay:150ms]">
        <Mascot pose="wave" prop="cap" title="Tiko the tortoise, waving" className="w-full drop-shadow-[0_22px_28px_rgb(23_10_58/0.35)]" />
      </div>

      <div aria-hidden="true">
        <StickerCard className="left-[-2%] top-[6%] w-[52%] sm:left-[-6%]" tilt={-5} delay={550}>
          <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-grape-600">
            <span className="absolute -left-4 -top-6 size-20 rounded-full bg-bubble-400" />
            <span className="absolute -bottom-8 right-2 size-16 rounded-full bg-sky-400" />
            <span className="relative grid size-10 place-items-center rounded-full border-2 border-ink bg-white sm:size-12">
              <Play className="ml-0.5 size-5 fill-ink text-ink" />
            </span>
          </div>
          <p className="mt-2 font-display text-[0.85rem] font-semibold leading-tight sm:text-base">Equivalent fractions</p>
          <p className="text-[0.72rem] text-muted sm:text-xs">Primary 5 Maths video</p>
        </StickerCard>

        <StickerCard className="right-[-2%] top-[30%] sm:right-[-5%]" tilt={6} delay={750} tone="bg-lime-300">
          <p className="font-display text-[0.85rem] font-semibold sm:text-base">Quiz done!</p>
          <p className="font-display text-2xl font-semibold leading-none sm:text-3xl">9<span className="text-base text-ink-soft"> / 10</span></p>
          <span className="mt-1 flex gap-0.5">{[0, 1, 2].map((i) => <Star key={i} className="size-4 fill-sun-400 text-ink" strokeWidth={2.5} />)}</span>
        </StickerCard>

        <StickerCard className="bottom-[5%] left-[0%] sm:left-[-3%]" tilt={-3} delay={950} tone="bg-sky-300" row>
          <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-coral-500 text-white">
            <Radio className="size-4" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[0.85rem] font-semibold sm:text-sm">Live class, 4:00 pm</span>
            <span className="block text-[0.72rem] text-ink-soft sm:text-xs">Fractions with pizza</span>
          </span>
        </StickerCard>

        <span className="sticker-sm absolute bottom-[26%] right-[4%] rotate-[8deg] rounded-full bg-bubble-400 px-3 py-1 font-display text-sm font-semibold text-ink animate-pop-in [--tilt:8deg] [animation-delay:1150ms] sm:text-base">
          +20 points
        </span>
      </div>
    </div>
  );
}

function StickerCard({ className, tilt, delay, tone = "bg-white", row, children }: {
  className: string; tilt: number; delay: number; tone?: string; row?: boolean; children: ReactNode;
}) {
  return (
    <div className={clsx("sticker absolute z-10 rounded-2xl p-2.5 text-ink animate-pop-in sm:p-3", tone, row && "flex items-center gap-2.5 pr-4", className)}
      style={{ "--tilt": `${tilt}deg`, animationDelay: `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
