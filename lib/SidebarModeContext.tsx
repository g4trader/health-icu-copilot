"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type SidebarMode = "radiologista" | "dados-locais" | "educacao" | "ferramentas";

type SidebarModeContextValue = {
  activeMode: SidebarMode;
  setActiveMode: (mode: SidebarMode) => void;
};

const SidebarModeContext = createContext<SidebarModeContextValue | null>(null);

export function SidebarModeProvider({ children }: { children: ReactNode }) {
  const [activeMode, setActiveMode] = useState<SidebarMode>("radiologista");
  return (
    <SidebarModeContext.Provider value={{ activeMode, setActiveMode }}>
      {children}
    </SidebarModeContext.Provider>
  );
}

export function useSidebarModeOptional(): SidebarModeContextValue | null {
  return useContext(SidebarModeContext);
}

/** Use quando o componente está sempre dentro de SidebarModeProvider (ex.: página que verifica rota) */
export function useSidebarMode(): SidebarModeContextValue {
  const ctx = useContext(SidebarModeContext);
  if (!ctx) {
    throw new Error("useSidebarMode must be used within SidebarModeProvider");
  }
  return ctx;
}
