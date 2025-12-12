"use client";

import { ReactNode } from "react";
import { LeftSidebar } from "./LeftSidebar";
import { RightPreview } from "./RightPreview";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <LeftSidebar />
      <main className="main-chat-area">
        {children}
      </main>
      <RightPreview />
    </div>
  );
}

