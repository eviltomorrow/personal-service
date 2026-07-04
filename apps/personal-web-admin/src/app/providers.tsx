"use client";

import { ConfigProvider } from "@/lib/config";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ConfigProvider>{children}</ConfigProvider>;
}
