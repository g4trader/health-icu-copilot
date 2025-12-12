/**
 * Agentes de subespecialidade clínica
 * Cada agente ajusta apenas o system prompt, não altera dados ou cálculos
 */

export type ClinicalAgentType = "default" | "cardiology" | "pneumology" | "neurology";

export interface ClinicalAgent {
  type: ClinicalAgentType;
  name: string;
  systemPrompt: string;
  keywords: string[];
}

export const clinicalAgents: Record<ClinicalAgentType, ClinicalAgent> = {
  default: {
    type: "default",
    name: "Assistente Geral",
    systemPrompt: "Você é um assistente médico para UTI pediátrica. Melhore a redação de textos mantendo todos os fatos e números exatamente como estão. Use linguagem médica apropriada e tom assistivo, evitando linguagem prescritiva.",
    keywords: []
  },
  cardiology: {
    type: "cardiology",
    name: "Especialista em Cardiologia Pediátrica",
    systemPrompt: "Você é um assistente médico especializado em cardiologia pediátrica para UTI. Melhore a redação de textos mantendo todos os fatos e números exatamente como estão. Use linguagem médica apropriada com foco em aspectos cardiovasculares, hemodinâmicos e função cardíaca. Tom assistivo, evitando linguagem prescritiva.",
    keywords: ["cardio", "cardio:", "cardiologia", "cardíaco", "cardiaco", "hemodinâmica", "hemodinamica", "vasopressor", "função cardíaca", "funcao cardiaca"]
  },
  pneumology: {
    type: "pneumology",
    name: "Especialista em Pneumologia Pediátrica",
    systemPrompt: "Você é um assistente médico especializado em pneumologia pediátrica para UTI. Melhore a redação de textos mantendo todos os fatos e números exatamente como estão. Use linguagem médica apropriada com foco em aspectos respiratórios, ventilação mecânica e função pulmonar. Tom assistivo, evitando linguagem prescritiva.",
    keywords: ["pneumo", "pneumo:", "pneumologia", "respiratório", "respiratorio", "ventilação", "ventilacao", "vm", "pao2", "fio2"]
  },
  neurology: {
    type: "neurology",
    name: "Especialista em Neurologia Pediátrica",
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
  for (const [type, agent] of Object.entries(clinicalAgents)) {
    if (type === "default") continue;
    
    if (agent.keywords.some(keyword => msg.includes(keyword))) {
      return type as ClinicalAgentType;
    }
  }
  
  // Manter agente atual se não houver indicação de mudança
  return currentAgent || "default";
}

/**
 * Obtém agente pelo tipo
 */
export function getAgent(type: ClinicalAgentType): ClinicalAgent {
  return clinicalAgents[type];
}

