"use client";

import type { Patient } from "@/types/Patient";
type LabResult = Patient["labResults"][number];
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface LabSparklineProps {
  lab: LabResult;
  height?: number;
}

/**
 * Gera dados mock determinísticos para sparkline de laboratório
 */
function generateLabHistory(lab: LabResult): number[] {
  const currentValue =
    typeof lab.valor === "number" ? lab.valor : parseFloat(String(lab.valor));

  // Seed determinístico baseado no ID do lab
  const seed = lab.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Gerar 12 pontos (últimas 12h, 1 por hora)
  const points: number[] = [];

  for (let i = 11; i >= 0; i--) {
    // Variação determinística
    const variation = Math.sin((seed + i) * 0.15) * (seed % 8);
    const trendMultiplier = lab.tendencia === "subindo" ? 1.1 : lab.tendencia === "caindo" ? 0.9 : 1.0;
    
    // Calcular valor histórico (mais antigo = menor se subindo, maior se caindo)
    const ageFactor = (11 - i) / 11; // 0 (antigo) a 1 (atual)
    const historicalValue = currentValue / trendMultiplier;
    
    const value = historicalValue + (currentValue - historicalValue) * ageFactor + variation;
    
    // Garantir valores não negativos e realistas
    const minValue = currentValue * 0.5;
    const maxValue = currentValue * 1.5;
    points.push(Math.max(minValue, Math.min(maxValue, value)));
  }

  return points;
}

export function LabSparkline({ lab, height = 32 }: LabSparklineProps) {
  const data = generateLabHistory(lab);
  const currentValue =
    typeof lab.valor === "number" ? lab.valor : parseFloat(String(lab.valor));

  const width = 80;
  const padding = 2;

  // Calcular min/max para escala
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const valueRange = maxValue - minValue || 1;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Converter valor para coordenada Y
  const valueToY = (value: number) => {
    const normalized = (value - minValue) / valueRange;
    return chartHeight - normalized * chartHeight + padding;
  };

  // Converter índice para coordenada X
  const indexToX = (index: number) => {
    return (index / (data.length - 1)) * chartWidth + padding;
  };

  // Gerar path da linha
  const pathData = data
    .map((value, idx) => {
      const x = indexToX(idx);
      const y = valueToY(value);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Determinar cor baseada na tendência
  const trendColor =
    lab.tendencia === "subindo"
      ? "#dc2626"
      : lab.tendencia === "caindo"
      ? "#059669"
      : "#64748b";

  const TrendIcon =
    lab.tendencia === "subindo"
      ? TrendingUp
      : lab.tendencia === "caindo"
      ? TrendingDown
      : Minus;

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="flex-shrink-0">
        <path
          d={pathData}
          fill="none"
          stroke={trendColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <TrendIcon className="w-3 h-3 text-slate-500" />
    </div>
  );
}
