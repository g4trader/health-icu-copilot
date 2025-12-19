"use client";

import { ReactNode, useState, useEffect } from "react";
import { LeftSidebar } from "./LeftSidebar";
import { PreviewDrawer } from "./PreviewDrawer";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobile, setIsMobile] = useState(true); // Iniciar como true para evitar flash da sidebar

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }
    };
    // Verificar imediatamente no mount
    checkMobile();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  return (
    <div className="app-shell">
      {!isMobile && <LeftSidebar />}
      <main className="main-chat-area">
        {children}
      </main>
      <PreviewDrawer />
    </div>
  );
}

