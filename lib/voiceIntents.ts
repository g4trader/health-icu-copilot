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
  
  const keywords = [
    "atualizar",
    "atualiza",
    "parecer",
    "evolucao",
    "evoluir",
    "evolução",
    "evoluir",
    "nota",
    "dar parecer",
    "fazer parecer",
    "registrar parecer"
  ];
  
  return keywords.some(keyword => t.startsWith(keyword) || t.includes(` ${keyword} `));
}

