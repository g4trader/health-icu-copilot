/**
 * Índice leve de pacientes - usado para listagens e seleção
 * NÃO inclui dados completos, apenas metadados essenciais
 */
export interface MockPatientIndex {
  id: string; // P001, P002, etc.
  leito: string; // UTI 01, UTI 02, etc.
  nome: string;
  idade: number; // anos
  peso: number; // kg
  diagnosticoPrincipal: string;
  diasDeUTI: number;
  riscoMortality24h: number; // 0-1
  riscoMortality7d: number; // 0-1
  ultimaAtualizacao: string; // ISO string
  tags: string[];
  
  // Flags rápidas (sem carregar dados completos)
  hasVM: boolean;
  hasVaso: boolean;
  hasAlerts: boolean;
}

