/**
 * Memória clínica contextual
 * Mantém contexto de paciente e histórico de intenções
 */

export interface ClinicalMemory {
  sessionId: string;
  pacienteAtivo?: string | null; // ID do paciente
  historicoIntencoes: Array<{
    intencao: string;
    timestamp: string;
    pacienteId?: string | null;
  }>;
  ultimaInteracao?: {
    intencao: string;
    timestamp: string;
  };
}

// Store em memória por sessão
const memoryStore = new Map<string, ClinicalMemory>();

/**
 * Inicializa ou recupera memória de uma sessão
 */
export function getOrCreateMemory(sessionId: string): ClinicalMemory {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, {
      sessionId,
      pacienteAtivo: null,
      historicoIntencoes: []
    });
  }
  return memoryStore.get(sessionId)!;
}

/**
 * Atualiza paciente ativo na memória
 */
export function updateActivePatient(sessionId: string, pacienteId: string | null): void {
  const memory = getOrCreateMemory(sessionId);
  memory.pacienteAtivo = pacienteId;
}

/**
 * Adiciona intenção ao histórico
 */
export function addIntentionToHistory(
  sessionId: string,
  intencao: string,
  pacienteId?: string | null
): void {
  const memory = getOrCreateMemory(sessionId);
  const entry = {
    intencao,
    timestamp: new Date().toISOString(),
    pacienteId: pacienteId || memory.pacienteAtivo || null
  };
  
  memory.historicoIntencoes.push(entry);
  memory.ultimaInteracao = entry;
  
  // Manter apenas últimas 10 intenções
  if (memory.historicoIntencoes.length > 10) {
    memory.historicoIntencoes = memory.historicoIntencoes.slice(-10);
  }
}

/**
 * Resolve ambiguidade usando contexto da memória
 */
export function resolveAmbiguity(
  sessionId: string,
  intencaoDetectada: string,
  mensagem: string
): string {
  const memory = getOrCreateMemory(sessionId);
  
  // Se há paciente ativo e a mensagem é ambígua, assumir paciente ativo
  if (memory.pacienteAtivo && intencaoDetectada === "FALLBACK") {
    // Verificar se mensagem pode ser sobre paciente específico
    const msg = mensagem.toLowerCase();
    if (msg.includes("paciente") || msg.includes("ele") || msg.includes("ela") || msg.includes("este")) {
      return "PACIENTE_ESPECIFICO";
    }
  }
  
  // Se última intenção foi similar, manter contexto
  if (memory.ultimaInteracao) {
    const ultima = memory.ultimaInteracao.intencao;
    if (ultima === intencaoDetectada) {
      return intencaoDetectada; // Manter contexto
    }
  }
  
  return intencaoDetectada;
}

/**
 * Limpa memória de uma sessão
 */
export function clearMemory(sessionId: string): void {
  memoryStore.delete(sessionId);
}



