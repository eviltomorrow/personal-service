import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    return [
      { source: "/api/:path*", destination: "http://127.0.0.1:8080/api/:path*" },
    ];
  },
};

export default nextConfig;
