"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  critical?: boolean;
  className?: string;
}

export function MetricTile({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  critical = false,
  className = "",
}: MetricTileProps) {
  return (
    <div
      className={`
        flex flex-col gap-1
        p-3
        bg-slate-50
        rounded-xl
        border border-slate-200
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && (
            <Icon className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-600">
            {label}
          </span>
        </div>
        {trend && (
          <span className={`text-[10px] ${
            trend === "up" ? "text-rose-600" : 
            trend === "down" ? "text-emerald-600" : 
            "text-slate-400"
          }`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`
            text-lg font-semibold tabular-nums
            ${critical ? "text-rose-600" : "text-slate-900"}
          `}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs text-slate-500 font-medium">
            {unit}
          </span>
        )}
      </div>
      {trendValue && (
        <span className="text-[10px] text-slate-500">
          {trendValue}
        </span>
      )}
    </div>
  );
}

