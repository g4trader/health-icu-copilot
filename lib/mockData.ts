import type { Patient, VitalSigns, FluidBalance, Medication, VentilationParams, LabResult, UnitProfile } from "@/types";

export type RiskLevel = "alto" | "moderado" | "baixo";

/**
 * Calcula o score de risco de um paciente baseado em múltiplos fatores
 */
export function calculateRiskScore(patient: Patient): number {
  let score = 0;

  // Instabilidade de sinais vitais
  if (patient.vitalSigns.pressaoArterialMedia < 65) score += 0.25;
  if (patient.vitalSigns.frequenciaCardiaca > 150 || patient.vitalSigns.frequenciaCardiaca < 60) score += 0.15;
  if (patient.vitalSigns.temperatura > 38.5 || patient.vitalSigns.temperatura < 36) score += 0.1;
  if (patient.vitalSigns.saturacaoO2 < 92) score += 0.2;

  // Uso de droga vasoativa
  const temVasopressor = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  if (temVasopressor) score += 0.25;

  // Ventilação mecânica
  if (patient.ventilationParams) score += 0.15;

  // Lactato elevado
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  if (lactato && typeof lactato.valor === "number" && lactato.valor >= 3) score += 0.2;
  if (lactato && lactato.tendencia === "subindo") score += 0.15;

  // Tendência negativa (balanço hídrico positivo excessivo, piora de exames)
  if (patient.fluidBalance.balanco24h > 5) score += 0.1; // ml/kg/h positivo excessivo
  if (patient.fluidBalance.diurese < 1) score += 0.15; // oligúria

  return Math.min(score, 1.0); // Limita a 1.0
}

/**
 * Retorna os top N pacientes por score de risco
 */
export function getTopPatients(n: number): PatientCompat[] {
  return [...mockPatientsCompat]
    .map(p => ({ patient: p, riskScore: calculateRiskScore(p) }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, n)
    .map(item => item.patient);
}

/**
 * Retorna pacientes ordenados descendentemente por risco de mortalidade em 24h.
 */
export function getSortedByMortalityRisk24h(): PatientCompat[] {
  return [...mockPatientsCompat].sort(
    (a, b) => b.riscoMortality24h - a.riscoMortality24h
  );
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 0.7) return "alto";
  if (score >= 0.4) return "moderado";
  return "baixo";
}

// Mock de pacientes pediátricos (versão original com novos tipos)
// 
// PERFIS CLÍNICOS (trajetórias esperadas):
// p1 (Sophia): Bronquiolite grave, VM + vaso
//   D0-D2: Piora progressiva respiratória, aumento FiO2/PEEP, lactato/PCR em subida, noradrenalina crescente
//   D3-D6: Estabilização hemodinâmica, lenta melhora SpO2/PaO2/FiO2, lactato em queda
//   D7-D10: Desmame ventilatório progressivo, retirada vasopressor, labs normalizando
//   Alta UTI: D10-D12
//
// p2 (Gabriel): Pneumonia + derrame drenado
//   Estadia curta (3-5 dias), rápida resposta a antibiótico e drenagem
//   PCR cai acentuadamente, radiografia melhora, sem vasopressor prolongado
//
// p3 (Isabella): Sepse abdominal pós-op complicada
//   D0-D3: Choque séptico, lactato alto, PAM baixa, vasopressor moderado/alto
//   D4-D7: Resposta parcial, flutuações PAM/lactato (plateau)
//   D8-D12: Franca melhora, redução vaso, função renal voltando
//   Possível complicação pontual (nova febre, ajuste antibiótico)
//
const mockPatientsRaw: Patient[] = [
  {
    id: "p1",
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
    vitalSigns: {
      temperatura: 39.2,
      frequenciaCardiaca: 165,
      frequenciaRespiratoria: 45,
      pressaoArterialSistolica: 95,
      pressaoArterialDiastolica: 45,
      pressaoArterialMedia: 52,
      saturacaoO2: 88,
      escalaGlasgow: 12
    },
    fluidBalance: {
      entrada24h: 4.2,
      saida24h: 2.1,
      balanco24h: 2.1,
      entradaTotal: 3045,
      saidaTotal: 1522,
      balancoTotal: 1523,
      diurese: 1.2,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m1",
        nome: "Noradrenalina",
        tipo: "vasopressor",
        dose: 0.5,
        unidade: "mcg/kg/min",
        via: "EV",
        frequencia: "contínuo",
        diasDeUso: 2,
        inicio: "2025-11-24T10:00:00Z",
        ativo: true
      },
      {
        id: "m2",
        nome: "Midazolam",
        tipo: "sedativo",
        dose: 0.1,
        unidade: "mg/kg/h",
        via: "EV",
        frequencia: "contínuo",
        diasDeUso: 4,
        inicio: "2025-11-22T08:00:00Z",
        ativo: true
      }
    ],
    ventilationParams: {
      modo: "PSV",
      fiO2: 70,
      peep: 8,
      pressaoSuporte: 18,
      volumeCorrente: 6.5,
      frequenciaRespiratoria: 35,
      relacaoIE: "1:2",
      paO2FiO2: 180,
      ultimaAtualizacao: "2025-11-26T09:10:00Z"
    },
    labResults: [
      // Lactato: série evolutiva (D0: subindo, D1-D2: pico, D3-D4: caindo)
      {
        id: "p1-lactato-1",
        tipo: "lactato",
        nome: "Lactato",
        valor: 2.8,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-22T08:00:00Z", // D1
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p1-lactato-2",
        tipo: "lactato",
        nome: "Lactato",
        valor: 3.5,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-23T08:00:00Z", // D2
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p1-lactato-3",
        tipo: "lactato",
        nome: "Lactato",
        valor: 4.2,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-24T08:00:00Z", // D3 (pico)
        tendencia: "estavel",
        critico: true
      },
      {
        id: "p1-lactato-4",
        tipo: "lactato",
        nome: "Lactato",
        valor: 3.8,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-25T08:00:00Z", // D4
        tendencia: "caindo",
        critico: true
      },
      {
        id: "p1-lactato-5",
        tipo: "lactato",
        nome: "Lactato",
        valor: 3.2,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:30:00Z", // D5 (atual)
        tendencia: "caindo",
        critico: true
      },
      // PCR: série evolutiva
      {
        id: "p1-pcr-1",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 180,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-23T08:00:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p1-pcr-2",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 220,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-24T08:00:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p1-pcr-3",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 195,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-25T08:00:00Z",
        tendencia: "caindo",
        critico: true
      },
      {
        id: "p1-pcr-4",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 165,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "caindo",
        critico: true
      },
      // Hemograma
      {
        id: "p1-hemograma-1",
        tipo: "hemograma",
        nome: "Hemograma completo",
        valor: "Leucocitose com desvio",
        unidade: "células/mm³",
        referencia: "5.000-15.000",
        data: "2025-11-24T08:00:00Z",
        critico: true
      },
      {
        id: "p1-hemograma-2",
        tipo: "hemograma",
        nome: "Hemograma completo",
        valor: "Leucocitose",
        unidade: "células/mm³",
        referencia: "5.000-15.000",
        data: "2025-11-26T08:00:00Z",
        critico: true
      }
    ]
  },
  {
    id: "p2",
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
    vitalSigns: {
      temperatura: 37.8,
      frequenciaCardiaca: 125,
      frequenciaRespiratoria: 32,
      pressaoArterialSistolica: 110,
      pressaoArterialDiastolica: 65,
      pressaoArterialMedia: 65,
      saturacaoO2: 94,
      escalaGlasgow: 15
    },
    fluidBalance: {
      entrada24h: 3.5,
      saida24h: 3.2,
      balanco24h: 0.3,
      entradaTotal: 4704,
      saidaTotal: 4300,
      balancoTotal: 404,
      diurese: 2.1,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m3",
        nome: "Ceftriaxona",
        tipo: "antibiotico",
        dose: 100,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "12/12h",
        diasDeUso: 3,
        inicio: "2025-11-23T10:00:00Z",
        ativo: true
      },
      {
        id: "m4",
        nome: "Clindamicina",
        tipo: "antibiotico",
        dose: 40,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "8/8h",
        diasDeUso: 3,
        inicio: "2025-11-23T10:00:00Z",
        ativo: true
      }
    ],
    ventilationParams: {
      modo: "SIMV",
      fiO2: 50,
      peep: 6,
      pressaoSuporte: 12,
      volumeCorrente: 8.0,
      frequenciaRespiratoria: 20,
      relacaoIE: "1:2",
      paO2FiO2: 240,
      ultimaAtualizacao: "2025-11-26T09:05:00Z"
    },
    labResults: [
      // Lactato: série com rápida melhora (resposta a antibiótico)
      {
        id: "p2-lactato-1",
        tipo: "lactato",
        nome: "Lactato",
        valor: 2.8,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-23T08:00:00Z", // D1
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p2-lactato-2",
        tipo: "lactato",
        nome: "Lactato",
        valor: 2.9,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-24T08:00:00Z", // D2
        tendencia: "estavel",
        critico: true
      },
      {
        id: "p2-lactato-3",
        tipo: "lactato",
        nome: "Lactato",
        valor: 2.5,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-25T08:00:00Z", // D3
        tendencia: "caindo",
        critico: true
      },
      {
        id: "p2-lactato-4",
        tipo: "lactato",
        nome: "Lactato",
        valor: 1.8,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z", // D4 (atual)
        tendencia: "caindo",
        critico: false
      },
      // PCR: queda acentuada (resposta rápida)
      {
        id: "p2-pcr-1",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 280,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-23T08:00:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p2-pcr-2",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 240,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-24T08:00:00Z",
        tendencia: "caindo",
        critico: true
      },
      {
        id: "p2-pcr-3",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 180,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-25T08:00:00Z",
        tendencia: "caindo",
        critico: true
      },
      {
        id: "p2-pcr-4",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 120,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "caindo",
        critico: true
      }
    ]
  },
  {
    id: "p3",
    leito: "UTI 03",
    nome: "Isabella",
    idade: 6,
    peso: 22.0,
    diagnosticoPrincipal: "Sepse de foco abdominal pós-cirurgia de apendicite complicada",
    diasDeUTI: 2,
    riscoMortality24h: 0.72,
    riscoMortality7d: 0.82,
    ultimaAtualizacao: "2025-11-26T09:05:00Z",
    tags: ["abdome tenso", "leucocitose", "noradrenalina", "antimicrobiano de amplo espectro"],
    vitalSigns: {
      temperatura: 38.9,
      frequenciaCardiaca: 155,
      frequenciaRespiratoria: 38,
      pressaoArterialSistolica: 88,
      pressaoArterialDiastolica: 42,
      pressaoArterialMedia: 50,
      saturacaoO2: 92,
      escalaGlasgow: 13
    },
    fluidBalance: {
      entrada24h: 5.5,
      saida24h: 1.8,
      balanco24h: 3.7,
      entradaTotal: 6050,
      saidaTotal: 1980,
      balancoTotal: 4070,
      diurese: 0.8,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m5",
        nome: "Noradrenalina",
        tipo: "vasopressor",
        dose: 0.8,
        unidade: "mcg/kg/min",
        via: "EV",
        frequencia: "contínuo",
        diasDeUso: 1,
        inicio: "2025-11-25T14:00:00Z",
        ativo: true
      },
      {
        id: "m6",
        nome: "Piperacilina-Tazobactam",
        tipo: "antibiotico",
        dose: 300,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "8/8h",
        diasDeUso: 2,
        inicio: "2025-11-24T10:00:00Z",
        ativo: true
      },
      {
        id: "m7",
        nome: "Metronidazol",
        tipo: "antibiotico",
        dose: 30,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "8/8h",
        diasDeUso: 2,
        inicio: "2025-11-24T10:00:00Z",
        ativo: true
      }
    ],
    labResults: [
      // Lactato: pico inicial, depois plateau e queda
      {
        id: "p3-lactato-1",
        tipo: "lactato",
        nome: "Lactato",
        valor: 3.8,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-24T08:00:00Z", // D1
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p3-lactato-2",
        tipo: "lactato",
        nome: "Lactato",
        valor: 4.5,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-25T08:00:00Z", // D2 (pico)
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p3-lactato-3",
        tipo: "lactato",
        nome: "Lactato",
        valor: 4.4,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-25T20:00:00Z", // D2 tarde (plateau)
        tendencia: "estavel",
        critico: true
      },
      {
        id: "p3-lactato-4",
        tipo: "lactato",
        nome: "Lactato",
        valor: 3.5,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z", // D3 (começa a cair)
        tendencia: "caindo",
        critico: true
      },
      // PCR: evolução típica de sepse
      {
        id: "p3-pcr-1",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 250,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-24T08:00:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p3-pcr-2",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 280,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-25T08:00:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p3-pcr-3",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 220,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "caindo",
        critico: true
      },
      // Função renal: pico e depois melhora
      {
        id: "p3-creatinina-1",
        tipo: "funcao_renal",
        nome: "Creatinina",
        valor: 1.2,
        unidade: "mg/dL",
        referencia: "0.3-1.0",
        data: "2025-11-24T08:00:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p3-creatinina-2",
        tipo: "funcao_renal",
        nome: "Creatinina",
        valor: 1.5,
        unidade: "mg/dL",
        referencia: "0.3-1.0",
        data: "2025-11-25T08:00:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p3-creatinina-3",
        tipo: "funcao_renal",
        nome: "Creatinina",
        valor: 1.3,
        unidade: "mg/dL",
        referencia: "0.3-1.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "caindo",
        critico: true
      },
      // Hemograma
      {
        id: "p3-hemograma-1",
        tipo: "hemograma",
        nome: "Hemograma completo",
        valor: "Leucocitose com desvio",
        unidade: "células/mm³",
        referencia: "5.000-15.000",
        data: "2025-11-25T08:00:00Z",
        critico: true
      },
      {
        id: "p3-hemograma-2",
        tipo: "hemograma",
        nome: "Hemograma completo",
        valor: "Leucocitose",
        unidade: "células/mm³",
        referencia: "5.000-15.000",
        data: "2025-11-26T08:00:00Z",
        critico: true
      }
    ]
  },
  {
    id: "p4",
    leito: "UTI 04",
    nome: "Lucas",
    idade: 12,
    peso: 42.0,
    diagnosticoPrincipal: "Trauma cranioencefálico grave pós-acidente",
    diasDeUTI: 6,
    riscoMortality24h: 0.45,
    riscoMortality7d: 0.58,
    ultimaAtualizacao: "2025-11-26T09:00:00Z",
    tags: ["PIC estável", "sedação profunda", "GCS 7", "sem sinais de hipertensão intracraniana"],
    vitalSigns: {
      temperatura: 37.1,
      frequenciaCardiaca: 95,
      frequenciaRespiratoria: 18,
      pressaoArterialSistolica: 125,
      pressaoArterialDiastolica: 75,
      pressaoArterialMedia: 70,
      saturacaoO2: 98,
      escalaGlasgow: 7,
      pressaoIntracraniana: 12
    },
    fluidBalance: {
      entrada24h: 2.8,
      saida24h: 2.5,
      balanco24h: 0.3,
      entradaTotal: 5880,
      saidaTotal: 5250,
      balancoTotal: 630,
      diurese: 2.0,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m8",
        nome: "Fentanil",
        tipo: "sedativo",
        dose: 2,
        unidade: "mcg/kg/h",
        via: "EV",
        frequencia: "contínuo",
        diasDeUso: 6,
        inicio: "2025-11-20T10:00:00Z",
        ativo: true
      },
      {
        id: "m9",
        nome: "Midazolam",
        tipo: "sedativo",
        dose: 0.15,
        unidade: "mg/kg/h",
        via: "EV",
        frequencia: "contínuo",
        diasDeUso: 6,
        inicio: "2025-11-20T10:00:00Z",
        ativo: true
      },
      {
        id: "m10",
        nome: "Cefalexina",
        tipo: "antibiotico",
        dose: 100,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "6/6h",
        diasDeUso: 4,
        inicio: "2025-11-22T08:00:00Z",
        ativo: true
      }
    ],
    ventilationParams: {
      modo: "CMV",
      fiO2: 35,
      peep: 5,
      volumeCorrente: 7.5,
      frequenciaRespiratoria: 16,
      relacaoIE: "1:2",
      paO2FiO2: 320,
      ultimaAtualizacao: "2025-11-26T08:50:00Z"
    },
    labResults: [
      {
        id: "l7",
        tipo: "lactato",
        nome: "Lactato",
        valor: 1.8,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "estavel",
        critico: false
      }
    ]
  },
  {
    id: "p5",
    leito: "UTI 05",
    nome: "Maria Eduarda",
    idade: 2,
    peso: 11.5,
    diagnosticoPrincipal: "Cardiopatia congênita descompensada (CIV + CIA)",
    diasDeUTI: 5,
    riscoMortality24h: 0.58,
    riscoMortality7d: 0.68,
    ultimaAtualizacao: "2025-11-26T08:55:00Z",
    tags: ["edema pulmonar", "dopamina", "diurético ajustado", "função cardíaca deprimida"],
    vitalSigns: {
      temperatura: 37.3,
      frequenciaCardiaca: 145,
      frequenciaRespiratoria: 40,
      pressaoArterialSistolica: 92,
      pressaoArterialDiastolica: 48,
      pressaoArterialMedia: 55,
      saturacaoO2: 90,
      escalaGlasgow: 14
    },
    fluidBalance: {
      entrada24h: 4.8,
      saida24h: 3.2,
      balanco24h: 1.6,
      entradaTotal: 2760,
      saidaTotal: 1840,
      balancoTotal: 920,
      diurese: 2.2,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m11",
        nome: "Dopamina",
        tipo: "vasopressor",
        dose: 8,
        unidade: "mcg/kg/min",
        via: "EV",
        frequencia: "contínuo",
        diasDeUso: 3,
        inicio: "2025-11-23T12:00:00Z",
        ativo: true
      },
      {
        id: "m12",
        nome: "Furosemida",
        tipo: "diuretico",
        dose: 2,
        unidade: "mg/kg/dose",
        via: "EV",
        frequencia: "12/12h",
        diasDeUso: 5,
        inicio: "2025-11-21T08:00:00Z",
        ativo: true
      }
    ],
    ventilationParams: {
      modo: "PSV",
      fiO2: 60,
      peep: 7,
      pressaoSuporte: 15,
      volumeCorrente: 6.0,
      frequenciaRespiratoria: 30,
      relacaoIE: "1:2",
      paO2FiO2: 200,
      ultimaAtualizacao: "2025-11-26T08:50:00Z"
    },
    labResults: [
      {
        id: "l8",
        tipo: "lactato",
        nome: "Lactato",
        valor: 3.2,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "estavel",
        critico: true
      }
    ]
  },
  {
    id: "p6",
    leito: "UTI 06",
    nome: "João Pedro",
    idade: 5,
    peso: 18.0,
    diagnosticoPrincipal: "Bronquiolite viral moderada com necessidade de suporte ventilatório",
    diasDeUTI: 2,
    riscoMortality24h: 0.35,
    riscoMortality7d: 0.45,
    ultimaAtualizacao: "2025-11-26T08:50:00Z",
    tags: ["RSV positivo", "CPAP", "melhora progressiva"],
    vitalSigns: {
      temperatura: 38.2,
      frequenciaCardiaca: 140,
      frequenciaRespiratoria: 35,
      pressaoArterialSistolica: 105,
      pressaoArterialDiastolica: 60,
      pressaoArterialMedia: 68,
      saturacaoO2: 93,
      escalaGlasgow: 15
    },
    fluidBalance: {
      entrada24h: 3.0,
      saida24h: 2.8,
      balanco24h: 0.2,
      entradaTotal: 2700,
      saidaTotal: 2520,
      balancoTotal: 180,
      diurese: 2.0,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [],
    ventilationParams: {
      modo: "CPAP",
      fiO2: 40,
      peep: 6,
      frequenciaRespiratoria: 28,
      paO2FiO2: 280,
      ultimaAtualizacao: "2025-11-26T08:45:00Z"
    },
    labResults: [
      {
        id: "l9",
        tipo: "lactato",
        nome: "Lactato",
        valor: 1.5,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "estavel",
        critico: false
      }
    ]
  },
  {
    id: "p7",
    leito: "UTI 07",
    nome: "Ana Clara",
    idade: 4,
    peso: 16.0,
    diagnosticoPrincipal: "Sepse de foco pulmonar com choque séptico",
    diasDeUTI: 3,
    riscoMortality24h: 0.65,
    riscoMortality7d: 0.72,
    ultimaAtualizacao: "2025-11-26T08:45:00Z",
    tags: ["choque séptico", "noradrenalina", "antibiótico D3", "lactato elevado"],
    vitalSigns: {
      temperatura: 39.5,
      frequenciaCardiaca: 160,
      frequenciaRespiratoria: 42,
      pressaoArterialSistolica: 85,
      pressaoArterialDiastolica: 40,
      pressaoArterialMedia: 48,
      saturacaoO2: 89,
      escalaGlasgow: 12
    },
    fluidBalance: {
      entrada24h: 6.0,
      saida24h: 1.5,
      balanco24h: 4.5,
      entradaTotal: 4800,
      saidaTotal: 1200,
      balancoTotal: 3600,
      diurese: 0.6,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m13",
        nome: "Noradrenalina",
        tipo: "vasopressor",
        dose: 0.6,
        unidade: "mcg/kg/min",
        via: "EV",
        frequencia: "contínuo",
        diasDeUso: 2,
        inicio: "2025-11-24T10:00:00Z",
        ativo: true
      },
      {
        id: "m14",
        nome: "Vancomicina",
        tipo: "antibiotico",
        dose: 60,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "6/6h",
        diasDeUso: 3,
        inicio: "2025-11-23T08:00:00Z",
        ativo: true
      },
      {
        id: "m15",
        nome: "Meropenem",
        tipo: "antibiotico",
        dose: 120,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "8/8h",
        diasDeUso: 3,
        inicio: "2025-11-23T08:00:00Z",
        ativo: true
      }
    ],
    ventilationParams: {
      modo: "PSV",
      fiO2: 75,
      peep: 10,
      pressaoSuporte: 20,
      volumeCorrente: 7.0,
      frequenciaRespiratoria: 38,
      relacaoIE: "1:1.5",
      paO2FiO2: 150,
      ultimaAtualizacao: "2025-11-26T08:40:00Z"
    },
    labResults: [
      {
        id: "l10",
        tipo: "lactato",
        nome: "Lactato",
        valor: 4.2,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "l11",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 250,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "subindo",
        critico: true
      }
    ]
  },
  {
    id: "p8",
    leito: "UTI 08",
    nome: "Rafael",
    idade: 7,
    peso: 24.0,
    diagnosticoPrincipal: "Pneumonia comunitária grave com derrame pleural bilateral",
    diasDeUTI: 4,
    riscoMortality24h: 0.48,
    riscoMortality7d: 0.58,
    ultimaAtualizacao: "2025-11-26T08:40:00Z",
    tags: ["derrame drenado", "antibiótico D4", "melhora clínica"],
    vitalSigns: {
      temperatura: 37.5,
      frequenciaCardiaca: 115,
      frequenciaRespiratoria: 28,
      pressaoArterialSistolica: 108,
      pressaoArterialDiastolica: 62,
      pressaoArterialMedia: 67,
      saturacaoO2: 95,
      escalaGlasgow: 15
    },
    fluidBalance: {
      entrada24h: 3.2,
      saida24h: 3.0,
      balanco24h: 0.2,
      entradaTotal: 3840,
      saidaTotal: 3600,
      balancoTotal: 240,
      diurese: 2.5,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m16",
        nome: "Ampicilina-Sulbactam",
        tipo: "antibiotico",
        dose: 200,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "6/6h",
        diasDeUso: 4,
        inicio: "2025-11-22T10:00:00Z",
        ativo: true
      }
    ],
    ventilationParams: {
      modo: "SIMV",
      fiO2: 45,
      peep: 6,
      pressaoSuporte: 10,
      volumeCorrente: 7.5,
      frequenciaRespiratoria: 22,
      relacaoIE: "1:2",
      paO2FiO2: 260,
      ultimaAtualizacao: "2025-11-26T08:35:00Z"
    },
    labResults: [
      // Lactato: leve elevação inicial, rápida normalização
      {
        id: "p8-lactato-1",
        tipo: "lactato",
        nome: "Lactato",
        valor: 2.5,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-22T08:00:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p8-lactato-2",
        tipo: "lactato",
        nome: "Lactato",
        valor: 2.3,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-23T08:00:00Z",
        tendencia: "caindo",
        critico: true
      },
      {
        id: "p8-lactato-3",
        tipo: "lactato",
        nome: "Lactato",
        valor: 2.0,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-24T08:00:00Z",
        tendencia: "caindo",
        critico: false
      },
      {
        id: "p8-lactato-4",
        tipo: "lactato",
        nome: "Lactato",
        valor: 1.8,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "caindo",
        critico: false
      },
      // PCR: queda acentuada após drenagem
      {
        id: "p8-pcr-1",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 220,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-22T08:00:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "p8-pcr-2",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 180,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-23T08:00:00Z",
        tendencia: "caindo",
        critico: true
      },
      {
        id: "p8-pcr-3",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 120,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-24T08:00:00Z",
        tendencia: "caindo",
        critico: true
      },
      {
        id: "p8-pcr-4",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 85,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "caindo",
        critico: true
      }
    ]
  },
  {
    id: "p9",
    leito: "UTI 09",
    nome: "Laura",
    idade: 1,
    peso: 8.5,
    diagnosticoPrincipal: "Bronquiolite viral grave em lactente",
    diasDeUTI: 3,
    riscoMortality24h: 0.52,
    riscoMortality7d: 0.62,
    ultimaAtualizacao: "2025-11-26T08:35:00Z",
    tags: ["RSV positivo", "idade < 2 anos", "suporte ventilatório"],
    vitalSigns: {
      temperatura: 38.8,
      frequenciaCardiaca: 170,
      frequenciaRespiratoria: 48,
      pressaoArterialSistolica: 90,
      pressaoArterialDiastolica: 50,
      pressaoArterialMedia: 58,
      saturacaoO2: 91,
      escalaGlasgow: 13
    },
    fluidBalance: {
      entrada24h: 4.5,
      saida24h: 2.5,
      balanco24h: 2.0,
      entradaTotal: 1912,
      saidaTotal: 1062,
      balancoTotal: 850,
      diurese: 1.5,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [],
    ventilationParams: {
      modo: "BiPAP",
      fiO2: 55,
      peep: 7,
      pressaoSuporte: 14,
      frequenciaRespiratoria: 35,
      paO2FiO2: 220,
      ultimaAtualizacao: "2025-11-26T08:30:00Z"
    },
    labResults: [
      {
        id: "l13",
        tipo: "lactato",
        nome: "Lactato",
        valor: 2.8,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "estavel",
        critico: true
      }
    ]
  },
  {
    id: "p10",
    leito: "UTI 10",
    nome: "Enzo",
    idade: 9,
    peso: 32.0,
    diagnosticoPrincipal: "Cardiopatia congênita (Tetralogia de Fallot) pós-cirúrgica",
    diasDeUTI: 7,
    riscoMortality24h: 0.42,
    riscoMortality7d: 0.52,
    ultimaAtualizacao: "2025-11-26T08:30:00Z",
    tags: ["pós-operatório", "estável", "desmame ventilatório"],
    vitalSigns: {
      temperatura: 37.0,
      frequenciaCardiaca: 110,
      frequenciaRespiratoria: 24,
      pressaoArterialSistolica: 112,
      pressaoArterialDiastolica: 68,
      pressaoArterialMedia: 72,
      saturacaoO2: 96,
      escalaGlasgow: 15
    },
    fluidBalance: {
      entrada24h: 2.5,
      saida24h: 2.8,
      balanco24h: -0.3,
      entradaTotal: 4800,
      saidaTotal: 5376,
      balancoTotal: -576,
      diurese: 2.2,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m17",
        nome: "Furosemida",
        tipo: "diuretico",
        dose: 1.5,
        unidade: "mg/kg/dose",
        via: "EV",
        frequencia: "12/12h",
        diasDeUso: 7,
        inicio: "2025-11-19T08:00:00Z",
        ativo: true
      }
    ],
    ventilationParams: {
      modo: "PSV",
      fiO2: 35,
      peep: 5,
      pressaoSuporte: 8,
      volumeCorrente: 8.5,
      frequenciaRespiratoria: 18,
      relacaoIE: "1:2",
      paO2FiO2: 300,
      ultimaAtualizacao: "2025-11-26T08:25:00Z"
    },
    labResults: [
      {
        id: "l14",
        tipo: "lactato",
        nome: "Lactato",
        valor: 1.6,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "caindo",
        critico: false
      }
    ]
  }
];

// Mock de perfil da unidade
export const mockUnitProfile: UnitProfile = {
  totalPacientes: mockPatientsRaw.length,
  taxaOcupacao: 0.85,
  casuistica: {
    respiratorios: mockPatientsRaw.filter(p => 
      p.diagnosticoPrincipal.toLowerCase().includes("pneumonia") ||
      p.diagnosticoPrincipal.toLowerCase().includes("bronquiolite") ||
      p.diagnosticoPrincipal.toLowerCase().includes("respiratória")
    ).length,
    sepse: mockPatientsRaw.filter(p => 
      p.diagnosticoPrincipal.toLowerCase().includes("sepse")
    ).length,
    cardiopatias: mockPatientsRaw.filter(p => 
      p.diagnosticoPrincipal.toLowerCase().includes("cardiopatia")
    ).length,
    trauma: mockPatientsRaw.filter(p => 
      p.diagnosticoPrincipal.toLowerCase().includes("trauma")
    ).length,
    outros: mockPatientsRaw.filter(p => {
      const d = p.diagnosticoPrincipal.toLowerCase();
      return !d.includes("pneumonia") && !d.includes("bronquiolite") && 
             !d.includes("respiratória") && !d.includes("sepse") && 
             !d.includes("cardiopatia") && !d.includes("trauma");
    }).length
  },
  germesMaisFrequentes: [
    {
      nome: "Streptococcus pneumoniae",
      frequencia: 4,
      resistencia: ["Penicilina"]
    },
    {
      nome: "Staphylococcus aureus",
      frequencia: 3,
      resistencia: ["Oxacilina"]
    },
    {
      nome: "Escherichia coli",
      frequencia: 2,
      resistencia: ["Ampicilina", "Cefalosporinas"]
    },
    {
      nome: "Klebsiella pneumoniae",
      frequencia: 2,
      resistencia: ["Cefalosporinas de 3ª geração"]
    }
  ],
  perfilResistencia: [
    {
      antibiotico: "Ampicilina",
      taxaResistencia: 0.65,
      germes: ["E. coli", "K. pneumoniae"]
    },
    {
      antibiotico: "Ceftriaxona",
      taxaResistencia: 0.35,
      germes: ["K. pneumoniae", "E. coli"]
    },
    {
      antibiotico: "Oxacilina",
      taxaResistencia: 0.40,
      germes: ["S. aureus"]
    }
  ],
  periodo: {
    inicio: "2025-10-27T00:00:00Z",
    fim: "2025-11-26T23:59:59Z"
  }
};

// Funções auxiliares para compatibilidade com componentes existentes
export type TendenciaLactato = "subindo" | "estavel" | "caindo";

/**
 * Retorna o valor de lactato do paciente (para compatibilidade)
 */
export function getLactato(patient: Patient): number {
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  if (lactato && typeof lactato.valor === "number") {
    return lactato.valor;
  }
  return 0;
}

/**
 * Retorna a tendência do lactato (para compatibilidade)
 */
export function getTendenciaLactato(patient: Patient): TendenciaLactato {
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  return (lactato?.tendencia as TendenciaLactato) || "estavel";
}

/**
 * Retorna se o paciente está em ventilação mecânica (para compatibilidade)
 */
export function isEmVentilacaoMecanica(patient: Patient): boolean {
  return !!patient.ventilationParams;
}

/**
 * Retorna se o paciente está em vasopressor (para compatibilidade)
 */
export function isEmVasopressor(patient: Patient): boolean {
  return patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
}

/**
 * Retorna se o paciente está em antibiótico (para compatibilidade)
 */
export function isEmAntibiotico(patient: Patient): boolean {
  return patient.medications.some(m => m.tipo === "antibiotico" && m.ativo);
}

/**
 * Retorna dias em antibiótico atual (para compatibilidade)
 */
export function getDiasEmAntibioticoAtual(patient: Patient): number {
  const antibiotico = patient.medications.find(m => m.tipo === "antibiotico" && m.ativo);
  return antibiotico?.diasDeUso || 0;
}

/**
 * Calcula um score SOFA simplificado baseado nos dados do paciente
 */
export function calculateSOFA(patient: Patient): number {
  let sofa = 0;
  
  // Componente respiratório (PaO2/FiO2)
  if (patient.ventilationParams?.paO2FiO2) {
    const ratio = patient.ventilationParams.paO2FiO2;
    if (ratio < 100) sofa += 4;
    else if (ratio < 200) sofa += 3;
    else if (ratio < 300) sofa += 2;
    else if (ratio < 400) sofa += 1;
  } else if (patient.vitalSigns.saturacaoO2 < 92) {
    sofa += 2;
  }
  
  // Componente cardiovascular (vasopressor)
  if (isEmVasopressor(patient)) {
    sofa += 3;
  } else if (patient.vitalSigns.pressaoArterialMedia < 70) {
    sofa += 1;
  }
  
  // Componente neurológico (GCS)
  if (patient.vitalSigns.escalaGlasgow) {
    const gcs = patient.vitalSigns.escalaGlasgow;
    if (gcs < 6) sofa += 4;
    else if (gcs < 10) sofa += 3;
    else if (gcs < 13) sofa += 2;
    else if (gcs < 15) sofa += 1;
  }
  
  // Componente hepático (simplificado - não temos bilirrubina no mock)
  // Componente renal (simplificado - não temos creatinina no mock)
  // Componente de coagulação (simplificado - não temos plaquetas no mock)
  
  // Ajuste baseado em lactato
  const lactato = getLactato(patient);
  if (lactato >= 4) sofa += 2;
  else if (lactato >= 3) sofa += 1;
  
  return Math.min(sofa, 24); // SOFA máximo teórico é 24
}

/**
 * Tipo compatível para componentes existentes
 */
export interface PatientCompat extends Patient {
  sofa: number;
  lactato: number;
  tendenciaLactato: TendenciaLactato;
  emVentilacaoMecanica: boolean;
  emVasopressor: boolean;
  emAntibiotico: boolean;
  diasEmAntibioticoAtual: number;
  temperatura: number;
  mapaPressaoMedia: number;
  instabilityScore: number;
  responseToTherapyScore: number;
}

/**
 * Converte um Patient para PatientCompat (para compatibilidade com componentes)
 */
export function toPatientCompat(patient: Patient): PatientCompat {
  return {
    ...patient,
    sofa: calculateSOFA(patient),
    lactato: getLactato(patient),
    tendenciaLactato: getTendenciaLactato(patient),
    emVentilacaoMecanica: isEmVentilacaoMecanica(patient),
    emVasopressor: isEmVasopressor(patient),
    emAntibiotico: isEmAntibiotico(patient),
    diasEmAntibioticoAtual: getDiasEmAntibioticoAtual(patient),
    temperatura: patient.vitalSigns.temperatura,
    mapaPressaoMedia: patient.vitalSigns.pressaoArterialMedia,
    instabilityScore: calculateRiskScore(patient),
    responseToTherapyScore: 0.5 // Valor padrão, pode ser calculado depois
  };
}

/**
 * Exporta pacientes em formato compatível
 * Por enquanto, exportamos ambos para manter compatibilidade
 */
export const mockPatientsCompat: PatientCompat[] = mockPatientsRaw.map(toPatientCompat);

// Para compatibilidade com componentes existentes
// Os componentes antigos esperam campos como sofa, lactato, etc.
// Exportamos os pacientes no formato compatível
export type { PatientCompat as Patient };
export { mockPatientsCompat as mockPatients };

// Exportar mockPatientsRaw para uso em outros módulos
export { mockPatientsRaw };

/**
 * Constrói payload estruturado para Patient Focus Mode
 */
export function buildPatientFocusPayload(patient: Patient): import("@/types/PatientFocusPayload").PatientFocusPayload {
  const riskScore = calculateRiskScore(patient);
  const riskLevel = riskLevelFromScore(riskScore);
  const riskPercent24h = Math.round(patient.riscoMortality24h * 100);
  
  const hasVM = !!patient.ventilationParams;
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  
  // Extrair lactato mais recente
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  const lactatoValue = lactato && typeof lactato.valor === "number" ? lactato.valor : undefined;
  const lactatoTrend = lactato?.tendencia as "subindo" | "estavel" | "caindo" | undefined;
  
  // Construir key findings (3-6 bullet points)
  const keyFindings: string[] = [];
  
  // Instabilidade de vitais
  if (patient.vitalSigns.pressaoArterialMedia < 55) {
    keyFindings.push(`Hipotensão crítica (PAM: ${patient.vitalSigns.pressaoArterialMedia} mmHg)`);
  }
  if (patient.vitalSigns.saturacaoO2 < 92) {
    keyFindings.push(`Hipoxemia grave (SpO₂: ${patient.vitalSigns.saturacaoO2}%)`);
  }
  
  // Ventilação mecânica
  if (hasVM && patient.ventilationParams) {
    keyFindings.push(`VM: ${patient.ventilationParams.modo} | FiO₂: ${patient.ventilationParams.fiO2}% | PEEP: ${patient.ventilationParams.peep}cmH₂O`);
  }
  
  // Vasopressor
  if (hasVaso) {
    const vaso = patient.medications.find(m => m.tipo === "vasopressor" && m.ativo);
    if (vaso) {
      keyFindings.push(`Vasopressor ativo: ${vaso.nome} ${vaso.dose} ${vaso.unidade}`);
    }
  }
  
  // Lactato
  if (lactatoValue !== undefined) {
    const trend = lactatoTrend === 'subindo' ? '↑' : lactatoTrend === 'caindo' ? '↓' : '';
    keyFindings.push(`Lactato: ${lactatoValue} mmol/L ${trend}`);
  }
  
  // Diurese
  if (patient.fluidBalance.diurese < 1) {
    keyFindings.push(`Oligúria (diurese: ${patient.fluidBalance.diurese} ml/kg/h)`);
  }
  
  // Garantir pelo menos 3 findings
  if (keyFindings.length < 3) {
    keyFindings.push(`Risco 24h: ${riskPercent24h}%`);
    if (keyFindings.length < 3) {
      keyFindings.push(`${patient.diasDeUTI} ${patient.diasDeUTI === 1 ? 'dia' : 'dias'} de internação na UTI`);
    }
  }
  
  return {
    patientId: patient.id,
    nome: patient.nome,
    idade: patient.idade,
    peso: patient.peso,
    leito: patient.leito,
    diagnosticoPrincipal: patient.diagnosticoPrincipal,
    riskLevel,
    riskPercent24h,
    hasVM,
    hasVaso,
    lactatoValue,
    lactatoTrend,
    sofaScore: undefined, // Deixar undefined por enquanto
    keyFindings: keyFindings.slice(0, 6), // Máximo 6
    narrativaAgente: undefined // Será preenchido pelo LLM se disponível
  };
}
