"use client";

import { ReactNode } from "react";

interface MetricChipProps {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  icon?: ReactNode;
  className?: string;
}

export function MetricChip({ 
  label, 
  value, 
  variant = "default",
  icon,
  className = "" 
}: MetricChipProps) {
  const variantClasses = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1
        rounded-lg
        border
        text-xs font-medium
        uppercase tracking-wide
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="text-[10px] leading-none">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}




