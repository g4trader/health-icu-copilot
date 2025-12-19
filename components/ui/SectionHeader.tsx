"use client";

import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ 
  title, 
  subtitle, 
  action,
  className = "" 
}: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex-1">
        <h3 className="text-slate-900 font-semibold text-base leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-slate-600 text-sm mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}




