"use client";

/**
 * Componente que quebra texto longo em bullets curtos (máx 3)
 * Processa texto que pode vir como bullets separados por \n ou parágrafo
 */
export function OpinionBullets({ text }: { text: string }) {
  if (!text) return null;

  const cleanText = text.trim();
  
  // Se o texto já vem com bullets (começando com • ou - ou números)
  // ou separado por \n, processar como bullets
  let bullets: string[] = [];
  
  // Tentar dividir por quebras de linha primeiro
  if (cleanText.includes('\n')) {
    bullets = cleanText
      .split('\n')
      .map(line => {
        // Remover marcadores de bullet (•, -, números, etc)
        return line.replace(/^[•\-\d\.\)]\s*/, '').trim();
      })
      .filter(line => line.length > 10) // Filtrar linhas muito curtas
      .slice(0, 3); // Máximo 3 bullets
  }
  
  // Se não conseguiu dividir por \n, tentar por pontos
  if (bullets.length === 0) {
    bullets = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 150) // Filtrar frases muito curtas ou longas
      .slice(0, 3); // Máximo 3 bullets
  }
  
  // Se ainda não conseguiu, truncar texto original
  if (bullets.length === 0) {
    const truncated = cleanText.length > 150 ? cleanText.substring(0, 150) + "..." : cleanText;
    bullets = [truncated];
  }

  return (
    <ul className="opinion-bullets-list">
      {bullets.map((bullet, idx) => (
        <li key={idx} className="opinion-bullet-item">
          {bullet}
        </li>
      ))}
    </ul>
  );
}

