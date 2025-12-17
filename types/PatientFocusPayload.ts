import type { RiskLevel } from "@/lib/mockData";

/**
 * Payload estruturado para Patient Focus Mode
 * Usado para renderização consistente do modo foco do paciente
 */
export interface PatientFocusPayload {
  patientId: string;
  nome: string;
  idade: number;
  peso: number;
  leito: string;
  diagnosticoPrincipal: string;
  riskLevel: RiskLevel;
  riskPercent24h: number;
  hasVM: boolean;
  hasVaso: boolean;
  lactatoValue?: number;
  lactatoTrend?: "subindo" | "estavel" | "caindo";
  sofaScore?: number;
  keyFindings: string[]; // 3-6 bullet points
  narrativaAgente?: string; // Narrativa do agente (opcional)
}

