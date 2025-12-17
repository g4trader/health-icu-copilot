"use client";

import type { SparklinePoint } from "@/types/MicroDashboard";

interface SparklineProps {
  points: SparklinePoint[];
  width?: number;
  height?: number;
}

export function Sparkline({ points, width = 120, height = 40 }: SparklineProps) {
  if (points.length === 0) return null;

  // Normalizar valores para o espaço do SVG
  const values = points.map(p => p.v);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1; // Evitar divisão por zero
  
  // Padding interno
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Gerar path SVG
  const pathData = points
    .map((point, idx) => {
      const x = padding + (idx / (points.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - ((point.v - minValue) / range) * chartHeight;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Cor baseada na tendência (simples: última vs primeira)
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const isUp = lastValue > firstValue;
  const isDown = lastValue < firstValue;
  
  let strokeColor = '#64748b'; // slate-500 (neutro)
  if (isUp) strokeColor = '#ef4444'; // red-500 (subindo pode ser ruim em muitos contextos)
  if (isDown) strokeColor = '#10b981'; // emerald-500 (descendo pode ser bom)

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      style={{ display: 'block' }}
    >
      {/* Linha de tendência */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Pontos */}
      {points.map((point, idx) => {
        const x = padding + (idx / (points.length - 1 || 1)) * chartWidth;
        const y = padding + chartHeight - ((point.v - minValue) / range) * chartHeight;
        return (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r={2}
            fill={strokeColor}
          />
        );
      })}
    </svg>
  );
}

