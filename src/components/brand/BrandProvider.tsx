"use client";

import { createContext, useContext, type ReactNode } from "react";
import { brand as defaults } from "@/config/brand";

export type ClientBrand = { name: string; tagline: string; logoUrl: string | null; announcement: { text: string; link: string | null } | null };

const BrandContext = createContext<ClientBrand>({ name: defaults.name, tagline: defaults.tagline, logoUrl: null, announcement: null });

export function BrandProvider({ value, children }: { value: ClientBrand; children: ReactNode }) {
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export const useBrand = () => useContext(BrandContext);
