import type { MockPatientIndex } from "@/types/MockPatientIndex";

/**
 * Índice leve de todos os pacientes
 * Usado para listagens na sidebar, drawer, etc.
 * NÃO inclui dados completos - apenas metadados essenciais
 */
export const patientsIndex: MockPatientIndex[] = [
  {
    id: "P001",
    leito: "UTI 01",
    nome: "Sophia",
    idade: 3,
    peso: 14.5,
    diagnosticoPrincipal: "Bronquiolite viral aguda com insuficiência respiratória grave",
    diasDeUTI: 4,
    riscoMortality24h: 0.68,
    riscoMortality7d: 0.75,
    ultimaAtualizacao: "2025-11-26T09:15:00Z",
    tags: ["RSV positivo", "atrialia", "pressão suporte alta", "noradrenalina"],
    hasVM: true,
    hasVaso: true,
    hasAlerts: true
  },
  {
    id: "P002",
    leito: "UTI 02",
    nome: "Gabriel",
    idade: 8,
    peso: 28.0,
    diagnosticoPrincipal: "Pneumonia bacteriana grave com derrame pleural",
    diasDeUTI: 3,
    riscoMortality24h: 0.55,
    riscoMortality7d: 0.65,
    ultimaAtualizacao: "2025-11-26T09:10:00Z",
    tags: ["PaO2/FiO2 em melhora", "antibiótico D3", "derrame drenado"],
    hasVM: true,
    hasVaso: false,
    hasAlerts: false
  },
  {
    id: "P003",
    leito: "UTI 03",
    nome: "Isabella",
    idade: 5,
    peso: 18.0,
    diagnosticoPrincipal: "Sepse de origem pulmonar com choque séptico",
    diasDeUTI: 6,
    riscoMortality24h: 0.72,
    riscoMortality7d: 0.80,
    ultimaAtualizacao: "2025-11-26T09:05:00Z",
    tags: ["choque séptico", "noradrenalina", "antibiótico D5"],
    hasVM: true,
    hasVaso: true,
    hasAlerts: true
  },
  {
    id: "P004",
    leito: "UTI 04",
    nome: "Lucas",
    idade: 2,
    peso: 12.0,
    diagnosticoPrincipal: "Convulsão febril prolongada com encefalopatia",
    diasDeUTI: 2,
    riscoMortality24h: 0.35,
    riscoMortality7d: 0.45,
    ultimaAtualizacao: "2025-11-26T09:00:00Z",
    tags: ["encefalopatia", "anticonvulsivante"],
    hasVM: false,
    hasVaso: false,
    hasAlerts: false
  },
  {
    id: "P005",
    leito: "UTI 05",
    nome: "Maria",
    idade: 7,
    peso: 22.0,
    diagnosticoPrincipal: "Insuficiência cardíaca aguda descompensada",
    diasDeUTI: 5,
    riscoMortality24h: 0.60,
    riscoMortality7d: 0.70,
    ultimaAtualizacao: "2025-11-26T08:55:00Z",
    tags: ["cardiopatia", "dobutamina", "diurético"],
    hasVM: false,
    hasVaso: true,
    hasAlerts: true
  },
  {
    id: "P006",
    leito: "UTI 06",
    nome: "Pedro",
    idade: 4,
    peso: 16.0,
    diagnosticoPrincipal: "Asma grave com status asmaticus",
    diasDeUTI: 3,
    riscoMortality24h: 0.40,
    riscoMortality7d: 0.50,
    ultimaAtualizacao: "2025-11-26T08:50:00Z",
    tags: ["status asmaticus", "corticosteróide", "broncodilatador"],
    hasVM: true,
    hasVaso: false,
    hasAlerts: false
  },
  {
    id: "P007",
    leito: "UTI 07",
    nome: "Ana",
    idade: 6,
    peso: 20.0,
    diagnosticoPrincipal: "Trauma cranioencefálico moderado",
    diasDeUTI: 7,
    riscoMortality24h: 0.50,
    riscoMortality7d: 0.60,
    ultimaAtualizacao: "2025-11-26T08:45:00Z",
    tags: ["TCE", "monitorização PIC", "sedação"],
    hasVM: false,
    hasVaso: false,
    hasAlerts: false
  },
  {
    id: "P008",
    leito: "UTI 08",
    nome: "João",
    idade: 1,
    peso: 8.5,
    diagnosticoPrincipal: "Bronquiolite viral com insuficiência respiratória",
    diasDeUTI: 2,
    riscoMortality24h: 0.45,
    riscoMortality7d: 0.55,
    ultimaAtualizacao: "2025-11-26T08:40:00Z",
    tags: ["RSV positivo", "CPAP"],
    hasVM: false,
    hasVaso: false,
    hasAlerts: false
  },
  {
    id: "P009",
    leito: "UTI 09",
    nome: "Julia",
    idade: 9,
    peso: 30.0,
    diagnosticoPrincipal: "Meningite bacteriana com choque",
    diasDeUTI: 4,
    riscoMortality24h: 0.65,
    riscoMortality7d: 0.75,
    ultimaAtualizacao: "2025-11-26T08:35:00Z",
    tags: ["meningite", "choque", "antibiótico D4"],
    hasVM: false,
    hasVaso: true,
    hasAlerts: true
  },
  {
    id: "P010",
    leito: "UTI 10",
    nome: "Rafael",
    idade: 11,
    peso: 35.0,
    diagnosticoPrincipal: "Pneumonia com SDRA grave",
    diasDeUTI: 5,
    riscoMortality24h: 0.58,
    riscoMortality7d: 0.68,
    ultimaAtualizacao: "2025-11-26T08:30:00Z",
    tags: ["SDRA", "VM", "FiO2 alta"],
    hasVM: true,
    hasVaso: false,
    hasAlerts: true
  }
];

/**
 * Helper para buscar paciente por ID
 */
export function getPatientIndexById(id: string): MockPatientIndex | undefined {
  return patientsIndex.find(p => p.id === id);
}

/**
 * Helper para buscar paciente por leito
 */
export function getPatientIndexByLeito(leito: string): MockPatientIndex | undefined {
  return patientsIndex.find(p => p.leito === leito);
}

