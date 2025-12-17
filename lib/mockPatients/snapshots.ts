import type { MockPatientSnapshot } from "@/types/MockPatientSnapshot";

/**
 * Snapshots completos de todos os pacientes
 * Map: { [patientId]: MockPatientSnapshot }
 * Usado para dashboards que precisam de dados atuais completos
 */
export const patientsSnapshots: Record<string, MockPatientSnapshot> = {
  "P001": {
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
      {
        id: "l1",
        tipo: "lactato",
        nome: "Lactato",
        valor: 3.8,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:30:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "l2",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 120,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "subindo",
        critico: true
      }
    ]
  },
  "P002": {
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
      {
        id: "l3",
        tipo: "lactato",
        nome: "Lactato",
        valor: 2.5,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "caindo",
        critico: true
      },
      {
        id: "l4",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 180,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "caindo",
        critico: true
      }
    ]
  },
  "P003": {
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
        diasDeUso: 5,
        inicio: "2025-11-21T10:00:00Z",
        ativo: true
      }
    ],
    ventilationParams: {
      modo: "PSV",
      fiO2: 65,
      peep: 10,
      pressaoSuporte: 20,
      volumeCorrente: 6.0,
      frequenciaRespiratoria: 40,
      relacaoIE: "1:2",
      paO2FiO2: 160,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    labResults: [
      {
        id: "l5",
        tipo: "lactato",
        nome: "Lactato",
        valor: 4.5,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "subindo",
        critico: true
      },
      {
        id: "l6",
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
  "P004": {
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
    vitalSigns: {
      temperatura: 37.5,
      frequenciaCardiaca: 110,
      frequenciaRespiratoria: 25,
      pressaoArterialSistolica: 100,
      pressaoArterialDiastolica: 60,
      pressaoArterialMedia: 73,
      saturacaoO2: 97,
      escalaGlasgow: 13
    },
    fluidBalance: {
      entrada24h: 3.0,
      saida24h: 2.8,
      balanco24h: 0.2,
      entradaTotal: 1440,
      saidaTotal: 1344,
      balancoTotal: 96,
      diurese: 2.2,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m7",
        nome: "Fenobarbital",
        tipo: "outro",
        dose: 5,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "12/12h",
        diasDeUso: 2,
        inicio: "2025-11-24T10:00:00Z",
        ativo: true
      }
    ],
    labResults: [
      {
        id: "l7",
        tipo: "hemograma",
        nome: "Hemograma completo",
        valor: "Normal",
        unidade: "células/mm³",
        referencia: "5.000-15.000",
        data: "2025-11-26T08:00:00Z",
        critico: false
      }
    ]
  },
  "P005": {
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
    vitalSigns: {
      temperatura: 37.2,
      frequenciaCardiaca: 140,
      frequenciaRespiratoria: 30,
      pressaoArterialSistolica: 105,
      pressaoArterialDiastolica: 55,
      pressaoArterialMedia: 72,
      saturacaoO2: 95,
      escalaGlasgow: 15
    },
    fluidBalance: {
      entrada24h: 2.5,
      saida24h: 3.5,
      balanco24h: -1.0,
      entradaTotal: 3300,
      saidaTotal: 4620,
      balancoTotal: -1320,
      diurese: 3.0,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m8",
        nome: "Dobutamina",
        tipo: "vasopressor",
        dose: 10,
        unidade: "mcg/kg/min",
        via: "EV",
        frequencia: "contínuo",
        diasDeUso: 5,
        inicio: "2025-11-21T10:00:00Z",
        ativo: true
      },
      {
        id: "m9",
        nome: "Furosemida",
        tipo: "diuretico",
        dose: 2,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "12/12h",
        diasDeUso: 5,
        inicio: "2025-11-21T10:00:00Z",
        ativo: true
      }
    ],
    labResults: [
      {
        id: "l8",
        tipo: "funcao_renal",
        nome: "Creatinina",
        valor: 0.8,
        unidade: "mg/dL",
        referencia: "< 1.0",
        data: "2025-11-26T08:00:00Z",
        critico: false
      }
    ]
  },
  "P006": {
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
    vitalSigns: {
      temperatura: 37.0,
      frequenciaCardiaca: 120,
      frequenciaRespiratoria: 35,
      pressaoArterialSistolica: 115,
      pressaoArterialDiastolica: 70,
      pressaoArterialMedia: 85,
      saturacaoO2: 96,
      escalaGlasgow: 15
    },
    fluidBalance: {
      entrada24h: 3.2,
      saida24h: 3.0,
      balanco24h: 0.2,
      entradaTotal: 2304,
      saidaTotal: 2160,
      balancoTotal: 144,
      diurese: 2.5,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m10",
        nome: "Metilprednisolona",
        tipo: "outro",
        dose: 2,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "6/6h",
        diasDeUso: 3,
        inicio: "2025-11-23T10:00:00Z",
        ativo: true
      }
    ],
    ventilationParams: {
      modo: "PSV",
      fiO2: 40,
      peep: 6,
      pressaoSuporte: 10,
      volumeCorrente: 7.0,
      frequenciaRespiratoria: 30,
      relacaoIE: "1:2",
      paO2FiO2: 280,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    labResults: [
      {
        id: "l9",
        tipo: "gasometria",
        nome: "Gasometria arterial",
        valor: "pH 7.38, PaCO2 42",
        unidade: "",
        referencia: "pH 7.35-7.45",
        data: "2025-11-26T08:00:00Z",
        critico: false
      }
    ]
  },
  "P007": {
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
    vitalSigns: {
      temperatura: 37.1,
      frequenciaCardiaca: 95,
      frequenciaRespiratoria: 18,
      pressaoArterialSistolica: 125,
      pressaoArterialDiastolica: 75,
      pressaoArterialMedia: 92,
      saturacaoO2: 98,
      escalaGlasgow: 9
    },
    fluidBalance: {
      entrada24h: 2.8,
      saida24h: 2.5,
      balanco24h: 0.3,
      entradaTotal: 4704,
      saidaTotal: 4200,
      balancoTotal: 504,
      diurese: 2.0,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m11",
        nome: "Fentanil",
        tipo: "sedativo",
        dose: 2,
        unidade: "mcg/kg/h",
        via: "EV",
        frequencia: "contínuo",
        diasDeUso: 7,
        inicio: "2025-11-19T10:00:00Z",
        ativo: true
      },
      {
        id: "m12",
        nome: "Midazolam",
        tipo: "sedativo",
        dose: 0.15,
        unidade: "mg/kg/h",
        via: "EV",
        frequencia: "contínuo",
        diasDeUso: 7,
        inicio: "2025-11-19T10:00:00Z",
        ativo: true
      }
    ],
    labResults: []
  },
  "P008": {
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
    vitalSigns: {
      temperatura: 38.5,
      frequenciaCardiaca: 150,
      frequenciaRespiratoria: 50,
      pressaoArterialSistolica: 90,
      pressaoArterialDiastolica: 50,
      pressaoArterialMedia: 63,
      saturacaoO2: 93,
      escalaGlasgow: 15
    },
    fluidBalance: {
      entrada24h: 4.0,
      saida24h: 3.5,
      balanco24h: 0.5,
      entradaTotal: 1224,
      saidaTotal: 1071,
      balancoTotal: 153,
      diurese: 2.0,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [],
    ventilationParams: {
      modo: "CPAP",
      fiO2: 35,
      peep: 5,
      frequenciaRespiratoria: 45,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    labResults: [
      {
        id: "l10",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 45,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "subindo",
        critico: true
      }
    ]
  },
  "P009": {
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
    vitalSigns: {
      temperatura: 39.5,
      frequenciaCardiaca: 145,
      frequenciaRespiratoria: 28,
      pressaoArterialSistolica: 92,
      pressaoArterialDiastolica: 48,
      pressaoArterialMedia: 63,
      saturacaoO2: 96,
      escalaGlasgow: 12
    },
    fluidBalance: {
      entrada24h: 4.5,
      saida24h: 2.5,
      balanco24h: 2.0,
      entradaTotal: 5400,
      saidaTotal: 3000,
      balancoTotal: 2400,
      diurese: 1.8,
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
        nome: "Ceftriaxona",
        tipo: "antibiotico",
        dose: 100,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "12/12h",
        diasDeUso: 4,
        inicio: "2025-11-22T10:00:00Z",
        ativo: true
      }
    ],
    labResults: [
      {
        id: "l11",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 200,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "subindo",
        critico: true
      }
    ]
  },
  "P010": {
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
    vitalSigns: {
      temperatura: 38.2,
      frequenciaCardiaca: 130,
      frequenciaRespiratoria: 28,
      pressaoArterialSistolica: 108,
      pressaoArterialDiastolica: 62,
      pressaoArterialMedia: 77,
      saturacaoO2: 92,
      escalaGlasgow: 14
    },
    fluidBalance: {
      entrada24h: 3.8,
      saida24h: 3.2,
      balanco24h: 0.6,
      entradaTotal: 6300,
      saidaTotal: 5320,
      balancoTotal: 980,
      diurese: 2.3,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    medications: [
      {
        id: "m15",
        nome: "Ceftriaxona",
        tipo: "antibiotico",
        dose: 100,
        unidade: "mg/kg/dia",
        via: "EV",
        frequencia: "12/12h",
        diasDeUso: 5,
        inicio: "2025-11-21T10:00:00Z",
        ativo: true
      }
    ],
    ventilationParams: {
      modo: "PSV",
      fiO2: 75,
      peep: 12,
      pressaoSuporte: 22,
      volumeCorrente: 6.5,
      frequenciaRespiratoria: 32,
      relacaoIE: "1:2",
      paO2FiO2: 150,
      ultimaAtualizacao: "2025-11-26T09:00:00Z"
    },
    labResults: [
      {
        id: "l12",
        tipo: "lactato",
        nome: "Lactato",
        valor: 2.8,
        unidade: "mmol/L",
        referencia: "< 2.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "estavel",
        critico: true
      },
      {
        id: "l13",
        tipo: "pcr",
        nome: "Proteína C Reativa",
        valor: 150,
        unidade: "mg/L",
        referencia: "< 3.0",
        data: "2025-11-26T08:00:00Z",
        tendencia: "caindo",
        critico: true
      }
    ]
  }
};

/**
 * Helper para buscar snapshot por ID
 */
export function getPatientSnapshotById(id: string): MockPatientSnapshot | undefined {
  return patientsSnapshots[id];
}

