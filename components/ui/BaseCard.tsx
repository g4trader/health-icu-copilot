"use client";

import { ReactNode } from "react";

interface BaseCardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

export function BaseCard({ 
  children, 
  className = "", 
  padding = "md",
  hover = false 
}: BaseCardProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={`
        bg-white 
        border border-slate-200 
        rounded-2xl 
        shadow-sm
        ${paddingClasses[padding]}
        ${hover ? "transition-all hover:shadow-md hover:border-slate-300" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}



