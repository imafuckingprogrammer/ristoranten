import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds for faster deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds with TypeScript errors (for rapid prototyping)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
