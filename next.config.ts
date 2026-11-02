import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: 'camera=(self "https://8x8.vc" "https://meet.jit.si"), microphone=(self "https://8x8.vc" "https://meet.jit.si"), display-capture=(self "https://8x8.vc" "https://meet.jit.si"), geolocation=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
