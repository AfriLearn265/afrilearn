import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "./globals.css";
import { getBrand } from "@/lib/brand";
import { BrandProvider } from "@/components/brand/BrandProvider";

export async function generateMetadata(): Promise<Metadata> {
  const b = await getBrand();
  return {
    title: { default: `${b.name} · ${b.tagline}`, template: `%s · ${b.name}` },
    description: b.description,
    applicationName: b.name,
    openGraph: { title: `${b.name} · ${b.tagline}`, description: b.description, type: "website", locale: "en_NG" },
  };
}

export const viewport: Viewport = {
  themeColor: "#2B3A9F",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const b = await getBrand();
  return (
    <html lang="en-NG" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <BrandProvider value={{ name: b.name, tagline: b.tagline, logoUrl: b.logoUrl, announcement: b.announcement }}>{children}</BrandProvider>
      </body>
    </html>
  );
}
