import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Configure image domains if needed
  images: {
    remotePatterns: [
      // Add external image domains here
      // { protocol: "https", hostname: "example.com" },
    ],
  },

  // Experimental features
  experimental: {
    // Server Actions are stable in Next.js 15
  },

  // TypeScript & ESLint
  typescript: {
    // Dangerously allow production builds to complete even if there are type errors
    // Set to false in production
    ignoreBuildErrors: false,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },

  // Redirect root to dashboard or login
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
