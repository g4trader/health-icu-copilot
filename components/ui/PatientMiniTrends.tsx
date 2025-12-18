"use client";

import type { DailyPatientStatus } from "@/types/DailyPatientStatus";
import { getRecentDailyStatus } from "@/lib/patientTimeline";

interface PatientMiniTrendsProps {
  patientId: string;
  dailyStatus?: DailyPatientStatus[]; // Opcional: se não fornecido, busca automaticamente
}

interface TrendValue {
  value: number;
  date: string;
}

function MiniLineChart({ values, unit, color }: { values: TrendValue[]; unit: string; color: string }) {
  if (values.length === 0) return null;

  const width = 120;
  const height = 40;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Normalizar valores para 0-1
  const numericValues = values.map(v => typeof v.value === 'number' ? v.value : 0);
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const range = max - min || 1; // Evitar divisão por zero

  const normalized = numericValues.map(v => (v - min) / range);

  // Criar pontos do polyline (invertido verticalmente para SVG)
  const points = normalized.map((norm, idx) => {
    const x = padding + (idx / (normalized.length - 1 || 1)) * chartWidth;
    const y = padding + (1 - norm) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const lastValue = numericValues[numericValues.length - 1];
  const lastPoint = points.split(' ').pop()?.split(',') || ['0', '0'];
  const lastX = parseFloat(lastPoint[0]);
  const lastY = parseFloat(lastPoint[1]);

  return (
    <div className="inline-flex items-center gap-2">
      <svg width={width} height={height} className="flex-shrink-0">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={lastX}
          cy={lastY}
          r="3"
          fill={color}
        />
      </svg>
      <span className="text-xs font-semibold text-slate-700">
        {lastValue.toFixed(1)}{unit}
      </span>
    </div>
  );
}

function getTrendColor(value: number, type: 'map' | 'spo2' | 'lactate'): string {
  if (type === 'map') {
    if (value < 60) return '#dc2626'; // red
    if (value < 65) return '#f59e0b'; // amber
    return '#10b981'; // green
  }
  if (type === 'spo2') {
    if (value < 92) return '#dc2626'; // red
    if (value < 95) return '#f59e0b'; // amber
    return '#10b981'; // green
  }
  if (type === 'lactate') {
    if (value > 2) return '#dc2626'; // red
    if (value > 1.5) return '#f59e0b'; // amber
    return '#10b981'; // green
  }
  return '#6b7280'; // slate
}

export function PatientMiniTrends({ patientId, dailyStatus: providedDailyStatus }: PatientMiniTrendsProps) {
  const dailyStatus = providedDailyStatus || getRecentDailyStatus(patientId, 14);
  
  // Pegar últimos 7 dias
  const last7Days = dailyStatus.slice(-7);
  
  if (last7Days.length === 0) return null;

  // Extrair valores para MAP (simulado - precisaria estar no DailyPatientStatus)
  // Por enquanto, vamos usar valores mockados baseados no riskScore
  const mapValues: TrendValue[] = last7Days.map((day, idx) => ({
    value: 55 + (day.riskScore * 30) + (idx * 0.5), // Simulado: MAP baseado no risco
    date: day.data
  }));

  // SpO2 (simulado)
  const spo2Values: TrendValue[] = last7Days.map((day, idx) => ({
    value: 88 + (1 - day.riskScore) * 8 + (idx * 0.3), // Simulado: SpO2 melhorando se risco baixa
    date: day.data
  }));

  // Lactato (simulado - poderia vir dos labResults se disponível)
  const lactateValues: TrendValue[] = last7Days.map((day) => ({
    value: 1.5 + day.riskScore * 2.5, // Simulado: lactato relacionado ao risco
    date: day.data
  }));

  const lastMap = mapValues[mapValues.length - 1]?.value || 0;
  const lastSpo2 = spo2Values[spo2Values.length - 1]?.value || 0;
  const lastLactate = lactateValues[lactateValues.length - 1]?.value || 0;

  return (
    <div className="plantonista-mini-trends">
      <div className="plantonista-mini-trend-row">
        <span className="plantonista-mini-trend-label">MAP últimos 7 dias</span>
        <MiniLineChart 
          values={mapValues} 
          unit=" mmHg" 
          color={getTrendColor(lastMap, 'map')} 
        />
      </div>
      
      <div className="plantonista-mini-trend-row">
        <span className="plantonista-mini-trend-label">SpO2 últimos 7 dias</span>
        <MiniLineChart 
          values={spo2Values} 
          unit="%" 
          color={getTrendColor(lastSpo2, 'spo2')} 
        />
      </div>
      
      <div className="plantonista-mini-trend-row">
        <span className="plantonista-mini-trend-label">Lactato últimos 7 dias</span>
        <MiniLineChart 
          values={lactateValues} 
          unit=" mmol/L" 
          color={getTrendColor(lastLactate, 'lactate')} 
        />
      </div>
    </div>
  );
}

