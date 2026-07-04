"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Config {
  enableRegister: boolean;
}

const ConfigContext = createContext<Config>({
  enableRegister: true,
});

export function useConfig() {
  return useContext(ConfigContext);
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>({ enableRegister: true });

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => {});
  }, []);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}
