import type { MetadataRoute } from "next";
import { getBrand } from "@/lib/brand";

/** Lets phones install the site from the browser ("Add to Home Screen"). */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getBrand();
  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.description,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FBFBFD",
    theme_color: "#4A1FB8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
