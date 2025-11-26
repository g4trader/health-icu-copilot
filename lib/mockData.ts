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
    nome: "Sophia",
    idade: 3,
    diagnosticoPrincipal: "Bronquiolite viral aguda com insuficiência respiratória grave",
    riscoMortality24h: 0.68,
    riscoMortality7d: 0.75,
    instabilityScore: 0.85,
    responseToTherapyScore: 0.4,
    emVasopressor: true,
    emVentilacaoMecanica: true,
    lactato: 3.8,
    sofa: 10,
    ultimaAtualizacao: "2025-11-26T09:15:00Z",
    tags: ["RSV positivo", "atrialia", "pressão suporte alta", "noradrenalina"],
    mapaPressaoMedia: 52,
    tendenciaLactato: "subindo",
    diasDeUTI: 4,
    emAntibiotico: false,
    diasEmAntibioticoAtual: 0,
    temperatura: 39.2
  },
  {
    id: "p2",
    leito: "UTI 02",
    nome: "Gabriel",
    idade: 8,
    diagnosticoPrincipal: "Pneumonia bacteriana grave com derrame pleural",
    riscoMortality24h: 0.55,
    riscoMortality7d: 0.65,
    instabilityScore: 0.6,
    responseToTherapyScore: 0.5,
    emVasopressor: false,
    emVentilacaoMecanica: true,
    lactato: 2.5,
    sofa: 8,
    ultimaAtualizacao: "2025-11-26T09:10:00Z",
    tags: ["PaO2/FiO2 em melhora", "antibiótico D3", "derrame drenado"],
    mapaPressaoMedia: 65,
    tendenciaLactato: "caindo",
    diasDeUTI: 3,
    emAntibiotico: true,
    diasEmAntibioticoAtual: 3,
    temperatura: 37.8
  },
  {
    id: "p3",
    leito: "UTI 03",
    nome: "Isabella",
    idade: 6,
    diagnosticoPrincipal: "Sepse de foco abdominal pós-cirurgia de apendicite complicada",
    riscoMortality24h: 0.72,
    riscoMortality7d: 0.82,
    instabilityScore: 0.9,
    responseToTherapyScore: 0.35,
    emVasopressor: true,
    emVentilacaoMecanica: false,
    lactato: 4.5,
    sofa: 11,
    ultimaAtualizacao: "2025-11-26T09:05:00Z",
    tags: ["abdome tenso", "leucocitose", "noradrenalina", "antimicrobiano de amplo espectro"],
    mapaPressaoMedia: 50,
    tendenciaLactato: "subindo",
    diasDeUTI: 2,
    emAntibiotico: true,
    diasEmAntibioticoAtual: 2,
    temperatura: 38.9
  },
  {
    id: "p4",
    leito: "UTI 04",
    nome: "Lucas",
    idade: 12,
    diagnosticoPrincipal: "Trauma cranioencefálico grave pós-acidente",
    riscoMortality24h: 0.45,
    riscoMortality7d: 0.58,
    instabilityScore: 0.5,
    responseToTherapyScore: 0.7,
    emVasopressor: false,
    emVentilacaoMecanica: true,
    lactato: 1.8,
    sofa: 7,
    ultimaAtualizacao: "2025-11-26T09:00:00Z",
    tags: ["PIC estável", "sedação profunda", "GCS 7", "sem sinais de hipertensão intracraniana"],
    mapaPressaoMedia: 70,
    tendenciaLactato: "estavel",
    diasDeUTI: 6,
    emAntibiotico: true,
    diasEmAntibioticoAtual: 4,
    temperatura: 37.1
  },
  {
    id: "p5",
    leito: "UTI 05",
    nome: "Maria Eduarda",
    idade: 2,
    diagnosticoPrincipal: "Cardiopatia congênita descompensada (CIV + CIA)",
    riscoMortality24h: 0.58,
    riscoMortality7d: 0.68,
    instabilityScore: 0.65,
    responseToTherapyScore: 0.45,
    emVasopressor: true,
    emVentilacaoMecanica: true,
    lactato: 3.2,
    sofa: 9,
    ultimaAtualizacao: "2025-11-26T08:55:00Z",
    tags: ["edema pulmonar", "dopamina", "diurético ajustado", "função cardíaca deprimida"],
    mapaPressaoMedia: 55,
    tendenciaLactato: "estavel",
    diasDeUTI: 5,
    emAntibiotico: false,
    diasEmAntibioticoAtual: 0,
    temperatura: 37.3
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
