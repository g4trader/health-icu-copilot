/**
 * Tipo LabResult - Resultado de exame laboratorial
 */
export interface LabResult {
  id: string;
  tipo: "lactato" | "hemograma" | "gasometria" | "pcr" | "procalcitonina" | "funcao_renal" | "funcao_hepatica" | "outro";
  nome: string; // "Lactato", "Hemograma completo", etc
  valor: number | string; // pode ser numérico ou string (ex: "positivo")
  unidade?: string; // "mmol/L", "mg/dL", etc
  referencia?: string; // valores de referência
  data: string; // ISO string
  tendencia?: "subindo" | "estavel" | "caindo";
  critico: boolean; // se está fora dos valores normais
}






