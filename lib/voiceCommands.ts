/**
 * Detecção de comandos de voz para navegação de pacientes
 */

export type VoiceCommand =
  | { type: "select-patient"; bed: number }
  | { type: "update-opinion" }
  | { type: "none" };

/**
 * Normaliza texto removendo acentos básicos e convertendo para lowercase
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .trim();
}

/**
 * Detecta comandos de voz em português para navegação de pacientes e atualização de parecer
 * 
 * Exemplos de seleção de paciente:
 * - "mostrar paciente 5"
 * - "mostra paciente 3"
 * - "abre o leito 3"
 * - "abrir leito 8"
 * - "leito 5"
 * - "me mostra o paciente 1"
 * - "focar no leito 8"
 * - "ver paciente 5"
 * 
 * Exemplos de atualização de parecer:
 * - "parecer do paciente..."
 * - "atualizar parecer..."
 * - "parecer..."
 */
export function detectVoiceCommand(text: string): VoiceCommand {
  const normalized = normalizeText(text);
  
  // PRIMEIRO: Verificar se é comando de atualização de parecer
  // Deve começar com palavras-chave relacionadas a parecer/atualizar
  const opinionPatterns = [
    /^parecer/,
    /^atualizar\s+(?:o\s+)?parecer/,
    /^dar\s+(?:o\s+)?parecer/,
    /^fazer\s+(?:o\s+)?parecer/,
    /^registrar\s+(?:o\s+)?parecer/,
  ];
  
  for (const pattern of opinionPatterns) {
    if (pattern.test(normalized)) {
      return { type: "update-opinion" };
    }
  }
  
  // SEGUNDO: Verificar se é comando de seleção de paciente/leito
  const selectPatterns = [
    // "mostrar paciente X" ou "mostra paciente X" ou "ver paciente X"
    /(?:mostrar|mostra|ver)\s+(?:o\s+)?(?:paciente|leito)\s+(\d+)/,
    // "abre o leito X" ou "abrir leito X"
    /(?:abre|abrir)\s+(?:o\s+)?leito\s+(\d+)/,
    // "leito X" (standalone)
    /^leito\s+(\d+)$/,
    // "focar no leito X" ou "focar leito X"
    /focar\s+(?:no\s+)?leito\s+(\d+)/,
    // "me mostra o paciente X"
    /me\s+mostra\s+(?:o\s+)?(?:paciente|leito)\s+(\d+)/,
    // "paciente X" (standalone, mas mais específico)
    /^paciente\s+(\d+)$/,
  ];
  
  // Tentar cada padrão
  for (const pattern of selectPatterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const bedNumber = parseInt(match[1], 10);
      if (!isNaN(bedNumber) && bedNumber > 0) {
        return { type: "select-patient", bed: bedNumber };
      }
    }
  }
  
  // Nenhum comando detectado
  return { type: "none" };
}

