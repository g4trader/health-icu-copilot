/**
 * Status diário do paciente na UTI
 * Representa a evolução clínica ao longo dos dias
 */
export type PatientStatusGlobal = "critico" | "grave" | "estavel" | "melhora" | "alta_uti";

export interface SuporteVentilatorio {
  mode?: string; // "PSV", "SIMV", "CPAP", etc.
  fiO2?: number;
  peep?: number;
}

export interface SuporteHemodinamico {
  hasVasopressor: boolean;
  mainDrug?: string; // Nome do vasopressor principal
  dose?: string; // Dose como string (ex: "0.5 mcg/kg/min")
}

export interface DailyPatientStatus {
  diaUti: number; // Dia de internação na UTI (1, 2, 3, ...)
  data: string; // ISO string da data
  statusGlobal: PatientStatusGlobal;
  riskScore: number; // 0-1
  suporteVentilatorio: SuporteVentilatorio;
  suporteHemodinamico: SuporteHemodinamico;
  principaisEventos: string[]; // Eventos principais do dia (máx 3-5)
  resumoDiario: string; // Resumo textual do dia (1-2 frases)
}

