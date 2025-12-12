/**
 * Calculadoras clínicas pediátricas
 * Funções puras para cálculos clínicos em UTI pediátrica
 */

/**
 * Calcula dose de droga baseada em peso
 * @param weightKg Peso do paciente em kg
 * @param doseMcgPerKgPerMin Dose em mcg/kg/min
 * @param concentrationMgPerMl Concentração da solução em mg/ml
 * @returns Dose em mcg/min e ml/hora
 */
export function calculateDrugDose(
  weightKg: number,
  doseMcgPerKgPerMin: number,
  concentrationMgPerMl: number
): { doseMcgMin: number; mlPerHour: number } {
  if (weightKg <= 0 || doseMcgPerKgPerMin < 0 || concentrationMgPerMl <= 0) {
    throw new Error("Valores inválidos para cálculo de dose");
  }

  const doseMcgMin = weightKg * doseMcgPerKgPerMin;
  const concentrationMcgPerMl = concentrationMgPerMl * 1000; // Converter mg/ml para mcg/ml
  const mlPerMin = doseMcgMin / concentrationMcgPerMl;
  const mlPerHour = mlPerMin * 60;

  return {
    doseMcgMin: Math.round(doseMcgMin * 100) / 100,
    mlPerHour: Math.round(mlPerHour * 100) / 100
  };
}

/**
 * Calcula manutenção hídrica pediátrica (regra de Holliday-Segar)
 * @param weightKg Peso do paciente em kg
 * @returns Manutenção hídrica em ml/dia e ml/hora
 */
export function calculateMaintenanceFluids(weightKg: number): {
  mlPerDay: number;
  mlPerHour: number;
} {
  if (weightKg <= 0) {
    throw new Error("Peso inválido para cálculo de manutenção hídrica");
  }

  let mlPerDay: number;

  if (weightKg <= 10) {
    // Primeiros 10 kg: 100 ml/kg/dia
    mlPerDay = weightKg * 100;
  } else if (weightKg <= 20) {
    // 10-20 kg: 1000 ml + 50 ml/kg para cada kg acima de 10
    mlPerDay = 1000 + (weightKg - 10) * 50;
  } else {
    // > 20 kg: 1500 ml + 20 ml/kg para cada kg acima de 20
    mlPerDay = 1500 + (weightKg - 20) * 20;
  }

  const mlPerHour = mlPerDay / 24;

  return {
    mlPerDay: Math.round(mlPerDay),
    mlPerHour: Math.round(mlPerHour * 100) / 100
  };
}

/**
 * Calcula clearance de creatinina usando fórmula de Schwartz
 * @param heightCm Altura do paciente em cm
 * @param serumCreatinine Creatinina sérica em mg/dL
 * @param k Constante K (padrão: 0.55 para crianças, 0.7 para adolescentes)
 * @returns Clearance de creatinina em ml/min/1.73m²
 */
export function calculateSchwartzClCr(
  heightCm: number,
  serumCreatinine: number,
  k: number = 0.55
): { clCrMlMin1_73: number } {
  if (heightCm <= 0 || serumCreatinine <= 0 || k <= 0) {
    throw new Error("Valores inválidos para cálculo de Schwartz");
  }

  // Fórmula de Schwartz: ClCr = (k × altura em cm) / creatinina sérica
  const clCrMlMin1_73 = (k * heightCm) / serumCreatinine;

  return {
    clCrMlMin1_73: Math.round(clCrMlMin1_73 * 100) / 100
  };
}

/**
 * Calcula superfície corporal (BSA) usando fórmula de Mosteller
 * @param weightKg Peso em kg
 * @param heightCm Altura em cm
 * @returns Superfície corporal em m²
 */
export function calculateBSA(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) {
    throw new Error("Peso ou altura inválidos");
  }

  const heightM = heightCm / 100;
  const bsa = Math.sqrt((weightKg * heightM) / 3600);

  return Math.round(bsa * 10000) / 10000;
}

/**
 * Calcula dose de droga baseada em superfície corporal
 * @param bsa Superfície corporal em m²
 * @param doseMgPerM2 Dose em mg/m²
 * @returns Dose total em mg
 */
export function calculateDoseByBSA(bsa: number, doseMgPerM2: number): number {
  if (bsa <= 0 || doseMgPerM2 < 0) {
    throw new Error("Valores inválidos para cálculo de dose por BSA");
  }

  return Math.round((bsa * doseMgPerM2) * 100) / 100;
}

