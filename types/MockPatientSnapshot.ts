import type { VitalSigns } from "./VitalSigns";
import type { FluidBalance } from "./FluidBalance";
import type { Medication } from "./Medication";
import type { VentilationParams } from "./VentilationParams";
import type { LabResult } from "./LabResult";

/**
 * Snapshot completo do paciente no momento atual
 * Usado para status_paciente e outros dashboards que precisam de dados atuais
 */
export interface MockPatientSnapshot {
  id: string;
  leito: string;
  nome: string;
  idade: number;
  peso: number;
  diagnosticoPrincipal: string;
  diasDeUTI: number;
  riscoMortality24h: number;
  riscoMortality7d: number;
  ultimaAtualizacao: string;
  tags: string[];
  
  vitalSigns: VitalSigns;
  fluidBalance: FluidBalance;
  medications: Medication[];
  ventilationParams?: VentilationParams;
  labResults: LabResult[]; // Apenas os mais recentes (últimas 24-48h)
}

