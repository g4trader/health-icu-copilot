/**
 * Agentes de subespecialidade clínica
 * Cada agente ajusta apenas o system prompt, não altera dados ou cálculos
 */

import type { Patient } from '@/types/Patient';
import { riskLevelFromScore } from './mockData';

export type ClinicalAgentType = "default";
export type ClinicalAgentId = 'general';

export interface ClinicalAgent {
  id: ClinicalAgentId;
  type: ClinicalAgentType;
  name: string;
  description: string;
  systemPrompt: string;
  keywords: string[];
}

// Agentes clínicos disponíveis
// Plantonista (default) é o modo padrão global
export const clinicalAgents: Record<ClinicalAgentId, ClinicalAgent> = {
  general: {
    id: "general",
    type: "default",
    name: "Plantonista",
    description: "Modo padrão do chat clínico",
    systemPrompt: "Você é um assistente médico para UTI pediátrica. Melhore a redação de textos mantendo todos os fatos e números exatamente como estão. Use linguagem médica apropriada e tom assistivo, evitando linguagem prescritiva. Pode abordar múltiplas áreas clínicas (cardiologia, pneumologia, infectologia, etc.) dentro do mesmo texto, sem necessidade de trocar de agente.",
    keywords: []
  }
};

/**
 * Detecta agente baseado em mensagem do usuário
 * Atualmente sempre retorna default (Plantonista) como único agente clínico
 */
export function detectAgent(message: string, currentAgent?: ClinicalAgentType): ClinicalAgentType {
  // Sempre retornar default (Plantonista) como padrão
  // O Plantonista trata todas as áreas clínicas
  return "default";
}

/**
 * Obtém agente pelo tipo
 */
export function getAgent(type: ClinicalAgentType): ClinicalAgent {
  // Sempre retorna general (Plantonista)
  return clinicalAgents.general;
}

/**
 * Obtém agente pelo ID
 */
export function getClinicalAgent(agentId: ClinicalAgentId): ClinicalAgent {
  return clinicalAgents[agentId];
}

/**
 * Interface para parecer de agente
 */
export interface AgentOpinion {
  title: string;
  summary: string;
  diagnosticImpression: string;
  suggestedExams: string[];
  treatmentSuggestions: string[];
  riskLevel: 'baixo' | 'moderado' | 'alto';
}

/**
 * Gera parecer determinístico baseado no paciente e agente
 */
export function buildAgentOpinion(
  patient: Patient,
  agentId: ClinicalAgentId
): AgentOpinion {
  const agent = clinicalAgents[agentId];
  const riskLevel = riskLevelFromScore(patient.riscoMortality24h);
  const vs = patient.vitalSigns;
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  const lactatoValue = lactato && typeof lactato.valor === "number" ? lactato.valor : 0;
  
  let title = `${agent.name} – Parecer automático (protótipo)`;
  let summary = "";
  let diagnosticImpression = "";
  const suggestedExams: string[] = [];
  const treatmentSuggestions: string[] = [];

  // Plantonista (único agente clínico)
  summary = `Paciente ${patient.nome} (${patient.idade} anos, ${patient.peso.toFixed(1)} kg), ${patient.leito}, com diagnóstico principal de ${patient.diagnosticoPrincipal}.`;
  diagnosticImpression = "Avaliação clínica geral do caso. Considerar múltiplas áreas conforme contexto clínico.";
  suggestedExams.push("Revisar exames laboratoriais mais recentes");
  if (lactatoValue > 2) {
    treatmentSuggestions.push("Lactato elevado - avaliar perfusão tecidual");
  }
  
  // Análise cardiovascular se relevante
  const map = vs.pressaoArterialMedia;
  const fc = vs.frequenciaCardiaca;
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  
  if (map < 65) {
    diagnosticImpression += " Hipotensão arterial significativa. Avaliar necessidade de suporte vasopressor ou ajuste de drogas vasoativas já em uso.";
    if (!hasVaso) {
      treatmentSuggestions.push("Considerar início de suporte vasoativo após avaliação de estado volêmico");
    } else {
      treatmentSuggestions.push("Avaliar ajuste de dose de vasopressor com a equipe");
    }
  } else if (map < 70) {
    diagnosticImpression += " Pressão arterial média limítrofe. Monitorização hemodinâmica próxima necessária.";
  }
  
  if (fc > 140) {
    treatmentSuggestions.push("Taquicardia presente - avaliar causa (débito cardíaco, dor, ansiedade, desequilíbrio hídrico)");
  } else if (fc < 80 && patient.idade > 2) {
    treatmentSuggestions.push("Bradicardia relativa - considerar avaliação com a equipe");
  }
  
  if (lactatoValue > 2) {
    suggestedExams.push("Repetir lactato em 4-6h para avaliar tendência");
  }
  
  // Adicionar sugestões baseadas em risco
  if (riskLevel === "alto") {
    treatmentSuggestions.push("Paciente em alto risco - monitorização próxima recomendada");
  }
  
  return {
    title,
    summary,
    diagnosticImpression,
    suggestedExams,
    treatmentSuggestions,
    riskLevel
  };
}
