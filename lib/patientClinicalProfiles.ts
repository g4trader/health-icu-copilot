/**
 * Perfis clínicos detalhados para cada paciente
 * Define trajetórias esperadas de evolução na UTI
 */

export interface ClinicalProfile {
  patientId: string;
  nome: string;
  diagnosticoPrincipal: string;
  
  // Trajetória esperada
  phases: {
    days: number[]; // [início, fim] do período
    statusGlobal: "critico" | "grave" | "estavel" | "melhora" | "alta_uti";
    description: string;
    riskScoreRange: [number, number]; // [min, max]
    hasVM: boolean;
    fiO2Trend?: "up" | "down" | "stable";
    hasVasopressor: boolean;
    vasopressorDoseTrend?: "up" | "down" | "stable";
    lactateTrend?: "up" | "down" | "stable";
    pcrTrend?: "up" | "down" | "stable";
  }[];
  
  altaDay: number; // Dia esperado de alta da UTI
  
  // Eventos chave esperados
  keyEvents: {
    day: number;
    description: string;
  }[];
}

/**
 * Perfis clínicos para todos os pacientes
 */
export const clinicalProfiles: Record<string, ClinicalProfile> = {
  p1: {
    patientId: "p1",
    nome: "Sophia",
    diagnosticoPrincipal: "Bronquiolite viral aguda com insuficiência respiratória grave",
    phases: [
      {
        days: [1, 2],
        statusGlobal: "critico",
        description: "Piora respiratória progressiva, aumento de FiO2/PEEP, lactato e PCR em subida, necessidade crescente de noradrenalina",
        riskScoreRange: [0.75, 0.85],
        hasVM: true,
        fiO2Trend: "up",
        hasVasopressor: true,
        vasopressorDoseTrend: "up",
        lactateTrend: "up",
        pcrTrend: "up"
      },
      {
        days: [3, 6],
        statusGlobal: "grave",
        description: "Estabilização hemodinâmica, lenta melhora de SpO2/PaO2/FiO2, lactato em queda",
        riskScoreRange: [0.60, 0.75],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: true,
        vasopressorDoseTrend: "down",
        lactateTrend: "down",
        pcrTrend: "down"
      },
      {
        days: [7, 10],
        statusGlobal: "estavel",
        description: "Desmame ventilatório progressivo, retirada de vasopressor, labs se normalizando",
        riskScoreRange: [0.40, 0.60],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: false,
        lactateTrend: "down",
        pcrTrend: "down"
      },
      {
        days: [11, 12],
        statusGlobal: "melhora",
        description: "Preparação para alta, desmame completo",
        riskScoreRange: [0.20, 0.40],
        hasVM: false,
        hasVasopressor: false,
        lactateTrend: "stable",
        pcrTrend: "stable"
      },
      {
        days: [13, 30],
        statusGlobal: "alta_uti",
        description: "Alta da UTI",
        riskScoreRange: [0.10, 0.20],
        hasVM: false,
        hasVasopressor: false
      }
    ],
    altaDay: 12,
    keyEvents: [
      { day: 1, description: "Admissão em choque séptico, intubação e início de noradrenalina 0,8 mcg/kg/min" },
      { day: 2, description: "Aumento de suporte ventilatório (FiO2 80%, PEEP 10 cmH2O)" },
      { day: 3, description: "Primeira estabilização hemodinâmica, redução gradual de noradrenalina" },
      { day: 6, description: "Início de desmame ventilatório, redução de FiO2 para 60%" },
      { day: 9, description: "Retirada de vasopressor, melhora de lactato < 2.0" },
      { day: 11, description: "Extubação, transição para oxigênio por cânula nasal" },
      { day: 12, description: "Alta da UTI" }
    ]
  },
  
  p2: {
    patientId: "p2",
    nome: "Gabriel",
    diagnosticoPrincipal: "Pneumonia bacteriana grave com derrame pleural",
    phases: [
      {
        days: [1, 2],
        statusGlobal: "grave",
        description: "Pneumonia grave com derrame, início de antibioticoterapia",
        riskScoreRange: [0.55, 0.65],
        hasVM: true,
        fiO2Trend: "stable",
        hasVasopressor: false,
        pcrTrend: "up"
      },
      {
        days: [3, 4],
        statusGlobal: "estavel",
        description: "Rápida resposta a antibiótico e drenagem, PCR cai acentuadamente",
        riskScoreRange: [0.40, 0.55],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: false,
        pcrTrend: "down"
      },
      {
        days: [5, 5],
        statusGlobal: "melhora",
        description: "Preparação para alta",
        riskScoreRange: [0.25, 0.40],
        hasVM: false,
        hasVasopressor: false,
        pcrTrend: "down"
      },
      {
        days: [6, 30],
        statusGlobal: "alta_uti",
        description: "Alta da UTI",
        riskScoreRange: [0.10, 0.25],
        hasVM: false,
        hasVasopressor: false
      }
    ],
    altaDay: 5,
    keyEvents: [
      { day: 1, description: "Admissão com pneumonia grave, início de Ceftriaxona e Clindamicina" },
      { day: 2, description: "Drenagem de derrame pleural com boa resposta respiratória" },
      { day: 3, description: "PCR em queda acentuada, melhora clínica significativa" },
      { day: 4, description: "Desmame ventilatório, redução de FiO2" },
      { day: 5, description: "Alta da UTI" }
    ]
  },
  
  p3: {
    patientId: "p3",
    nome: "Isabella",
    diagnosticoPrincipal: "Sepse de foco abdominal pós-cirurgia de apendicite complicada",
    phases: [
      {
        days: [1, 3],
        statusGlobal: "critico",
        description: "Choque séptico com lactato alto, PAM baixa, vasopressor em doses moderadas/altas",
        riskScoreRange: [0.75, 0.85],
        hasVM: false,
        hasVasopressor: true,
        vasopressorDoseTrend: "up",
        lactateTrend: "up",
        pcrTrend: "up"
      },
      {
        days: [4, 7],
        statusGlobal: "grave",
        description: "Resposta parcial à terapia, flutuações de PAM e lactato (plateau)",
        riskScoreRange: [0.65, 0.75],
        hasVM: false,
        hasVasopressor: true,
        vasopressorDoseTrend: "stable",
        lactateTrend: "stable",
        pcrTrend: "down"
      },
      {
        days: [8, 12],
        statusGlobal: "estavel",
        description: "Franca melhora, redução de vaso, função renal voltando",
        riskScoreRange: [0.45, 0.65],
        hasVM: false,
        hasVasopressor: true,
        vasopressorDoseTrend: "down",
        lactateTrend: "down",
        pcrTrend: "down"
      },
      {
        days: [13, 15],
        statusGlobal: "melhora",
        description: "Retirada completa de suportes, preparação para alta",
        riskScoreRange: [0.25, 0.45],
        hasVM: false,
        hasVasopressor: false,
        lactateTrend: "down",
        pcrTrend: "down"
      },
      {
        days: [16, 30],
        statusGlobal: "alta_uti",
        description: "Alta da UTI",
        riskScoreRange: [0.10, 0.25],
        hasVM: false,
        hasVasopressor: false
      }
    ],
    altaDay: 15,
    keyEvents: [
      { day: 1, description: "Admissão em choque séptico pós-apendicectomia, início de noradrenalina 0,8 mcg/kg/min" },
      { day: 2, description: "Lactato pico (4.5 mmol/L), ajuste de antibiótico (Piperacilina-Tazobactam + Metronidazol)" },
      { day: 4, description: "Primeira estabilização hemodinâmica, lactato começa a cair" },
      { day: 6, description: "Nova febre, ajuste de antibiótico após cultura positiva para Pseudomonas" },
      { day: 9, description: "Função renal melhorando, creatinina em queda" },
      { day: 12, description: "Redução significativa de noradrenalina, lactato < 2.0" },
      { day: 15, description: "Alta da UTI" }
    ]
  },
  
  p4: {
    patientId: "p4",
    nome: "Lucas",
    diagnosticoPrincipal: "Trauma cranioencefálico grave pós-acidente",
    phases: [
      {
        days: [1, 3],
        statusGlobal: "critico",
        description: "TCE grave, sedação profunda, monitorização PIC, risco de hipertensão intracraniana",
        riskScoreRange: [0.60, 0.70],
        hasVM: true,
        fiO2Trend: "stable",
        hasVasopressor: false,
        lactateTrend: "stable"
      },
      {
        days: [4, 8],
        statusGlobal: "estavel",
        description: "PIC estável, sem sinais de hipertensão intracraniana, desmame de sedação iniciado",
        riskScoreRange: [0.40, 0.60],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: false,
        lactateTrend: "stable"
      },
      {
        days: [9, 12],
        statusGlobal: "estavel",
        description: "Paciente estável neurologicamente, desmame ventilatório em andamento",
        riskScoreRange: [0.30, 0.45],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: false
      },
      {
        days: [13, 15],
        statusGlobal: "melhora",
        description: "Preparação para alta, avaliação neurológica completa",
        riskScoreRange: [0.20, 0.35],
        hasVM: false,
        hasVasopressor: false
      },
      {
        days: [16, 30],
        statusGlobal: "alta_uti",
        description: "Alta da UTI",
        riskScoreRange: [0.10, 0.25],
        hasVM: false,
        hasVasopressor: false
      }
    ],
    altaDay: 15,
    keyEvents: [
      { day: 1, description: "Admissão com TCE grave, GCS 7, intubação e início de sedação profunda" },
      { day: 2, description: "TC de crânio: edema cerebral, sem sinais de hipertensão intracraniana aguda" },
      { day: 4, description: "PIC estável, início de desmame de sedação" },
      { day: 6, description: "TC de controle: edema reduzindo, sem novas lesões" },
      { day: 9, description: "Redução de sedação, resposta neurológica melhorando" },
      { day: 12, description: "Desmame ventilatório, redução de FiO2" },
      { day: 15, description: "Alta da UTI" }
    ]
  },
  
  p5: {
    patientId: "p5",
    nome: "Maria Eduarda",
    diagnosticoPrincipal: "Cardiopatia congênita descompensada (CIV + CIA)",
    phases: [
      {
        days: [1, 3],
        statusGlobal: "grave",
        description: "Descompensação cardíaca, congestão pulmonar, balanço hídrico positivo, função renal comprometida",
        riskScoreRange: [0.60, 0.70],
        hasVM: true,
        fiO2Trend: "stable",
        hasVasopressor: true,
        vasopressorDoseTrend: "stable",
        lactateTrend: "stable"
      },
      {
        days: [4, 7],
        statusGlobal: "estavel",
        description: "Resposta ao diurético, balanço hídrico melhorando, função renal se recuperando",
        riskScoreRange: [0.50, 0.65],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: true,
        vasopressorDoseTrend: "down",
        lactateTrend: "down"
      },
      {
        days: [8, 12],
        statusGlobal: "estavel",
        description: "Função cardíaca melhorando, desmame de suportes iniciado",
        riskScoreRange: [0.40, 0.55],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: false,
        lactateTrend: "down"
      },
      {
        days: [13, 15],
        statusGlobal: "melhora",
        description: "Preparação para alta, função cardíaca compensada",
        riskScoreRange: [0.25, 0.40],
        hasVM: false,
        hasVasopressor: false
      },
      {
        days: [16, 30],
        statusGlobal: "alta_uti",
        description: "Alta da UTI",
        riskScoreRange: [0.10, 0.25],
        hasVM: false,
        hasVasopressor: false
      }
    ],
    altaDay: 15,
    keyEvents: [
      { day: 1, description: "Admissão com descompensação cardíaca, edema pulmonar, início de dopamina e furosemida" },
      { day: 2, description: "Balanço hídrico positivo excessivo, ajuste de diurético" },
      { day: 4, description: "Resposta ao diurético, balanço hídrico melhorando" },
      { day: 6, description: "Função renal melhorando, creatinina em queda" },
      { day: 9, description: "Redução de dopamina, função cardíaca estável" },
      { day: 12, description: "Desmame ventilatório, melhora clínica" },
      { day: 15, description: "Alta da UTI" }
    ]
  },
  
  p6: {
    patientId: "p6",
    nome: "João Pedro",
    diagnosticoPrincipal: "Bronquiolite viral moderada com necessidade de suporte ventilatório",
    phases: [
      {
        days: [1, 2],
        statusGlobal: "grave",
        description: "Bronquiolite moderada, CPAP necessário, boa resposta inicial",
        riskScoreRange: [0.35, 0.45],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: false,
        pcrTrend: "down"
      },
      {
        days: [3, 4],
        statusGlobal: "estavel",
        description: "Melhora progressiva, redução de suporte ventilatório",
        riskScoreRange: [0.25, 0.40],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: false,
        pcrTrend: "down"
      },
      {
        days: [5, 5],
        statusGlobal: "melhora",
        description: "Preparação para alta, sem necessidade de suporte",
        riskScoreRange: [0.15, 0.30],
        hasVM: false,
        hasVasopressor: false,
        pcrTrend: "down"
      },
      {
        days: [6, 30],
        statusGlobal: "alta_uti",
        description: "Alta da UTI",
        riskScoreRange: [0.10, 0.20],
        hasVM: false,
        hasVasopressor: false
      }
    ],
    altaDay: 5,
    keyEvents: [
      { day: 1, description: "Admissão com bronquiolite moderada, início de CPAP" },
      { day: 2, description: "Boa resposta ao CPAP, redução de FiO2" },
      { day: 3, description: "Melhora clínica, preparação para retirada de CPAP" },
      { day: 4, description: "Retirada de CPAP, oxigênio por cânula nasal" },
      { day: 5, description: "Alta da UTI" }
    ]
  },
  
  p7: {
    patientId: "p7",
    nome: "Ana Clara",
    diagnosticoPrincipal: "Sepse de foco pulmonar com choque séptico",
    phases: [
      {
        days: [1, 3],
        statusGlobal: "critico",
        description: "Choque séptico grave, lactato alto, vasopressor necessário, SDRA moderada",
        riskScoreRange: [0.75, 0.85],
        hasVM: true,
        fiO2Trend: "up",
        hasVasopressor: true,
        vasopressorDoseTrend: "up",
        lactateTrend: "up",
        pcrTrend: "up"
      },
      {
        days: [4, 7],
        statusGlobal: "grave",
        description: "Resposta parcial à terapia, lactato em plateau, PCR começa a cair",
        riskScoreRange: [0.65, 0.75],
        hasVM: true,
        fiO2Trend: "stable",
        hasVasopressor: true,
        vasopressorDoseTrend: "stable",
        lactateTrend: "stable",
        pcrTrend: "down"
      },
      {
        days: [8, 12],
        statusGlobal: "estavel",
        description: "Franca melhora, lactato e PCR caindo, redução de suportes",
        riskScoreRange: [0.45, 0.65],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: true,
        vasopressorDoseTrend: "down",
        lactateTrend: "down",
        pcrTrend: "down"
      },
      {
        days: [13, 15],
        statusGlobal: "melhora",
        description: "Retirada de suportes, preparação para alta",
        riskScoreRange: [0.25, 0.45],
        hasVM: false,
        hasVasopressor: false,
        lactateTrend: "down",
        pcrTrend: "down"
      },
      {
        days: [16, 30],
        statusGlobal: "alta_uti",
        description: "Alta da UTI",
        riskScoreRange: [0.10, 0.25],
        hasVM: false,
        hasVasopressor: false
      }
    ],
    altaDay: 15,
    keyEvents: [
      { day: 1, description: "Admissão em choque séptico, lactato 4.2, início de noradrenalina e antibióticos de amplo espectro" },
      { day: 2, description: "Lactato em pico, PCR elevado, ajuste de antibiótico" },
      { day: 4, description: "Primeira estabilização, lactato começa a cair" },
      { day: 6, description: "PCR em queda acentuada, resposta clínica favorável" },
      { day: 9, description: "Redução de noradrenalina, lactato < 2.5" },
      { day: 12, description: "Desmame ventilatório, melhora clínica significativa" },
      { day: 15, description: "Alta da UTI" }
    ]
  },
  
  p8: {
    patientId: "p8",
    nome: "Rafael",
    diagnosticoPrincipal: "Pneumonia comunitária grave com derrame pleural bilateral",
    phases: [
      {
        days: [1, 2],
        statusGlobal: "grave",
        description: "Pneumonia grave, derrame pleural, início de antibioticoterapia",
        riskScoreRange: [0.50, 0.60],
        hasVM: true,
        fiO2Trend: "stable",
        hasVasopressor: false,
        pcrTrend: "up"
      },
      {
        days: [3, 5],
        statusGlobal: "estavel",
        description: "Drenagem de derrame, resposta a antibiótico, PCR cai rapidamente",
        riskScoreRange: [0.40, 0.55],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: false,
        pcrTrend: "down"
      },
      {
        days: [6, 8],
        statusGlobal: "estavel",
        description: "Melhora clínica, desmame ventilatório",
        riskScoreRange: [0.30, 0.45],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: false,
        pcrTrend: "down"
      },
      {
        days: [9, 10],
        statusGlobal: "melhora",
        description: "Preparação para alta",
        riskScoreRange: [0.20, 0.35],
        hasVM: false,
        hasVasopressor: false,
        pcrTrend: "down"
      },
      {
        days: [11, 30],
        statusGlobal: "alta_uti",
        description: "Alta da UTI",
        riskScoreRange: [0.10, 0.25],
        hasVM: false,
        hasVasopressor: false
      }
    ],
    altaDay: 10,
    keyEvents: [
      { day: 1, description: "Admissão com pneumonia grave, derrame pleural bilateral, início de Ampicilina-Sulbactam" },
      { day: 2, description: "Drenagem de derrame pleural com boa resposta respiratória" },
      { day: 3, description: "PCR em queda acentuada, melhora clínica significativa" },
      { day: 5, description: "Desmame ventilatório, redução de FiO2" },
      { day: 8, description: "Extubação, transição para oxigênio" },
      { day: 10, description: "Alta da UTI" }
    ]
  },
  
  p9: {
    patientId: "p9",
    nome: "Laura",
    diagnosticoPrincipal: "Bronquiolite viral grave em lactente",
    phases: [
      {
        days: [1, 2],
        statusGlobal: "grave",
        description: "Bronquiolite grave em lactente, BiPAP necessário, monitorização próxima",
        riskScoreRange: [0.55, 0.65],
        hasVM: true,
        fiO2Trend: "stable",
        hasVasopressor: false,
        pcrTrend: "stable"
      },
      {
        days: [3, 5],
        statusGlobal: "estavel",
        description: "Melhora progressiva, redução de suporte ventilatório",
        riskScoreRange: [0.45, 0.58],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: false,
        pcrTrend: "down"
      },
      {
        days: [6, 8],
        statusGlobal: "estavel",
        description: "Desmame de BiPAP, preparação para alta",
        riskScoreRange: [0.35, 0.50],
        hasVM: false,
        hasVasopressor: false,
        pcrTrend: "down"
      },
      {
        days: [9, 10],
        statusGlobal: "melhora",
        description: "Preparação para alta, sem suporte",
        riskScoreRange: [0.20, 0.35],
        hasVM: false,
        hasVasopressor: false
      },
      {
        days: [11, 30],
        statusGlobal: "alta_uti",
        description: "Alta da UTI",
        riskScoreRange: [0.10, 0.25],
        hasVM: false,
        hasVasopressor: false
      }
    ],
    altaDay: 10,
    keyEvents: [
      { day: 1, description: "Admissão com bronquiolite grave, idade < 2 anos, início de BiPAP" },
      { day: 2, description: "Boa resposta ao BiPAP, redução de FiO2" },
      { day: 4, description: "Melhora clínica, preparação para desmame" },
      { day: 6, description: "Retirada de BiPAP, oxigênio por cânula nasal" },
      { day: 8, description: "Sem necessidade de oxigênio, preparação para alta" },
      { day: 10, description: "Alta da UTI" }
    ]
  },
  
  p10: {
    patientId: "p10",
    nome: "Enzo",
    diagnosticoPrincipal: "Cardiopatia congênita (Tetralogia de Fallot) pós-cirúrgica",
    phases: [
      {
        days: [1, 3],
        statusGlobal: "estavel",
        description: "Pós-operatório estável, desmame de ventilação mecânica em andamento",
        riskScoreRange: [0.45, 0.55],
        hasVM: true,
        fiO2Trend: "down",
        hasVasopressor: false,
        lactateTrend: "down"
      },
      {
        days: [4, 7],
        statusGlobal: "estavel",
        description: "Paciente estável, função cardíaca adequada, preparação para alta",
        riskScoreRange: [0.35, 0.48],
        hasVM: false,
        hasVasopressor: false,
        lactateTrend: "down"
      },
      {
        days: [8, 10],
        statusGlobal: "melhora",
        description: "Preparação para alta, avaliação cardiológica completa",
        riskScoreRange: [0.25, 0.40],
        hasVM: false,
        hasVasopressor: false
      },
      {
        days: [11, 30],
        statusGlobal: "alta_uti",
        description: "Alta da UTI",
        riskScoreRange: [0.10, 0.30],
        hasVM: false,
        hasVasopressor: false
      }
    ],
    altaDay: 10,
    keyEvents: [
      { day: 1, description: "Admissão pós-cirurgia cardíaca, extubação no mesmo dia" },
      { day: 2, description: "Paciente estável, função cardíaca adequada" },
      { day: 4, description: "Evolução favorável, sem intercorrências" },
      { day: 6, description: "Avaliação cardiológica: boa evolução pós-operatória" },
      { day: 8, description: "Preparação para alta, função cardíaca estável" },
      { day: 10, description: "Alta da UTI" }
    ]
  }
};

/**
 * Obtém o perfil clínico para um paciente
 */
export function getClinicalProfile(patientId: string): ClinicalProfile | null {
  return clinicalProfiles[patientId] || null;
}

