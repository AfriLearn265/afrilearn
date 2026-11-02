"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import clsx from "clsx";
import { ButtonLink } from "@/components/ui/Button";
import type { CatalogueClass, CatalogueLevel } from "@/config/curriculum";

const shortLabel = (c: CatalogueClass) => (c.code === "SCHOLARSHIP" ? "Entrance" : c.code);

export function JourneyRail({ levels, classes }: { levels: CatalogueLevel[]; classes: CatalogueClass[] }) {
  const [selected, setSelected] = useState(classes.find((c) => c.code === "JSS1")?.code ?? classes[0]?.code);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const scroller = useRef<HTMLDivElement>(null);

  // On narrow screens, bring the selected stop into view without moving the page.
  useEffect(() => {
    const box = scroller.current;
    const btn = refs.current[selected];
    if (!box || !btn || box.scrollWidth <= box.clientWidth) return;
    const left = btn.getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft;
    box.scrollTo({ left: Math.max(0, left - box.clientWidth / 2 + btn.offsetWidth / 2), behavior: "smooth" });
  }, [selected]);
  const panelId = useId();
  const current = classes.find((c) => c.code === selected) ?? classes[0];
  const level = levels.find((l) => l.key === current?.level);
  const groups = levels
    .map((l) => ({ ...l, items: classes.filter((c) => c.level === l.key) }))
    .filter((g) => g.items.length > 0);
  const order = groups.flatMap((g) => g.items.map((c) => c.code));

  function move(e: KeyboardEvent<HTMLButtonElement>) {
    const i = order.indexOf(selected);
    const next = e.key === "ArrowRight" ? order[i + 1] : e.key === "ArrowLeft" ? order[i - 1]
      : e.key === "Home" ? order[0] : e.key === "End" ? order[order.length - 1] : undefined;
    if (!next) return;
    e.preventDefault();
    setSelected(next);
    refs.current[next]?.focus();
  }

  if (!current) return null;
  const isExam = current.level === "exam_prep";
  const shown = current.subjects.slice(0, 14);
  let index = 0;

  return (
    <div>
      <div ref={scroller} className="-mx-5 overflow-x-auto px-5 pb-3 scrollbar-none [mask-image:linear-gradient(to_right,black_88%,transparent)] md:mx-0 md:px-0 xl:[mask-image:none]">
        <div role="tablist" aria-label="Choose a class" className="relative flex min-w-max items-start gap-5 pt-8 pr-8 xl:pr-0">
          <span aria-hidden="true" className="absolute left-5 right-10 top-[3.2rem] h-[3px] origin-left rounded-full bg-adire-700 animate-rail-draw" />
          {groups.map((g) => (
            <div key={g.key} className="relative">
              <p className="absolute -top-7 left-0 whitespace-nowrap text-[0.8rem] font-semibold text-muted">{g.name}</p>
              <div className="flex gap-2">
                {g.items.map((c) => {
                  const active = c.code === selected;
                  const exam = c.level === "exam_prep";
                  const delay = 250 + index++ * 45;
                  return (
                    <button
                      key={c.code}
                      ref={(el) => { refs.current[c.code] = el; }}
                      role="tab"
                      type="button"
                      aria-selected={active}
                      aria-controls={panelId}
                      tabIndex={active ? 0 : -1}
                      onClick={() => setSelected(c.code)}
                      onKeyDown={move}
                      style={{ animationDelay: `${delay}ms` }}
                      className={clsx(
                        "relative z-10 grid h-10 place-items-center font-display text-[0.78rem] font-bold tracking-tight animate-stop-in",
                        "transition-[background-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5",
                        exam ? "min-w-14 rounded-[0.85rem] px-2.5" : "w-10 rounded-full",
                        active
                          ? exam ? "bg-sun-400 text-ink shadow-[0_0_0_5px_rgb(246_185_59/0.28)]" : "bg-adire-700 text-white shadow-[0_0_0_5px_rgb(43_58_159/0.18)]"
                          : exam ? "border-2 border-sun-400 bg-white text-ink" : "border-2 border-adire-700 bg-white text-adire-800",
                      )}
                    >
                      <span className="sr-only">{c.name}</span>
                      <span aria-hidden="true">{shortLabel(c)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id={panelId} role="tabpanel" aria-live="polite"
        className="mt-5 grid gap-6 rounded-[1.75rem] border border-line bg-white p-6 shadow-lift md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:p-8">
        <div key={current.code} className="animate-fade-in">
          <p className="text-sm font-medium text-muted">{level?.name}</p>
          <h3 className="mt-1 text-[2rem] font-bold">{current.name}</h3>
          <p className="mt-3 max-w-sm text-muted">
            {isExam
              ? `Timed CBT mocks, topic-by-topic practice and full explanations across ${current.subjects.length} subjects.`
              : `${current.subjects.length} subjects, each with lessons, notes, assignments, tests and a teacher-led classroom.`}
          </p>
          <ButtonLink href={`/signup?class=${current.code}`} className="mt-6" variant={isExam ? "accent" : "primary"}>
            {isExam ? `Prepare for ${current.code === "SCHOLARSHIP" ? "entrance exams" : current.code}` : `Start ${current.name}`}
          </ButtonLink>
        </div>
        <ul key={`${current.code}-subjects`} className="flex flex-wrap content-start gap-2 animate-fade-in" aria-label={`Subjects in ${current.name}`}>
          {shown.map((s) => (
            <li key={s} className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink-soft">{s}</li>
          ))}
          {current.subjects.length > shown.length && (
            <li className="rounded-full px-3 py-1.5 text-sm text-muted">and {current.subjects.length - shown.length} more</li>
          )}
        </ul>
      </div>
    </div>
  );
}
