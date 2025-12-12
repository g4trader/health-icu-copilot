/**
 * Store para pesquisa clínica
 * Armazena dados desidentificados para análise
 */

export interface ResearchEntry {
  timestamp: string;
  sessionId: string;
  pergunta: string; // Primeiros 200 caracteres, desidentificada
  intencao: string;
  dadosExibidos: {
    tipo: "paciente" | "calculo" | "exames" | "perfil" | "outro";
    ids?: string[]; // IDs desidentificados
    quantidade?: number;
  };
  duracaoProcessamento: number; // ms
  llmUtilizado: boolean;
}

// Store em memória (em produção, seria persistido em banco de dados)
const researchStore: ResearchEntry[] = [];

/**
 * Armazena entrada de pesquisa
 */
export function storeResearchEntry(entry: ResearchEntry): void {
  researchStore.push(entry);
  
  // Em produção, aqui seria feita a persistência em banco de dados
  // Por enquanto, apenas log no console em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log("[RESEARCH]", {
      timestamp: entry.timestamp,
      intencao: entry.intencao,
      tipo: entry.dadosExibidos.tipo
    });
  }
}

/**
 * Retorna todas as entradas de pesquisa
 */
export function getAllResearchEntries(): ResearchEntry[] {
  return [...researchStore];
}

/**
 * Retorna entradas de uma sessão específica
 */
export function getSessionResearchEntries(sessionId: string): ResearchEntry[] {
  return researchStore.filter(entry => entry.sessionId === sessionId);
}

/**
 * Limpa store (apenas para desenvolvimento/testes)
 */
export function clearResearchStore(): void {
  researchStore.length = 0;
}

/**
 * Desidentifica texto removendo nomes e informações sensíveis
 */
export function desidentifyText(text: string): string {
  // Remover nomes comuns (mock - em produção seria mais sofisticado)
  const commonNames = ["sophia", "gabriel", "isabella", "lucas", "maria", "joão", "ana", "rafael", "laura", "enzo"];
  let desidentified = text.toLowerCase();
  
  commonNames.forEach(name => {
    const regex = new RegExp(`\\b${name}\\b`, "gi");
    desidentified = desidentified.replace(regex, "[nome]");
  });
  
  // Limitar tamanho
  return desidentified.substring(0, 200);
}

