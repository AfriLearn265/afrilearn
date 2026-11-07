"use client";

import { Printer } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

/** Opens the browser's print dialog, where "Save as PDF" is one of the choices. */
export function PrintButton({ label = "Print or save as PDF", variant = "outline" }: { label?: string; variant?: "outline" | "primary" | "accent" }) {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass(variant, "md", "print:hidden")}>
      <Printer className="size-4" aria-hidden="true" />{label}
    </button>
  );
}
