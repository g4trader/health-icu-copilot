"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  critical?: boolean;
  className?: string;
}

export function MetricTile({
  label,
  value,
  unit,
  trend,
  trendValue,
  critical = false,
  className = "",
}: MetricTileProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColorClass =
    trend === "up"
      ? "text-rose-600"
      : trend === "down"
      ? "text-emerald-600"
      : "text-slate-500";

  return (
    <div
      className={`
        flex flex-col gap-1.5
        p-3
        bg-slate-50
        rounded-lg
        border border-slate-200
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-600">
          {label}
        </span>
        {trend && (
          <div className={`flex items-center gap-0.5 ${trendColorClass}`}>
            <TrendIcon className="w-3 h-3" strokeWidth={2} />
            {trendValue && (
              <span className="text-[10px] tabular-nums">{trendValue}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`
            text-lg font-semibold tabular-nums
            ${critical ? "text-rose-700" : "text-slate-900"}
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
    </div>
  );
}


