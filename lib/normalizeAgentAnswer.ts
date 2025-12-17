import type { PlantonistaAnswerContent } from "@/types/PlantonistaAnswerContent";
import type { MicroDashboard } from "@/types/MicroDashboardV2";
import type { Patient } from "@/types/Patient";
import type { PatientFocusPayload } from "@/types/PatientFocusPayload";

/**
 * Normaliza respostas do agente para o formato padronizado PlantonistaAnswerContent
 * Suporta múltiplos formatos de resposta (legacy e novo)
 */
export function normalizeAgentAnswer(data: any): PlantonistaAnswerContent {
  const plainTextAnswer =
    data.llmAnswer?.plainTextAnswer ??
    data.plainTextAnswer ??
    data.reply ??
    "";

  const microDashboards: MicroDashboard[] =
    data.microDashboardsV2 ??
    data.llmAnswer?.microDashboards ??
    data.microDashboards ??
    [];

  const timelineHighlights =
    data.timelineHighlights ??
    data.llmAnswer?.timelineHighlights ??
    undefined;

  const topPatients: Patient[] = data.topPatients ?? [];

  const focusPayload: PatientFocusPayload | null =
    data.focusPayload ??
    data.llmAnswer?.focusSummary ??
    null;

  return {
    plainTextAnswer,
    microDashboards,
    timelineHighlights,
    topPatients,
    focusPayload,
  };
}

/**
 * Helper para normalizar mensagens antigas que só têm campos legacy
 */
export function normalizeAgentAnswerFromLegacy(message: any): PlantonistaAnswerContent {
  return normalizeAgentAnswer({
    reply: message.text || message.content || "",
    topPatients: message.topPatients,
    focusedPatient: message.focusedPatient,
    focusPayload: message.focusPayload,
    microDashboardsV2: message.microDashboardsV2,
    llmAnswer: message.llmAnswer,
    timelineHighlights: message.timelineHighlights,
  });
}

