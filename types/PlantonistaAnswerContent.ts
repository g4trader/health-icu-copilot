import type { LlmPatientAnswer, TimelineHighlight } from "./LlmPatientAnswer";
import type { MicroDashboard } from "./MicroDashboardV2";
import type { Patient } from "./Patient";

/**
 * Conteúdo normalizado para uma resposta do Plantonista
 * Usado para padronizar o estilo de renderização independente da origem
 */
export interface PlantonistaAnswerContent {
  plainTextAnswer: string;
  microDashboards: MicroDashboard[];
  timelineHighlights?: TimelineHighlight[];
  topPatients?: Patient[]; // Para respostas de PRIORITIZACAO
  focusPatientId?: string | null;
}

