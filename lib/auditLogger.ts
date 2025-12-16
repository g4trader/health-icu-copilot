/**
 * Sistema de auditoria e logs clínicos
 * Registra todas as interações para governança e pesquisa
 */

export interface AuditLog {
  timestamp: string; // ISO string
  sessionId: string;
  userId: string; // Mock
  role: "plantonista" | "diarista" | "coordenador" | "outro";
  unidade: string;
  pacienteFocado?: string | null;
  intencaoDetectada: string;
  tipoResposta: "texto" | "painel" | "calculo" | "misto";
  versaoModelo: string;
  llmUtilizado: boolean;
  mensagemUsuario?: string; // Primeiros 100 caracteres
  duracaoProcessamento?: number; // ms
}

// Store em memória (em produção, seria persistido em banco de dados)
const auditLogs: AuditLog[] = [];

/**
 * Registra uma interação clínica
 */
export function logClinicalInteraction(log: AuditLog): void {
  auditLogs.push(log);
  
  // Em produção, aqui seria feita a persistência em banco de dados
  // Por enquanto, apenas log no console em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log("[AUDIT]", {
      timestamp: log.timestamp,
      sessionId: log.sessionId,
      userId: log.userId,
      intencao: log.intencaoDetectada,
      tipo: log.tipoResposta
    });
  }
}

/**
 * Retorna logs de uma sessão específica
 */
export function getSessionLogs(sessionId: string): AuditLog[] {
  return auditLogs.filter(log => log.sessionId === sessionId);
}

/**
 * Retorna todos os logs (para análise)
 */
export function getAllLogs(): AuditLog[] {
  return [...auditLogs];
}

/**
 * Limpa logs (apenas para desenvolvimento/testes)
 */
export function clearLogs(): void {
  auditLogs.length = 0;
}



