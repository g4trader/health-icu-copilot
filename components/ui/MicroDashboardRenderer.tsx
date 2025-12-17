"use client";

import type { MicroDashboardPayload, DashboardBlock, SparklineSeries } from "@/types/MicroDashboard";
import { Sparkline } from "./Sparkline";

interface MicroDashboardRendererProps {
  dashboard: MicroDashboardPayload;
}

export function MicroDashboardRenderer({ dashboard }: MicroDashboardRendererProps) {
  return (
    <div className="space-y-4">
      {dashboard.titulo && (
        <h3 className="text-slate-900 font-semibold text-base mb-4">
          {dashboard.titulo}
        </h3>
      )}
      
      {dashboard.blocos.map((bloco, idx) => (
        <DashboardBlockRenderer key={idx} block={bloco} />
      ))}
      
      {dashboard.disclaimer && (
        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          {dashboard.disclaimer}
        </p>
      )}
    </div>
  );
}

function DashboardBlockRenderer({ block }: { block: DashboardBlock }) {
  const alertColorClasses = {
    green: 'border-emerald-200 bg-emerald-50',
    yellow: 'border-amber-200 bg-amber-50',
    red: 'border-rose-200 bg-rose-50'
  };

  return (
    <div className={`detail-card border-l-4 ${alertColorClasses[block.nivel_alerta]}`}>
      <h4 className="detail-card-title">{block.titulo}</h4>
      
      {block.texto && (
        <p className="text-slate-700 text-sm leading-relaxed mb-3">
          {block.texto}
        </p>
      )}
      
      {block.itens && block.itens.length > 0 && (
        <ul className="space-y-2 mb-3">
          {block.itens.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-slate-700 text-sm">
              <span className="text-slate-400 mt-1.5 flex-shrink-0">•</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
      
      {block.sparklines && block.sparklines.length > 0 && (
        <div className="space-y-4 mt-4">
          {block.sparklines.map((series, idx) => (
            <SparklineSeriesRenderer key={idx} series={series} />
          ))}
        </div>
      )}
    </div>
  );
}

function SparklineSeriesRenderer({ series }: { series: SparklineSeries }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-slate-700">{series.nome}</span>
          <span className="text-lg font-semibold text-slate-900 tabular-nums">
            {series.valor_atual}
          </span>
          <span className="text-sm text-slate-500">{series.unidade}</span>
        </div>
      </div>
      <div className="flex-shrink-0" style={{ width: '120px', height: '40px' }}>
        <Sparkline points={series.pontos} />
      </div>
    </div>
  );
}

