/**
 * Agentes de subespecialidade clínica
 * Cada agente ajusta apenas o system prompt, não altera dados ou cálculos
 */

import type { Patient } from '@/types/Patient';
import { riskLevelFromScore } from './mockData';

export type ClinicalAgentType = "default" | "cardiology" | "pneumology" | "neurology";
export type ClinicalAgentId = 'general' | 'cardiology' | 'pneumology' | 'neurology';

export interface ClinicalAgent {
  id: ClinicalAgentId;
  type: ClinicalAgentType;
  name: string;
  emoji: string;
  description: string;
  systemPrompt: string;
  keywords: string[];
}

export const clinicalAgents: Record<ClinicalAgentId, ClinicalAgent> = {
  general: {
    id: "general",
    type: "default",
    name: "Assistente Geral",
    emoji: "🧑‍⚕️",
    description: "Assistente geral para UTI pediátrica",
    systemPrompt: "Você é um assistente médico para UTI pediátrica. Melhore a redação de textos mantendo todos os fatos e números exatamente como estão. Use linguagem médica apropriada e tom assistivo, evitando linguagem prescritiva.",
    keywords: []
  },
  cardiology: {
    id: "cardiology",
    type: "cardiology",
    name: "Cardiologia Pediátrica",
    emoji: "❤️",
    description: "Especialista em cardiologia pediátrica",
    systemPrompt: "Você é um assistente médico especializado em cardiologia pediátrica para UTI. Melhore a redação de textos mantendo todos os fatos e números exatamente como estão. Use linguagem médica apropriada com foco em aspectos cardiovasculares, hemodinâmicos e função cardíaca. Tom assistivo, evitando linguagem prescritiva.",
    keywords: ["cardio", "cardio:", "cardiologia", "cardíaco", "cardiaco", "hemodinâmica", "hemodinamica", "vasopressor", "função cardíaca", "funcao cardiaca"]
  },
  pneumology: {
    id: "pneumology",
    type: "pneumology",
    name: "Pneumologia Pediátrica",
    emoji: "🫁",
    description: "Especialista em pneumologia pediátrica",
    systemPrompt: "Você é um assistente médico especializado em pneumologia pediátrica para UTI. Melhore a redação de textos mantendo todos os fatos e números exatamente como estão. Use linguagem médica apropriada com foco em aspectos respiratórios, ventilação mecânica e função pulmonar. Tom assistivo, evitando linguagem prescritiva.",
    keywords: ["pneumo", "pneumo:", "pneumologia", "respiratório", "respiratorio", "ventilação", "ventilacao", "vm", "pao2", "fio2"]
  },
  neurology: {
    id: "neurology",
    type: "neurology",
    name: "Neurologia Pediátrica",
    emoji: "🧠",
    description: "Especialista em neurologia pediátrica",
    systemPrompt: "Você é um assistente médico especializado em neurologia pediátrica para UTI. Melhore a redação de textos mantendo todos os fatos e números exatamente como estão. Use linguagem médica apropriada com foco em aspectos neurológicos, escala de Glasgow, pressão intracraniana e função neurológica. Tom assistivo, evitando linguagem prescritiva.",
    keywords: ["neuro", "neuro:", "neurologia", "neurológico", "neurologico", "glasgow", "gcs", "pic", "pressão intracraniana", "pressao intracraniana"]
  }
};

/**
 * Detecta agente baseado em mensagem do usuário
 */
export function detectAgent(message: string, currentAgent?: ClinicalAgentType): ClinicalAgentType {
  const msg = message.toLowerCase();
  
  // Verificar comandos explícitos primeiro
  if (msg.includes("cardio:") || msg.includes("cardiologia:")) {
    return "cardiology";
  }
  if (msg.includes("pneumo:") || msg.includes("pneumologia:")) {
    return "pneumology";
  }
  if (msg.includes("neuro:") || msg.includes("neurologia:")) {
    return "neurology";
  }
  
  // Verificar palavras-chave
  for (const [id, agent] of Object.entries(clinicalAgents)) {
    if (id === "general") continue;
    
    if (agent.keywords.some(keyword => msg.includes(keyword))) {
      return agent.type;
    }
  }
  
  // Manter agente atual se não houver indicação de mudança
  return currentAgent || "default";
}

/**
 * Obtém agente pelo tipo
 */
export function getAgent(type: ClinicalAgentType): ClinicalAgent {
  const agentMap: Record<ClinicalAgentType, ClinicalAgentId> = {
    default: "general",
    cardiology: "cardiology",
    pneumology: "pneumology",
    neurology: "neurology"
  };
  return clinicalAgents[agentMap[type]];
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
  
  let title = `${agent.emoji} ${agent.name} – Parecer automático (protótipo)`;
  let summary = "";
  let diagnosticImpression = "";
  const suggestedExams: string[] = [];
  const treatmentSuggestions: string[] = [];

  if (agentId === "cardiology") {
    summary = `Paciente ${patient.nome} (${patient.idade} anos, ${patient.peso.toFixed(1)} kg), ${patient.leito}, com diagnóstico principal de ${patient.diagnosticoPrincipal}.`;
    
    // Análise cardiovascular
    const map = vs.pressaoArterialMedia;
    const fc = vs.frequenciaCardiaca;
    const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
    
    if (map < 65) {
      diagnosticImpression = "Hipotensão arterial significativa. Avaliar necessidade de suporte vasopressor ou ajuste de drogas vasoativas já em uso.";
      if (!hasVaso) {
        treatmentSuggestions.push("Considerar início de suporte vasoativo após avaliação de estado volêmico");
      } else {
        treatmentSuggestions.push("Avaliar ajuste de dose de vasopressor com a equipe");
      }
    } else if (map < 70) {
      diagnosticImpression = "Pressão arterial média limítrofe. Monitorização hemodinâmica próxima necessária.";
    } else {
      diagnosticImpression = "Hemodinâmica estável no momento. Manter monitorização.";
    }
    
    if (fc > 140) {
      treatmentSuggestions.push("Taquicardia presente - avaliar causa (débito cardíaco, dor, ansiedade, desequilíbrio hídrico)");
    } else if (fc < 80 && patient.idade > 2) {
      treatmentSuggestions.push("Bradicardia relativa - considerar avaliação com a equipe");
    }
    
    suggestedExams.push("Ecocardiograma transtorácico (pode ser considerada se ainda não realizado)");
    if (lactatoValue > 2) {
      suggestedExams.push("Repetir lactato em 4-6h para avaliar tendência");
    }
    suggestedExams.push("Gasometria arterial para avaliar equilíbrio ácido-base");
    
  } else if (agentId === "pneumology") {
    summary = `Paciente ${patient.nome} (${patient.idade} anos, ${patient.peso.toFixed(1)} kg), ${patient.leito}, com diagnóstico principal de ${patient.diagnosticoPrincipal}.`;
    
    if (patient.ventilationParams) {
      const vm = patient.ventilationParams;
      const spo2 = vs.saturacaoO2;
      
      diagnosticImpression = `Em ventilação mecânica (modo: ${vm.modo}), FiO₂ ${vm.fiO2}%, PEEP ${vm.peep} cmH₂O.`;
      
      if (spo2 < 92) {
        diagnosticImpression += " Hipoxemia significativa. Avaliar parâmetros ventilatórios e possível necessidade de ajustes.";
        treatmentSuggestions.push("Avaliar com a equipe possibilidade de aumentar PEEP ou FiO₂ temporariamente");
      } else if (spo2 < 95) {
        diagnosticImpression += " Saturação limítrofe. Monitorização próxima necessária.";
      }
      
      if (vm.fiO2 > 60) {
        treatmentSuggestions.push("FiO₂ elevada - avaliar estratégias de recrutamento pulmonar com a equipe");
      }
      
      if (vm.peep > 10) {
        treatmentSuggestions.push("PEEP elevado - monitorar risco de barotrauma");
      }
      
      if (vm.paO2FiO2 && vm.paO2FiO2 < 200) {
        diagnosticImpression += " Relação PaO₂/FiO₂ baixa, sugerindo comprometimento da troca gasosa.";
        treatmentSuggestions.push("Considerar avaliação com a equipe de possíveis estratégias de ventilação protetora");
      }
      
      suggestedExams.push("Radiografia de tórax (se não realizada nas últimas 24h)");
      suggestedExams.push("Gasometria arterial para avaliação de PaO₂, PaCO₂ e relação PaO₂/FiO₂");
    } else {
      diagnosticImpression = "Não em ventilação mecânica no momento.";
      if (vs.frequenciaRespiratoria > 40 || vs.saturacaoO2 < 95) {
        diagnosticImpression += " Sinais de desconforto respiratório presentes.";
        treatmentSuggestions.push("Avaliar necessidade de suporte ventilatório com a equipe");
      }
      suggestedExams.push("Radiografia de tórax para avaliação pulmonar");
      if (vs.saturacaoO2 < 95) {
        suggestedExams.push("Gasometria arterial para avaliação gasométrica");
      }
    }
    
  } else if (agentId === "neurology") {
    summary = `Paciente ${patient.nome} (${patient.idade} anos, ${patient.peso.toFixed(1)} kg), ${patient.leito}, com diagnóstico principal de ${patient.diagnosticoPrincipal}.`;
    
    const gcs = vs.escalaGlasgow;
    
    if (gcs !== undefined && gcs !== null) {
      diagnosticImpression = `Escala de Glasgow: ${gcs}.`;
      
      if (gcs <= 8) {
        diagnosticImpression += " Coma (GCS ≤ 8). Avaliar proteção de via aérea e monitorização neurológica.";
        treatmentSuggestions.push("Avaliar com a equipe necessidade de intubação para proteção de via aérea");
      } else if (gcs <= 12) {
        diagnosticImpression += " Depressão do nível de consciência. Monitorização neurológica próxima necessária.";
      } else {
        diagnosticImpression += " Nível de consciência preservado.";
      }
      
      suggestedExams.push("Tomografia computadorizada de crânio (pode ser considerada conforme indicação clínica)");
      if (gcs <= 12) {
        suggestedExams.push("EEG (pode ser considerada para avaliação de atividade convulsiva subclínica)");
      }
    } else {
      diagnosticImpression = "Escala de Glasgow não disponível no momento.";
      suggestedExams.push("Avaliação de escala de Glasgow e nível de consciência");
      suggestedExams.push("Tomografia computadorizada de crânio (pode ser considerada conforme indicação clínica)");
    }
    
    const hasSedation = patient.medications.some(m => m.tipo === "sedativo" && m.ativo);
    if (hasSedation) {
      treatmentSuggestions.push("Sedação contínua em uso - avaliar com a equipe possibilidade de sedação intermitente para avaliação neurológica");
    }
    
    if (lactatoValue > 3) {
      treatmentSuggestions.push("Lactato elevado - considerar avaliação de perfusão cerebral");
    }
    suggestedExams.push("Monitorização de pressão intracraniana (avaliar indicação com a equipe)");
    
  } else {
    // General
    summary = `Paciente ${patient.nome} (${patient.idade} anos, ${patient.peso.toFixed(1)} kg), ${patient.leito}, com diagnóstico principal de ${patient.diagnosticoPrincipal}.`;
    diagnosticImpression = "Avaliação geral do caso. Recomenda-se avaliação específica com subespecialistas conforme necessidade.";
    suggestedExams.push("Revisar exames laboratoriais mais recentes");
    if (lactatoValue > 2) {
      treatmentSuggestions.push("Lactato elevado - avaliar perfusão tecidual");
    }
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
