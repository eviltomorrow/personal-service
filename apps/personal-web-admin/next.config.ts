import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ENABLE_REGISTER: process.env.NEXT_PUBLIC_ENABLE_REGISTER || "true",
  },
  async redirects() {
    const enableRegister = process.env.NEXT_PUBLIC_ENABLE_REGISTER !== "false";
    const redirects = [{ source: "/", destination: "/login", permanent: false }];
    if (!enableRegister) {
      redirects.push({ source: "/register", destination: "/login", permanent: false });
    }
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
