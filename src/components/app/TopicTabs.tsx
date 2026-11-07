"use client";

import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { MonitorPlay, NotebookText, Puzzle } from "lucide-react";

const TABS = [
  { key: "video", label: "Watch", icon: MonitorPlay },
  { key: "notes", label: "Notes", icon: NotebookText },
  { key: "quiz", label: "Quiz", icon: Puzzle },
] as const;
type Key = (typeof TABS)[number]["key"];

/** Watch, Notes and Quiz for one topic, switched without leaving the page. */
export function TopicTabs({ video, notes, quiz, initial = "video" }: { video: ReactNode; notes: ReactNode; quiz: ReactNode; initial?: Key }) {
  const [tab, setTab] = useState<Key>(initial);
  const panels: Record<Key, ReactNode> = { video, notes, quiz };
  return (
    <div>
      <div role="tablist" aria-label="Lesson parts" className="grid grid-cols-3 gap-2 rounded-full bg-wash p-1.5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`}
            onClick={() => setTab(key)}
            className={clsx("inline-flex items-center justify-center gap-2 rounded-full px-2 py-2.5 font-display font-semibold transition-colors",
              tab === key ? "bg-grape-600 text-white shadow-[0_3px_0_var(--color-grape-900)]" : "text-ink-soft hover:text-ink")}>
            <Icon className="size-[1.1rem]" aria-hidden="true" />{label}
          </button>
        ))}
      </div>
      {TABS.map(({ key }) => (
        <div key={key} role="tabpanel" id={`panel-${key}`} aria-labelledby={`tab-${key}`} hidden={tab !== key} className="mt-5">
          {panels[key]}
        </div>
      ))}
    </div>
  );
}
