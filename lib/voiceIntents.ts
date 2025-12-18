/**
 * Detecção de intenções em notas de voz
 */

/**
 * Verifica se o texto transcrito indica intenção de atualizar parecer/evolução
 * 
 * @param rawText Texto transcrito da nota de voz
 * @returns true se o texto começa com palavras-chave de atualização de parecer
 */
export function isUpdateOpinionIntent(rawText: string): boolean {
  const t = rawText.trim().toLowerCase();
  
  // Normalizar texto removendo acentos e caracteres especiais para melhor detecção
  const normalized = t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s]/g, ""); // Remove caracteres especiais
  
  const keywords = [
    "atualizar",
    "atualiza",
    "atualiz",
    "parecer",
    "evolucao",
    "evoluir",
    "evoluc",
    "nota",
    "dar parecer",
    "fazer parecer",
    "registrar parecer"
  ];
  
  // Verificar se começa com alguma palavra-chave (tolerante a erros de transcrição)
  const startsWithKeyword = keywords.some(keyword => {
    // Verificar início exato
    if (normalized.startsWith(keyword)) return true;
    // Verificar início com pequenas variações (até 2 caracteres diferentes)
    if (normalized.length >= keyword.length - 2) {
      const prefix = normalized.substring(0, Math.min(keyword.length + 2, normalized.length));
      // Verificar similaridade simples (contém a maior parte da palavra)
      if (prefix.includes(keyword.substring(0, Math.max(3, keyword.length - 2)))) {
        return true;
      }
    }
    return false;
  });
  
  // Também verificar se contém a palavra-chave no início da frase
  const containsKeywordAtStart = keywords.some(keyword => 
    normalized.includes(keyword) && normalized.indexOf(keyword) < 10 // Dentro dos primeiros 10 caracteres
  );
  
  const result = startsWithKeyword || containsKeywordAtStart;
  console.log("[isUpdateOpinionIntent] Verificando:", { rawText, normalized, result });
  
  return result;
}

