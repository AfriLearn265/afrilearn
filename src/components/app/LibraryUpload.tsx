"use client";

import { useState } from "react";
import { MaterialUploader } from "./MaterialUploader";

export function LibraryUpload({ userId, categories }: { userId: string; categories: Record<string, string> }) {
  const [category, setCategory] = useState("class_notes");
  const [audience, setAudience] = useState("students");
  return (
    <div className="grid gap-4 md:grid-cols-[14rem_12rem_1fr] md:items-start">
      <div>
        <label htmlFor="lib-category" className="mb-1.5 block text-sm font-semibold text-ink-soft">Category</label>
        <select id="lib-category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full rounded-xl border border-line bg-white px-3">
          {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="lib-audience" className="mb-1.5 block text-sm font-semibold text-ink-soft">Who can open it</label>
        <select id="lib-audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="h-11 w-full rounded-xl border border-line bg-white px-3">
          <option value="students">All signed-in users</option><option value="teachers">Teachers only</option>
        </select>
      </div>
      <div className="md:pt-7"><MaterialUploader userId={userId} scope="library" category={category} audience={audience} label="Upload to library" /></div>
    </div>
  );
}
