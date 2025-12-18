/**
 * Aplica categoria de risco alvo ao snapshot do paciente
 * Garante distribuição controlada: 2 baixos, 5 médios, 3 altos
 */

import type { Patient } from "@/types/Patient";

export type TargetRiskCategory = "low" | "moderate" | "high";

/**
 * Aplica categoria de risco alvo ao snapshot do paciente
 */
export function applyTargetRisk(
  patient: Patient,
  category: TargetRiskCategory
): Patient {
  switch (category) {
    case "low":
      // Baixo risco: próximo de alta
      return {
        ...patient,
        riscoMortality24h: 0.05 + Math.random() * 0.10, // 0.05-0.15
        riscoMortality7d: 0.08 + Math.random() * 0.10, // 0.08-0.18
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
        riscoMortality24h: 0.35 + Math.random() * 0.20, // 0.35-0.55 (média ~0.45)
        riscoMortality7d: 0.45 + Math.random() * 0.20, // 0.45-0.65
        medications: patient.medications.map((m) =>
          m.tipo === "vasopressor"
            ? { ...m, ativo: hasVaso, dose: hasVaso ? (0.2 + Math.random() * 0.4) : m.dose } // 0.2-0.6 mcg/kg/min
            : m
        ),
        ventilationParams: hasVM
          ? {
              ...patient.ventilationParams!,
              fiO2: 30 + Math.random() * 30, // 30-60%
              peep: 5 + Math.random() * 5, // 5-10 cmH2O
            }
          : undefined,
        vitalSigns: {
          ...patient.vitalSigns,
          pressaoArterialMedia: 55 + Math.random() * 10, // 55-65 mmHg (borderline)
          saturacaoO2: 90 + Math.random() * 5, // 90-95%
          frequenciaCardiaca: 120 + Math.random() * 30, // 120-150 bpm
          temperatura: 37.0 + Math.random() * 1.5, // 37.0-38.5°C
        },
      };

    case "high":
      // Alto risco: claramente crítico
      return {
        ...patient,
        riscoMortality24h: 0.72 + Math.random() * 0.15, // 0.72-0.87 (média ~0.80)
        riscoMortality7d: 0.78 + Math.random() * 0.15, // 0.78-0.93
        medications: patient.medications.map((m) =>
          m.tipo === "vasopressor"
            ? { ...m, ativo: true, dose: 0.5 + Math.random() * 0.8 } // 0.5-1.3 mcg/kg/min
            : m
        ),
        ventilationParams: patient.ventilationParams
          ? {
              ...patient.ventilationParams,
              fiO2: 60 + Math.random() * 30, // 60-90%
              peep: 8 + Math.random() * 6, // 8-14 cmH2O
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
          pressaoArterialMedia: 45 + Math.random() * 10, // 45-55 mmHg (baixa)
          saturacaoO2: 85 + Math.random() * 7, // 85-92%
          frequenciaCardiaca: 150 + Math.random() * 30, // 150-180 bpm
          temperatura: 38.0 + Math.random() * 1.5, // 38.0-39.5°C
        },
      };
  }
}

