import type { VitalSigns } from "./VitalSigns";
import type { FluidBalance } from "./FluidBalance";
import type { Medication } from "./Medication";
import type { VentilationParams } from "./VentilationParams";
import type { LabResult } from "./LabResult";

/**
 * Tipo Patient - Representa um paciente pediátrico na UTI
 */
export interface Patient {
  id: string;
  leito: string;
  nome: string;
  idade: number; // em anos
  peso: number; // em kg
  diagnosticoPrincipal: string;
  diasDeUTI: number;
  riscoMortality24h: number; // 0-1
  riscoMortality7d: number; // 0-1
  ultimaAtualizacao: string; // ISO string
  tags: string[];
  
  // Relacionamentos
  vitalSigns: VitalSigns;
  fluidBalance: FluidBalance;
  medications: Medication[];
  ventilationParams?: VentilationParams;
  labResults: LabResult[];
}

