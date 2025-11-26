export type RiskLevel = "alto" | "moderado" | "baixo";
export type TendenciaLactato = "subindo" | "estavel" | "caindo";

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
  mapaPressaoMedia: number; // mmHg
  tendenciaLactato: TendenciaLactato;
  diasDeUTI: number;
  emAntibiotico: boolean;
  diasEmAntibioticoAtual: number;
  temperatura: number; // ºC
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
    tags: ["sepse", "lactato em ascensão", "noradrenalina em aumento"],
    mapaPressaoMedia: 58,
    tendenciaLactato: "subindo",
    diasDeUTI: 3,
    emAntibiotico: true,
    diasEmAntibioticoAtual: 3,
    temperatura: 38.8
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
    tags: ["pós-angioplastia", "monitorização hemodinâmica"],
    mapaPressaoMedia: 72,
    tendenciaLactato: "caindo",
    diasDeUTI: 1,
    emAntibiotico: false,
    diasEmAntibioticoAtual: 0,
    temperatura: 36.8
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
    tags: ["PaO2/FiO2 em queda", "antibiótico D2", "febril persistente"],
    mapaPressaoMedia: 68,
    tendenciaLactato: "subindo",
    diasDeUTI: 5,
    emAntibiotico: true,
    diasEmAntibioticoAtual: 2,
    temperatura: 38.5
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
    tags: ["PIC controlada", "sedação leve", "estável nas últimas 12h"],
    mapaPressaoMedia: 75,
    tendenciaLactato: "estavel",
    diasDeUTI: 8,
    emAntibiotico: true,
    diasEmAntibioticoAtual: 5,
    temperatura: 37.2
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
    tags: ["diurético em ajuste", "BNP elevado", "edema periférico importante"],
    mapaPressaoMedia: 62,
    tendenciaLactato: "estavel",
    diasDeUTI: 4,
    emAntibiotico: false,
    diasEmAntibioticoAtual: 0,
    temperatura: 37.0
  }
];

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 0.7) return "alto";
  if (score >= 0.4) return "moderado";
  return "baixo";
}

/**
 * Retorna pacientes ordenados descendentemente por risco de mortalidade em 24h.
 */
export function getSortedByMortalityRisk24h(): Patient[] {
  return [...mockPatients].sort(
    (a, b) => b.riscoMortality24h - a.riscoMortality24h
  );
}

/**
 * Retorna os pacientes mais instáveis, combinando alta instabilidade,
 * uso de vasopressor e tendência de lactato "subindo".
 */
export function getTopUnstablePatients(limit: number): Patient[] {
  return [...mockPatients]
    .map((p) => {
      let score = p.instabilityScore;
      if (p.emVasopressor) score += 0.2;
      if (p.tendenciaLactato === "subindo") score += 0.15;
      return { patient: p, combinedScore: score };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit)
    .map((item) => item.patient);
}

/**
 * Retorna pacientes que podem não estar respondendo bem à terapia:
 * - em antibiótico há pelo menos 2 dias
 * - com tendência de lactato "subindo" OU febre (temperatura >= 38ºC)
 */
export function getPossibleNonRespondersToTherapy(): Patient[] {
  return mockPatients.filter(
    (p) =>
      p.emAntibiotico &&
      p.diasEmAntibioticoAtual >= 2 &&
      (p.tendenciaLactato === "subindo" || p.temperatura >= 38)
  );
}
