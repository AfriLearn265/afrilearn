import Image from "next/image";
import { Check, CircleCheck, Star } from "lucide-react";
import { Mascot, Sparkle, WaveEdge } from "@/components/brand/Mascot";
import { ButtonLink } from "@/components/ui/Button";
import { photos } from "@/config/photos";

/**
 * The first thing visitors see: a deep, glowing purple (not a flat one), a real child dressed for school,
 * and Tiko alongside. One headline, one line, two buttons.
 */
export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(160deg,var(--color-grape-950)_0%,var(--color-grape-900)_38%,var(--color-grape-700)_100%)] text-white">
      <span aria-hidden="true" className="absolute -right-32 -top-48 -z-10 size-[42rem] rounded-full bg-bubble-400/25 blur-3xl" />
      <span aria-hidden="true" className="absolute -bottom-56 -left-40 -z-10 size-[36rem] rounded-full bg-sky-400/20 blur-3xl" />
      <span aria-hidden="true" className="absolute left-1/3 top-1/4 -z-10 size-[22rem] rounded-full bg-tangerine-400/10 blur-3xl" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(70%_60%_at_60%_40%,black,transparent)]" />

      <div className="container-page grid items-center gap-10 pb-28 pt-10 md:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:pb-36">
        <div className="animate-hero-in">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-grape-100 backdrop-blur">
            <span className="size-2 rounded-full bg-lime-400" aria-hidden="true" />Primary 1 to 6 · Nigerian curriculum
          </p>
          <h1 className="mt-5 max-w-[13ch] text-[3rem] font-semibold leading-[0.98] tracking-[-0.02em] sm:text-[4.2rem] lg:text-[5rem]">
            English and Maths, <span className="text-sun-400">made fun.</span>
          </h1>
          <p className="mt-5 max-w-[30rem] text-lg leading-relaxed text-grape-100 md:text-xl">
            Short video lessons, clear notes and quizzes that feel like games, term by term.
          </p>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <ButtonLink href="#play" size="lg" variant="accent">Play a free quiz</ButtonLink>
            <ButtonLink href="/signup" size="lg" variant="light">Start learning free</ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-grape-100">
            {["Parents see every result", "Safe for children", "Term-by-term lessons"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5"><Check className="size-4 text-lime-400" strokeWidth={3} aria-hidden="true" />{t}</li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[29rem] lg:mr-0">
          <span aria-hidden="true" className="absolute -right-4 top-6 size-[78%] rounded-full bg-sun-400" />
          <div className="relative ml-auto aspect-[4/5] w-[82%] overflow-hidden rounded-[2.5rem] border-[5px] border-white shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)]">
            <Image src={photos.heroBoy.src} alt={photos.heroBoy.alt} fill priority sizes="(min-width: 1024px) 380px, 80vw" className="object-cover object-[50%_20%]" />
          </div>
          <div aria-hidden="true" className="absolute -bottom-8 -left-4 w-[46%] animate-pop-in [animation-delay:200ms] sm:-left-8">
            <Mascot pose="wave" prop="cap" className="w-full drop-shadow-[0_18px_24px_rgb(0_0_0/0.35)]" />
          </div>
          <div aria-hidden="true" className="absolute -left-2 top-8 w-52 rotate-[-4deg] animate-pop-in rounded-2xl border-2 border-ink bg-white p-3 text-ink shadow-[4px_5px_0_var(--color-ink)] [animation-delay:450ms] sm:-left-10">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-tangerine-600">Primary 5 · Maths</p>
            <p className="font-display text-lg font-semibold leading-tight">Fractions quiz</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-leaf-700"><CircleCheck className="size-4" />4 out of 4</p>
          </div>
          <div aria-hidden="true" className="absolute -right-2 bottom-20 rotate-[5deg] animate-pop-in rounded-full border-2 border-ink bg-sun-400 px-4 py-2 font-display font-semibold text-ink shadow-[3px_4px_0_var(--color-ink)] [animation-delay:650ms]">
            <Star className="mr-1 inline size-4 fill-ink" />+20 stars
          </div>
          <Sparkle className="absolute -top-4 right-10 size-9 animate-bob" color="#FF6BAA" />
          <Sparkle className="absolute bottom-2 right-[38%] size-7 animate-bob [animation-delay:-2s]" color="#9BDB4A" />
        </div>
      </div>
      <WaveEdge className="absolute inset-x-0 -bottom-px" />
    </section>
  );
}
