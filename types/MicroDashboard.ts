export type AlertLevel = 'green' | 'yellow' | 'red';

export type MicroDashboardType =
  | 'status_paciente'
  | 'evolucao_24h'
  | 'suporte_respiratorio'
  | 'risco_scores'
  | 'antibiotico_infeccao'
  | 'resumo_familia';

export interface SparklinePoint {
  t: string; // "-24h", "-12h", "-6h", "agora"
  v: number;
}

export interface SparklineSeries {
  nome: string;
  valor_atual: number;
  unidade: string;
  pontos: SparklinePoint[];
}

export interface DashboardBlock {
  titulo: string;
  nivel_alerta: AlertLevel;
  texto?: string;
  itens?: string[];
  sparklines?: SparklineSeries[];
}

export interface MicroDashboardPayload {
  tipo_dashboard: MicroDashboardType;
  paciente_id: string;
  titulo?: string; // opcional para header do card
  blocos: DashboardBlock[];
  disclaimer?: string;
}

