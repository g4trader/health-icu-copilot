export type RiskLevel = "alto" | "moderado" | "baixo";

export interface Patient {
  id: string;
  leito: string;
  nome: string;
  idade: number;
  diagnosticoPrincipal: string;
  riscoMortality24h: number; // 0-1
  riscoMortality7d: number; // 0-1
  instabilityScore: number; // 0-1
  responseToTherapyScore: number; // 0-1 (1 = ótima resposta, 0 = péssima)
  emVasopressor: boolean;
  emVentilacaoMecanica: boolean;
  lactato: number;
  sofa: number;
  ultimaAtualizacao: string;
  tags: string[];
}

export const mockPatients: Patient[] = [
  {
    id: "p1",
    leito: "UTI 01",
    nome: "Maria de Lourdes",
    idade: 78,
    diagnosticoPrincipal: "Choque séptico de foco pulmonar",
    riscoMortality24h: 0.78,
    riscoMortality7d: 0.86,
    instabilityScore: 0.9,
    responseToTherapyScore: 0.35,
    emVasopressor: true,
    emVentilacaoMecanica: true,
    lactato: 4.2,
    sofa: 13,
    ultimaAtualizacao: "2025-11-26T09:15:00Z",
    tags: ["sepse", "lactato em ascensão", "noradrenalina em aumento"]
  },
  {
    id: "p2",
    leito: "UTI 02",
    nome: "João Carlos",
    idade: 65,
    diagnosticoPrincipal: "SCA com intervenção recente",
    riscoMortality24h: 0.42,
    riscoMortality7d: 0.55,
    instabilityScore: 0.5,
    responseToTherapyScore: 0.7,
    emVasopressor: false,
    emVentilacaoMecanica: false,
    lactato: 1.8,
    sofa: 5,
    ultimaAtualizacao: "2025-11-26T09:10:00Z",
    tags: ["pós-angioplastia", "monitorização hemodinâmica"]
  },
  {
    id: "p3",
    leito: "UTI 03",
    nome: "Ana Paula",
    idade: 54,
    diagnosticoPrincipal: "Pneumonia grave com insuficiência respiratória",
    riscoMortality24h: 0.6,
    riscoMortality7d: 0.7,
    instabilityScore: 0.65,
    responseToTherapyScore: 0.4,
    emVasopressor: false,
    emVentilacaoMecanica: true,
    lactato: 3.1,
    sofa: 9,
    ultimaAtualizacao: "2025-11-26T09:05:00Z",
    tags: ["PaO2/FiO2 em queda", "antibiótico D2", "febril persistente"]
  },
  {
    id: "p4",
    leito: "UTI 04",
    nome: "Pedro Henrique",
    idade: 39,
    diagnosticoPrincipal: "Trauma cranioencefálico grave",
    riscoMortality24h: 0.35,
    riscoMortality7d: 0.48,
    instabilityScore: 0.4,
    responseToTherapyScore: 0.8,
    emVasopressor: false,
    emVentilacaoMecanica: true,
    lactato: 1.5,
    sofa: 6,
    ultimaAtualizacao: "2025-11-26T09:00:00Z",
    tags: ["PIC controlada", "sedação leve", "estável nas últimas 12h"]
  },
  {
    id: "p5",
    leito: "UTI 05",
    nome: "Luiz Fernando",
    idade: 83,
    diagnosticoPrincipal: "Insuficiência cardíaca descompensada",
    riscoMortality24h: 0.5,
    riscoMortality7d: 0.68,
    instabilityScore: 0.55,
    responseToTherapyScore: 0.5,
    emVasopressor: true,
    emVentilacaoMecanica: false,
    lactato: 2.6,
    sofa: 8,
    ultimaAtualizacao: "2025-11-26T08:55:00Z",
    tags: ["diurético em ajuste", "BNP elevado", "edema periférico importante"]
  }
];

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 0.7) return "alto";
  if (score >= 0.4) return "moderado";
  return "baixo";
}
