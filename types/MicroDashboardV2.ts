import type { RiskLevel } from "@/lib/mockData";

/**
 * Tipos de micro dashboard (versão 2 - usando Patient diretamente)
 */
export type MicroDashboardType =
  | "status_global"
  | "respiratorio"
  | "hemodinamico"
  | "labs_criticos"
  | "infeccao_antibiotico"
  | "labs_evolutivos"
  | "imagem_evolutiva";

/**
 * Bloco de um micro dashboard
 */
export interface MicroDashboardBlock {
  titulo: string;
  tipo?: "lista" | "kpi" | "trend";
  itens: string[];
}

/**
 * Micro dashboard completo
 */
export interface MicroDashboard {
  tipo: MicroDashboardType;
  titulo: string;
  subtitulo?: string;
  riskLevel?: RiskLevel;
  riskPercent24h?: number;
  blocks: MicroDashboardBlock[];
}

