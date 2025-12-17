"use client";

import type { MicroDashboard, MicroDashboardBlock } from "@/types/MicroDashboardV2";

interface MicroDashboardV2RendererProps {
  dashboard: MicroDashboard;
}

export function MicroDashboardV2Renderer({ dashboard }: MicroDashboardV2RendererProps) {
  const getRiskColor = (level?: string) => {
    if (level === "alto") return "border-rose-200 bg-rose-50";
    if (level === "moderado") return "border-amber-200 bg-amber-50";
    return "border-slate-200 bg-slate-50";
  };

  return (
    <div className={`detail-card ${getRiskColor(dashboard.riskLevel)}`}>
      <div className="mb-3">
        <h4 className="detail-card-title">{dashboard.titulo}</h4>
        {dashboard.subtitulo && (
          <p className="text-xs text-slate-600 mt-1">{dashboard.subtitulo}</p>
        )}
      </div>
      
      <div className="space-y-4">
        {dashboard.blocks.map((block, idx) => (
          <MicroDashboardBlockRenderer key={idx} block={block} />
        ))}
      </div>
    </div>
  );
}

interface MicroDashboardBlockRendererProps {
  block: MicroDashboardBlock;
}

function MicroDashboardBlockRenderer({ block }: MicroDashboardBlockRendererProps) {
  if (block.tipo === "kpi") {
    // Grid de KPIs
    return (
      <div>
        <h5 className="text-sm font-semibold text-slate-900 mb-2">{block.titulo}</h5>
        <div className="grid grid-cols-2 gap-2">
          {block.itens.map((item, idx) => (
            <div key={idx} className="text-sm text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (block.tipo === "trend") {
    // Lista com indicadores de tendência
    return (
      <div>
        <h5 className="text-sm font-semibold text-slate-900 mb-2">{block.titulo}</h5>
        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
          {block.itens.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }
  
  // Default: lista simples
  return (
    <div>
      <h5 className="text-sm font-semibold text-slate-900 mb-2">{block.titulo}</h5>
      <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
        {block.itens.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

