import Link from "next/link";
import clsx from "clsx";
import type { CatalogueClass } from "@/config/curriculum";
import { classNumber, lookFor } from "@/config/classLook";

const tilts = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "-rotate-1", "rotate-1"];

/** Primary 1 to 6 as six chunky building blocks. They are a real sequence, so each shows its number. */
export function ClassBlocks({ classes, hrefFor, simple }: { classes: CatalogueClass[]; hrefFor?: (c: CatalogueClass) => string; simple?: boolean }) {
  const primary = classes.filter((c) => c.level === "primary");
  return (
    <ul className={clsx("grid sm:gap-5 md:grid-cols-3 lg:grid-cols-6", simple ? "grid-cols-3 gap-3" : "grid-cols-2 gap-4")}>
      {primary.map((c, i) => {
        const look = lookFor(c.code);
        return (
          <li key={c.code}>
            <Link href={hrefFor ? hrefFor(c) : `/classes#${c.code.toLowerCase()}`}
              className={clsx("sticker group flex h-full flex-col rounded-[1.6rem] text-ink transition-transform duration-200 hover:-translate-y-1 hover:rotate-0 focus-visible:rotate-0 sm:p-5",
                simple ? "p-3" : "p-4", look.bg, tilts[i % tilts.length])}>
              <span className={clsx("font-display font-semibold leading-[0.85] sm:text-[5rem]", simple ? "text-[3.2rem]" : "text-[4.2rem]")}>{classNumber(c.name)}</span>
              <span className={clsx("mt-3 font-display font-semibold leading-tight sm:text-xl", simple ? "text-[0.95rem]" : "text-lg")}>{c.name}</span>
              {simple ? (
                <span className="text-xs font-semibold text-ink/70 sm:text-sm"><span className="sm:hidden">{look.age.replace("About age", "Age")}</span><span className="hidden sm:inline">{look.age}</span></span>
              ) : <span className="text-sm font-semibold text-ink/70">{look.age}</span>}
              {!simple && (
                <>
                  <span className="mt-2 text-sm leading-snug text-ink/85">{look.about}</span>
                  <span className="mt-auto pt-4 text-sm font-bold underline decoration-2 underline-offset-4 group-hover:decoration-[3px]">
                    See {c.subjects.length} subjects
                  </span>
                </>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
