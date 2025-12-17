"use client";

import type { MicroDashboard, MicroDashboardBlock } from "@/types/MicroDashboardV2";
import { Activity, Wind, Heart, FlaskConical, Shield, Bug, TestTube, Scan } from "lucide-react";

interface MicroDashboardV2RendererProps {
  dashboard: MicroDashboard;
}

// Ícones por tipo de dashboard
const dashboardIcons: Record<MicroDashboard['tipo'], typeof Activity> = {
  status_global: Activity,
  respiratorio: Wind,
  hemodinamico: Heart,
  labs_criticos: FlaskConical,
  infeccao_antibiotico: Shield, // Usaremos Shield + Bug em composição
  labs_evolutivos: TestTube,
  imagem_evolutiva: Scan,
};

function getRiskLabel(level?: string): string {
  if (level === "alto") return "Alto risco";
  if (level === "moderado") return "Risco moderado";
  return "Risco baixo";
}

export function MicroDashboardV2Renderer({ dashboard }: MicroDashboardV2RendererProps) {
  const Icon = dashboardIcons[dashboard.tipo] || Activity;
  const isInfeccao = dashboard.tipo === "infeccao_antibiotico";

  return (
    <div className={`micro-dashboard-card micro-dashboard-${dashboard.tipo}`}>
      <div className="micro-dashboard-header">
        <div className="micro-dashboard-header-left">
          <div className="micro-dashboard-icon-wrapper">
            <Icon className="micro-dashboard-icon" />
            {isInfeccao && <Bug className="micro-dashboard-icon micro-dashboard-icon-overlay" />}
          </div>
          <div>
            <h4 className="micro-dashboard-title">{dashboard.titulo}</h4>
            {dashboard.subtitulo && (
              <p className="micro-dashboard-subtitle">{dashboard.subtitulo}</p>
            )}
          </div>
        </div>
        {dashboard.riskLevel && (
          <span className={`risk-pill risk-${dashboard.riskLevel}`}>
            {getRiskLabel(dashboard.riskLevel)}
          </span>
        )}
      </div>
      
      <div className="micro-dashboard-body">
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
  const blockType = block.tipo || "lista";
  
  if (blockType === "kpi") {
    // Grid de KPIs
    return (
      <section className={`micro-dashboard-block block-${blockType}`}>
        <h5 className="micro-dashboard-block-title">{block.titulo}</h5>
        <div className="micro-dashboard-kpi-grid">
          {block.itens.map((item, idx) => (
            <div key={idx} className="micro-dashboard-kpi-item">
              {item}
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  if (blockType === "trend") {
    // Lista com indicadores de tendência
    return (
      <section className={`micro-dashboard-block block-${blockType}`}>
        <h5 className="micro-dashboard-block-title">{block.titulo}</h5>
        <ul className="micro-dashboard-list">
          {block.itens.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>
    );
  }
  
  // Default: lista simples
  return (
    <section className={`micro-dashboard-block block-${blockType}`}>
      <h5 className="micro-dashboard-block-title">{block.titulo}</h5>
      <ul className="micro-dashboard-list">
        {block.itens.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

