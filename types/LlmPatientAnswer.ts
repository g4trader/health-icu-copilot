import type { PatientFocusPayload } from "./PatientFocusPayload";
import type { MicroDashboard } from "./MicroDashboardV2";
import type { DailyPatientStatus } from "./DailyPatientStatus";

/**
 * Destaque da timeline para respostas do LLM
 */
export interface TimelineHighlight {
  diaUti: number;
  data: string;
  titulo: string;
  descricao: string;
  relevancia: "alta" | "media" | "baixa";
}

/**
 * Resposta padronizada do LLM para questões sobre pacientes
 */
export interface LlmPatientAnswer {
  focusSummary?: PatientFocusPayload;
  microDashboards?: MicroDashboard[];
  timelineHighlights?: TimelineHighlight[];
  plainTextAnswer: string; // Resposta em texto livre (sempre presente)
}

