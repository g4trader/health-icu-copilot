/**
 * Aplica categoria de risco alvo ao snapshot do paciente
 * Garante distribuição controlada: 2 baixos, 5 médios, 3 altos
 */

import type { Patient } from "@/types/Patient";

export type TargetRiskCategory = "low" | "moderate" | "high";

/**
 * Aplica categoria de risco alvo ao snapshot do paciente
 */
/**
 * Gera valor determinístico baseado no ID do paciente
 */
function deterministicValue(patientId: string, min: number, max: number): number {
  const patientNum = parseInt(patientId.replace("p", "")) || 1;
  // Hash simples: usar o número do paciente para gerar valor entre min e max
  const hash = (patientNum * 17 + 7) % 100; // 0-99
  return min + (hash / 100) * (max - min);
}

export function applyTargetRisk(
  patient: Patient,
  category: TargetRiskCategory
): Patient {
  switch (category) {
    case "low":
      // Baixo risco: próximo de alta
      return {
        ...patient,
        riscoMortality24h: deterministicValue(patient.id, 0.08, 0.15), // 0.08-0.15
        riscoMortality7d: deterministicValue(patient.id, 0.10, 0.18), // 0.10-0.18
        medications: patient.medications.map((m) =>
          m.tipo === "vasopressor" ? { ...m, ativo: false } : m
        ),
        ventilationParams: undefined, // Sem VM invasiva
        vitalSigns: {
          ...patient.vitalSigns,
          pressaoArterialMedia: Math.max(65, patient.vitalSigns.pressaoArterialMedia),
          saturacaoO2: Math.max(94, Math.min(100, patient.vitalSigns.saturacaoO2)),
          frequenciaCardiaca: Math.min(150, Math.max(60, patient.vitalSigns.frequenciaCardiaca)),
          temperatura: Math.min(38.0, Math.max(36.5, patient.vitalSigns.temperatura)),
        },
      };

    case "moderate":
      // Risco moderado: instável mas não crítico
      // Garantir que alguns tenham VM e outros vaso, mas não todos
      const patientIndex = parseInt(patient.id.replace("p", "")) || 0;
      const hasVM = patientIndex % 2 === 0; // Alternar VM
      const hasVaso = patientIndex % 3 !== 0; // Maioria com vaso
      
      return {
        ...patient,
        riscoMortality24h: deterministicValue(patient.id, 0.35, 0.55), // 0.35-0.55
        riscoMortality7d: deterministicValue(patient.id, 0.45, 0.65), // 0.45-0.65
        medications: patient.medications.map((m) =>
          m.tipo === "vasopressor"
            ? { ...m, ativo: hasVaso, dose: hasVaso ? deterministicValue(patient.id, 0.2, 0.6) : m.dose } // 0.2-0.6 mcg/kg/min
            : m
        ),
        ventilationParams: hasVM
          ? {
              ...patient.ventilationParams!,
              fiO2: Math.round(deterministicValue(patient.id, 30, 60)), // 30-60%
              peep: Math.round(deterministicValue(patient.id, 5, 10)), // 5-10 cmH2O
            }
          : undefined,
        vitalSigns: {
          ...patient.vitalSigns,
          pressaoArterialMedia: Math.round(deterministicValue(patient.id, 55, 65)), // 55-65 mmHg
          saturacaoO2: Math.round(deterministicValue(patient.id, 90, 95)), // 90-95%
          frequenciaCardiaca: Math.round(deterministicValue(patient.id, 120, 150)), // 120-150 bpm
          temperatura: Math.round(deterministicValue(patient.id, 37.0, 38.5) * 10) / 10, // 37.0-38.5°C
        },
      };

    case "high":
      // Alto risco: claramente crítico
      return {
        ...patient,
        riscoMortality24h: deterministicValue(patient.id, 0.72, 0.87), // 0.72-0.87
        riscoMortality7d: deterministicValue(patient.id, 0.78, 0.93), // 0.78-0.93
        medications: patient.medications.map((m) =>
          m.tipo === "vasopressor"
            ? { ...m, ativo: true, dose: deterministicValue(patient.id, 0.5, 1.3) } // 0.5-1.3 mcg/kg/min
            : m
        ),
        ventilationParams: patient.ventilationParams
          ? {
              ...patient.ventilationParams,
              fiO2: Math.round(deterministicValue(patient.id, 60, 90)), // 60-90%
              peep: Math.round(deterministicValue(patient.id, 8, 14)), // 8-14 cmH2O
            }
          : {
              modo: "CMV" as const,
              fiO2: 70,
              peep: 10,
              frequenciaRespiratoria: 25,
              ultimaAtualizacao: new Date().toISOString(),
            },
        vitalSigns: {
          ...patient.vitalSigns,
          pressaoArterialMedia: Math.round(deterministicValue(patient.id, 45, 55)), // 45-55 mmHg
          saturacaoO2: Math.round(deterministicValue(patient.id, 85, 92)), // 85-92%
          frequenciaCardiaca: Math.round(deterministicValue(patient.id, 150, 180)), // 150-180 bpm
          temperatura: Math.round(deterministicValue(patient.id, 38.0, 39.5) * 10) / 10, // 38.0-39.5°C
        },
      };
  }
}

