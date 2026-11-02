import clsx from "clsx";
import { CircleCheck, Video } from "lucide-react";
import type { ComponentType } from "react";
import { Photo } from "./Marketing";

/** The home page picture: learners in adire-inspired shapes, with two moments from the product. */
export function HeroCollage() {
  return (
    <div className="relative mx-auto h-[25rem] w-full max-w-[34rem] sm:h-[32rem] lg:mr-0 lg:h-[36rem]">
      <span aria-hidden="true" className="absolute right-[3%] top-0 size-28 rounded-full bg-sun-400 animate-hero-in sm:size-36" />
      <div className="absolute right-0 top-[7%] h-[86%] w-[62%] overflow-hidden rounded-t-full rounded-b-[2.25rem] ring-1 ring-white/15 animate-hero-in"
        style={{ animationDelay: "120ms" }}>
        <Photo name="heroLearner" sizes="(min-width: 1024px) 21rem, 62vw" preload />
      </div>
      <div className="absolute left-0 top-[2%] h-[42%] w-[44%] overflow-hidden rounded-[1.75rem] ring-1 ring-white/15 animate-hero-in"
        style={{ animationDelay: "260ms" }}>
        <Photo name="heroOnline" sizes="(min-width: 1024px) 15rem, 44vw" preload />
      </div>
      <div className="absolute bottom-[2%] left-[4%] aspect-square w-[40%] overflow-hidden rounded-full ring-[6px] ring-adire-900 animate-hero-in"
        style={{ animationDelay: "400ms" }}>
        <Photo name="pupils" sizes="(min-width: 1024px) 14rem, 40vw" preload />
      </div>
      <div aria-hidden="true">
        <Moment className="left-[20%] top-[47%]" delay={750} icon={CircleCheck} tone="bg-leaf-100 text-leaf-700"
          title="Test 1 marked" detail="85%, grade A1" />
        <Moment className="bottom-[5%] right-[2%]" delay={950} icon={Video} tone="bg-sun-100 text-sun-600"
          title="Live class at 4:00 pm" detail="Completing the square" />
      </div>
    </div>
  );
}

function Moment({ className, delay, icon: Icon, tone, title, detail }: {
  className: string; delay: number; icon: ComponentType<{ className?: string }>; tone: string; title: string; detail: string;
}) {
  return (
    <div className={clsx("absolute z-10 flex items-center gap-3 rounded-2xl bg-white py-2.5 pl-2.5 pr-4 text-ink shadow-pop animate-hero-in", className)}
      style={{ animationDelay: `${delay}ms` }}>
      <span className={clsx("grid size-9 shrink-0 place-items-center rounded-xl", tone)}><Icon className="size-[1.15rem]" /></span>
      <span className="leading-tight">
        <span className="block whitespace-nowrap text-sm font-semibold">{title}</span>
        <span className="block whitespace-nowrap text-[0.8rem] text-muted">{detail}</span>
      </span>
    </div>
  );
}
