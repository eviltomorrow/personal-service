import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    const redirects = [{ source: "/", destination: "/login", permanent: false }];
    return redirects;
  },
  async rewrites() {
    const target = process.env.API_TARGET;
    if (!target) return [];
    return [
      { source: "/api/:path*", destination: `${target}/api/:path*` },
    ];
  },
};

export default nextConfig;
