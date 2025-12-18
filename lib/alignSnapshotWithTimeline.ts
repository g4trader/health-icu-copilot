/**
 * Alinha o snapshot do paciente com o último status da timeline
 * Garante consistência entre snapshot atual e evolução de 30 dias
 */

import type { Patient } from "@/types/Patient";
import type { DailyPatientStatus } from "@/types/DailyPatientStatus";
import { getLatestDailyStatus } from "./patientTimeline";

/**
 * Alinha o snapshot do paciente com o último status da timeline
 * Se a timeline termina em "alta_uti", ajusta o snapshot para baixo risco
 */
export function alignSnapshotWithLatestStatus(patient: Patient): Patient {
  const latestStatus = getLatestDailyStatus(patient.id);
  
  if (!latestStatus) {
    return patient;
  }

  // Se o último status é "alta_uti", ajustar snapshot para baixo risco
  if (latestStatus.statusGlobal === "alta_uti") {
    const alignedPatient: Patient = {
      ...patient,
      riscoMortality24h: Math.max(0.02, Math.min(0.10, latestStatus.riskScore)),
      riscoMortality7d: Math.max(0.02, Math.min(0.15, latestStatus.riskScore * 1.2)),
      medications: patient.medications.map((m) =>
        m.tipo === "vasopressor" ? { ...m, ativo: false } : m
      ),
      ventilationParams: undefined, // Remover VM se estiver em alta
      vitalSigns: {
        ...patient.vitalSigns,
        pressaoArterialMedia: Math.max(65, patient.vitalSigns.pressaoArterialMedia),
        saturacaoO2: Math.max(94, patient.vitalSigns.saturacaoO2),
        frequenciaCardiaca: Math.min(150, Math.max(60, patient.vitalSigns.frequenciaCardiaca)),
        temperatura: Math.min(38.5, Math.max(36.0, patient.vitalSigns.temperatura)),
      },
    };
    return alignedPatient;
  }

  // Se o último status é "melhora" ou "estavel" com baixo risco, ajustar se necessário
  if (latestStatus.statusGlobal === "melhora" || latestStatus.statusGlobal === "estavel") {
    if (latestStatus.riskScore < 0.3 && patient.riscoMortality24h > 0.5) {
      // Timeline mostra melhora mas snapshot está alto - ajustar
      const alignedPatient: Patient = {
        ...patient,
        riscoMortality24h: Math.max(0.15, Math.min(0.35, latestStatus.riskScore)),
        riscoMortality7d: Math.max(0.20, Math.min(0.45, latestStatus.riskScore * 1.3)),
      };
      return alignedPatient;
    }
  }

  return patient;
}

