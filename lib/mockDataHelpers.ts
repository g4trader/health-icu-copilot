import type { LabResult } from "@/types/LabResult";

/**
 * Helper para gerar série de exames laboratoriais com tendência coerente
 */
export function generateLabResultsSeries(
  baseDate: Date,
  type: LabResult["tipo"],
  name: string,
  unit: string,
  reference: string,
  values: number[], // Valores ao longo do tempo (mais antigo primeiro)
  dates: Date[], // Datas correspondentes (deve ter mesmo tamanho que values)
  patientId: string,
  criticalThreshold?: number
): LabResult[] {
  if (values.length !== dates.length) {
    throw new Error("values and dates arrays must have same length");
  }
  
  return values.map((value, index) => {
    let tendencia: "subindo" | "estavel" | "caindo" | undefined;
    if (index < values.length - 1) {
      const nextValue = values[index + 1];
      if (nextValue > value * 1.1) tendencia = "subindo";
      else if (nextValue < value * 0.9) tendencia = "caindo";
      else tendencia = "estavel";
    }
    
    const critico = criticalThreshold ? value >= criticalThreshold : false;
    
    return {
      id: `${patientId}-${type}-${index}`,
      tipo: type,
      nome: name,
      valor: value,
      unidade: unit,
      referencia: reference,
      data: dates[index].toISOString(),
      tendencia,
      critico
    };
  });
}

/**
 * Helper para gerar série de PCR com progressão típica de sepse
 */
export function generatePCRSeries(
  baseDate: Date,
  patientId: string,
  peakValue: number,
  isImproving: boolean
): LabResult[] {
  const dates: Date[] = [];
  const values: number[] = [];
  
  // Gerar 4-5 pontos ao longo de 3-4 dias
  for (let i = 0; i < 5; i++) {
    const daysAgo = 4 - i;
    dates.push(new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000));
    
    if (isImproving) {
      // Melhora: pico inicial, depois cai
      const progress = i / 4;
      values.push(peakValue * (1 - progress * 0.6)); // Cai até 40% do pico
    } else {
      // Piora: sobe progressivamente
      const progress = i / 4;
      values.push(peakValue * (0.5 + progress * 0.5)); // Sobe de 50% para 100% do pico
    }
  }
  
  return generateLabResultsSeries(
    baseDate,
    "pcr",
    "Proteína C Reativa",
    "mg/L",
    "< 3.0",
    values,
    dates,
    patientId,
    50 // Crítico se >= 50
  );
}

/**
 * Helper para gerar série de lactato com progressão típica de choque
 */
export function generateLactateSeries(
  baseDate: Date,
  patientId: string,
  peakValue: number,
  isImproving: boolean
): LabResult[] {
  const dates: Date[] = [];
  const values: number[] = [];
  
  // Gerar 4-5 pontos ao longo de 2-3 dias
  for (let i = 0; i < 5; i++) {
    const hoursAgo = (4 - i) * 12; // A cada 12 horas
    dates.push(new Date(baseDate.getTime() - hoursAgo * 60 * 60 * 1000));
    
    if (isImproving) {
      // Melhora: pico inicial, depois cai
      const progress = i / 4;
      values.push(peakValue * (1 - progress * 0.5)); // Cai até 50% do pico
    } else {
      // Piora: sobe progressivamente
      const progress = i / 4;
      values.push(peakValue * (0.7 + progress * 0.3)); // Sobe de 70% para 100% do pico
    }
  }
  
  return generateLabResultsSeries(
    baseDate,
    "lactato",
    "Lactato",
    "mmol/L",
    "< 2.0",
    values,
    dates,
    patientId,
    3.0 // Crítico se >= 3.0
  );
}

/**
 * Helper para gerar série de função renal (creatinina)
 */
export function generateCreatinineSeries(
  baseDate: Date,
  patientId: string,
  peakValue: number,
  isImproving: boolean
): LabResult[] {
  const dates: Date[] = [];
  const values: number[] = [];
  
  // Gerar 4 pontos ao longo de 3 dias
  for (let i = 0; i < 4; i++) {
    const daysAgo = 3 - i;
    dates.push(new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000));
    
    if (isImproving) {
      // Melhora: pico inicial, depois cai
      const progress = i / 3;
      values.push(peakValue * (1 - progress * 0.4)); // Cai até 60% do pico
    } else {
      // Piora: sobe progressivamente
      const progress = i / 3;
      values.push(peakValue * (0.8 + progress * 0.2)); // Sobe de 80% para 100% do pico
    }
  }
  
  return generateLabResultsSeries(
    baseDate,
    "funcao_renal",
    "Creatinina",
    "mg/dL",
    "0.3-1.0",
    values,
    dates,
    patientId,
    1.5 // Crítico se >= 1.5
  );
}

