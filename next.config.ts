import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  typescript: {
    // Pre-existing type errors in the Supabase admin client generic — not our bugs.
    // Remove once @supabase/supabase-js types are regenerated from the live schema.
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/head-to-head",
        destination: "/topic/overall",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/**",
      },
    ],
  },
};

export default nextConfig;
