"use client";

import type { Patient } from "@/types/Patient";

interface VitalSignsChartProps {
  patient: Patient;
  metric: "fc" | "fr" | "spo2";
  height?: number;
}

/**
 * Gera dados mock determinísticos para gráfico de sinais vitais (últimas 24h)
 */
function generateVitalSignsHistory(
  patient: Patient,
  metric: "fc" | "fr" | "spo2"
): Array<{ value: number; timestamp: Date }> {
  const currentValue =
    metric === "fc"
      ? patient.vitalSigns.frequenciaCardiaca
      : metric === "fr"
      ? patient.vitalSigns.frequenciaRespiratoria
      : patient.vitalSigns.saturacaoO2;

  // Seed determinístico baseado no patientId e métrica
  const seed =
    patient.id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) +
    metric.charCodeAt(0);

  // Gerar 24 pontos (1 por hora)
  const points: Array<{ value: number; timestamp: Date }> = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now);
    timestamp.setHours(timestamp.getHours() - i);

    // Variação determinística mas realista
    const variation = Math.sin((seed + i) * 0.1) * (seed % 10);
    const value = Math.max(
      metric === "spo2" ? 70 : metric === "fc" ? 40 : 10,
      Math.min(
        metric === "spo2" ? 100 : metric === "fc" ? 200 : 60,
        currentValue + variation
      )
    );

    points.push({ value, timestamp });
  }

  return points;
}

/**
 * Valores de referência para zona de normalidade
 */
const normalRanges: Record<"fc" | "fr" | "spo2", { min: number; max: number }> =
  {
    fc: { min: 80, max: 150 },
    fr: { min: 20, max: 40 },
    spo2: { min: 95, max: 100 },
  };

export function VitalSignsChart({
  patient,
  metric,
  height = 80,
}: VitalSignsChartProps) {
  const data = generateVitalSignsHistory(patient, metric);
  const range = normalRanges[metric];

  const width = 240;
  const padding = 8;

  // Calcular min/max dos dados para escala
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Expandir range visualmente (10% de padding)
  const visualMin = minValue - valueRange * 0.1;
  const visualMax = maxValue + valueRange * 0.1;
  const visualRange = visualMax - visualMin;

  // Dimensões do gráfico (sem padding)
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Converter valor para coordenada Y (invertido: Y=0 no topo)
  const valueToY = (value: number) => {
    const normalized = (value - visualMin) / visualRange;
    return chartHeight - normalized * chartHeight + padding;
  };

  // Converter índice para coordenada X
  const indexToX = (index: number) => {
    return (index / (data.length - 1)) * chartWidth + padding;
  };

  // Gerar path da linha
  const pathData = data
    .map((point, idx) => {
      const x = indexToX(idx);
      const y = valueToY(point.value);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Zona de normalidade
  const normalYMin = valueToY(range.max);
  const normalYMax = valueToY(range.min);
  const normalHeight = normalYMax - normalYMin;

  const labels: Record<"fc" | "fr" | "spo2", string> = {
    fc: "FC (bpm)",
    fr: "FR (rpm)",
    spo2: "SpO₂ (%)",
  };

  const currentValue =
    metric === "fc"
      ? patient.vitalSigns.frequenciaCardiaca
      : metric === "fr"
      ? patient.vitalSigns.frequenciaRespiratoria
      : patient.vitalSigns.saturacaoO2;

  const isOutOfRange =
    currentValue < range.min || currentValue > range.max;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-900">
          {labels[metric]}
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            isOutOfRange ? "text-rose-600" : "text-slate-700"
          }`}
        >
          {currentValue.toFixed(metric === "spo2" ? 0 : 0)}
          {metric === "fc" ? " bpm" : metric === "fr" ? " rpm" : " %"}
        </span>
      </div>
      <svg width={width} height={height} className="overflow-visible">
        {/* Zona de normalidade */}
        <rect
          x={padding}
          y={normalYMin}
          width={chartWidth}
          height={normalHeight}
          fill="#ecfdf5"
          opacity={0.5}
          rx={2}
        />
        {/* Linha do gráfico */}
        <path
          d={pathData}
          fill="none"
          stroke={isOutOfRange ? "#dc2626" : "#64748b"}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Ponto atual */}
        <circle
          cx={indexToX(data.length - 1)}
          cy={valueToY(currentValue)}
          r={4}
          fill={isOutOfRange ? "#dc2626" : "#64748b"}
        />
      </svg>
      <div className="text-xs text-slate-500 mt-1">Últimas 24h</div>
    </div>
  );
}
