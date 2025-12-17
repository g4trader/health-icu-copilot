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

  // Extrair focusPayload, garantindo que patientId seja o ID correto do paciente
  let focusPayload: PatientFocusPayload | null =
    data.focusPayload ??
    data.llmAnswer?.focusSummary ??
    null;

  // Se não há focusPayload mas há focusedPatient, criar um básico usando o ID correto
  if (!focusPayload && data.focusedPatient?.id) {
    // Usar o ID do focusedPatient que é o ID lógico correto (ex: "p1", "p2")
    focusPayload = {
      patientId: data.focusedPatient.id,
      nome: data.focusedPatient.nome,
      idade: data.focusedPatient.idade,
      peso: data.focusedPatient.peso,
      leito: data.focusedPatient.leito,
      diagnosticoPrincipal: data.focusedPatient.diagnosticoPrincipal,
      riskLevel: "moderado",
      riskPercent24h: Math.round((data.focusedPatient.riscoMortality24h || 0) * 100),
      hasVM: !!data.focusedPatient.ventilationParams,
      hasVaso: data.focusedPatient.medications?.some((m: any) => m.tipo === "vasopressor" && m.ativo) || false,
      keyFindings: [], // Array vazio como fallback mínimo
    };
  }

  // Garantir que se focusPayload existe, o patientId seja o ID correto
  if (focusPayload && data.focusedPatient?.id) {
    focusPayload.patientId = data.focusedPatient.id;
  }

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

