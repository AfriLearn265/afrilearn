"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button"
      onClick={async () => { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1800); }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-adire-800 hover:bg-adire-50">
      {done ? <Check className="size-4 text-leaf-500" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      {done ? "Copied" : label}
    </button>
  );
}
