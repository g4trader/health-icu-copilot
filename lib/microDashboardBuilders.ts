import type { Patient } from "@/types/Patient";
import { mockPatients } from "@/lib/mockData";
import { calculateRiskScore, riskLevelFromScore } from "@/lib/mockData";
import type { 
  MicroDashboardPayload, 
  DashboardBlock, 
  SparklineSeries, 
  SparklinePoint 
} from "@/types/MicroDashboard";

/**
 * Gera pontos de sparkline simulados para uma série temporal
 */
function generateSparklinePoints(
  currentValue: number,
  hoursAgo: number = 24,
  trend: 'up' | 'down' | 'stable' = 'stable'
): SparklinePoint[] {
  const points: SparklinePoint[] = [];
  const intervals = hoursAgo === 24 ? ['-24h', '-12h', '-6h', 'agora'] : ['-12h', '-6h', '-3h', 'agora'];
  
  intervals.forEach((label, index) => {
    const progress = index / (intervals.length - 1);
    let value = currentValue;
    
    if (trend === 'up') {
      value = currentValue * (1 - (1 - progress) * 0.15);
    } else if (trend === 'down') {
      value = currentValue * (1 + (1 - progress) * 0.15);
    } else {
      value = currentValue * (0.95 + Math.random() * 0.1);
    }
    
    points.push({ t: label, v: Math.round(value * 10) / 10 });
  });
  
  return points;
}

/**
 * Determina o nível de alerta baseado em valores críticos
 */
function getAlertLevel(value: number, thresholds: { green: number; yellow: number; red: number }, higherIsWorse: boolean = true): 'green' | 'yellow' | 'red' {
  if (higherIsWorse) {
    if (value >= thresholds.red) return 'red';
    if (value >= thresholds.yellow) return 'yellow';
    return 'green';
  } else {
    if (value <= thresholds.red) return 'red';
    if (value <= thresholds.yellow) return 'yellow';
    return 'green';
  }
}

/**
 * 1. Status do Paciente (NOW)
 */
export function buildStatusPaciente(patientId: string): MicroDashboardPayload {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }

  const riskScore = calculateRiskScore(patient);
  const riskLevel = riskLevelFromScore(riskScore);
  const riskPercent = Math.round(patient.riscoMortality24h * 100);
  
  const hasVM = !!patient.ventilationParams;
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  
  // Status global
  let statusGlobal = "";
  let statusAlert: 'green' | 'yellow' | 'red' = 'green';
  
  if (riskLevel === "alto" || riskPercent >= 70) {
    statusGlobal = `Paciente em situação crítica. Risco de mortalidade 24h: ${riskPercent}%. Requer monitorização intensiva.`;
    statusAlert = 'red';
  } else if (riskLevel === "moderado" || riskPercent >= 40) {
    statusGlobal = `Paciente estável com risco moderado (${riskPercent}%). Monitorização cuidadosa necessária.`;
    statusAlert = 'yellow';
  } else {
    statusGlobal = `Paciente estável com risco baixo (${riskPercent}%). Evolução favorável.`;
    statusAlert = 'green';
  }

  const blocos: DashboardBlock[] = [
    {
      titulo: "Status Global",
      nivel_alerta: statusAlert,
      texto: statusGlobal
    },
    {
      titulo: "Respiração",
      nivel_alerta: patient.vitalSigns.saturacaoO2 < 92 ? 'red' : patient.vitalSigns.saturacaoO2 < 95 ? 'yellow' : 'green',
      itens: [
        `SpO₂: ${patient.vitalSigns.saturacaoO2}%`,
        `FR: ${patient.vitalSigns.frequenciaRespiratoria} irpm`,
        hasVM ? `VM: ${patient.ventilationParams?.modo} | FiO₂: ${patient.ventilationParams?.fiO2}% | PEEP: ${patient.ventilationParams?.peep}cmH₂O` : 'Sem ventilação mecânica'
      ],
      sparklines: [
        {
          nome: "SpO₂",
          valor_atual: patient.vitalSigns.saturacaoO2,
          unidade: "%",
          pontos: generateSparklinePoints(patient.vitalSigns.saturacaoO2, 24, patient.vitalSigns.saturacaoO2 < 92 ? 'down' : 'stable')
        },
        {
          nome: "FR",
          valor_atual: patient.vitalSigns.frequenciaRespiratoria,
          unidade: "irpm",
          pontos: generateSparklinePoints(patient.vitalSigns.frequenciaRespiratoria, 24, 'stable')
        }
      ]
    },
    {
      titulo: "Hemodinâmica",
      nivel_alerta: getAlertLevel(patient.vitalSigns.pressaoArterialMedia, { green: 60, yellow: 55, red: 50 }, false),
      itens: [
        `PAM: ${patient.vitalSigns.pressaoArterialMedia} mmHg`,
        `FC: ${patient.vitalSigns.frequenciaCardiaca} bpm`,
        hasVaso ? `Vasopressor: ${patient.medications.find(m => m.tipo === "vasopressor" && m.ativo)?.nome} ${patient.medications.find(m => m.tipo === "vasopressor" && m.ativo)?.dose} ${patient.medications.find(m => m.tipo === "vasopressor" && m.ativo)?.unidade}` : 'Sem vasopressor'
      ],
      sparklines: [
        {
          nome: "PAM",
          valor_atual: patient.vitalSigns.pressaoArterialMedia,
          unidade: "mmHg",
          pontos: generateSparklinePoints(patient.vitalSigns.pressaoArterialMedia, 24, patient.vitalSigns.pressaoArterialMedia < 55 ? 'down' : 'stable')
        }
      ]
    },
    {
      titulo: "Rim / Balanço",
      nivel_alerta: patient.fluidBalance.diurese < 1 ? 'red' : patient.fluidBalance.diurese < 2 ? 'yellow' : 'green',
      itens: [
        `Diurese: ${patient.fluidBalance.diurese} ml/kg/h`,
        `Balanço 24h: ${patient.fluidBalance.balanco24h > 0 ? '+' : ''}${patient.fluidBalance.balanco24h.toFixed(1)} ml/kg/h`,
        `Temperatura: ${patient.vitalSigns.temperatura.toFixed(1)}°C`
      ]
    }
  ];

  // Alertas (máx 5)
  const alertas: string[] = [];
  if (patient.vitalSigns.pressaoArterialMedia < 55) alertas.push("Hipotensão crítica (PAM < 55 mmHg)");
  if (patient.vitalSigns.saturacaoO2 < 92) alertas.push("Hipoxemia grave (SpO₂ < 92%)");
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  if (lactato && typeof lactato.valor === "number" && lactato.valor > 3) alertas.push(`Lactato elevado: ${lactato.valor} mmol/L`);
  if (patient.fluidBalance.diurese < 1) alertas.push("Oligúria (diurese < 1 ml/kg/h)");
  if (riskPercent >= 70) alertas.push(`Alto risco de mortalidade: ${riskPercent}%`);
  
  if (alertas.length > 0) {
    blocos.push({
      titulo: "Alertas",
      nivel_alerta: alertas.some(a => a.includes("crítica") || a.includes("grave")) ? 'red' : 'yellow',
      itens: alertas.slice(0, 5)
    });
  }

  return {
    tipo_dashboard: 'status_paciente',
    paciente_id: patientId,
    titulo: `Status do Paciente • ${patient.leito} • ${patient.nome}`,
    blocos,
    disclaimer: "Dados atualizados em tempo quase real. Avaliação clínica necessária."
  };
}

/**
 * 2. Evolução 24h (ROUND / PASSAGEM)
 */
export function buildEvolucao24h(patientId: string): MicroDashboardPayload {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }

  const riskScore = calculateRiskScore(patient);
  const riskLevel = riskLevelFromScore(riskScore);
  const riskPercent = Math.round(patient.riscoMortality24h * 100);
  
  // Simulação de tendência (determinística baseada em patientId)
  const trend = riskPercent >= 60 ? 'piorou' : riskPercent <= 30 ? 'melhorou' : 'estável';
  
  const resumo24h = trend === 'piorou' 
    ? `Paciente apresentou piora nas últimas 24h. Risco atual: ${riskPercent}%. Necessário ajuste de terapêutica.`
    : trend === 'melhorou'
    ? `Evolução favorável nas últimas 24h. Risco atual: ${riskPercent}%. Mantém monitorização.`
    : `Evolução estável nas últimas 24h. Risco atual: ${riskPercent}%.`;

  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  const pcr = patient.labResults.find(l => l.tipo === "pcr");
  
  const blocos: DashboardBlock[] = [
    {
      titulo: "Resumo 24h",
      nivel_alerta: trend === 'piorou' ? 'red' : trend === 'melhorou' ? 'green' : 'yellow',
      texto: resumo24h
    },
    {
      titulo: "Tendência de Vitais",
      nivel_alerta: trend === 'piorou' ? 'red' : 'yellow',
      sparklines: [
        {
          nome: "PAM",
          valor_atual: patient.vitalSigns.pressaoArterialMedia,
          unidade: "mmHg",
          pontos: generateSparklinePoints(patient.vitalSigns.pressaoArterialMedia, 24, trend === 'piorou' ? 'down' : trend === 'melhorou' ? 'up' : 'stable')
        },
        {
          nome: "SpO₂",
          valor_atual: patient.vitalSigns.saturacaoO2,
          unidade: "%",
          pontos: generateSparklinePoints(patient.vitalSigns.saturacaoO2, 24, trend === 'piorou' ? 'down' : trend === 'melhorou' ? 'up' : 'stable')
        },
        lactato ? {
          nome: "Lactato",
          valor_atual: typeof lactato.valor === 'number' ? lactato.valor : 0,
          unidade: "mmol/L",
          pontos: generateSparklinePoints(typeof lactato.valor === 'number' ? lactato.valor : 0, 24, lactato.tendencia === 'subindo' ? 'up' : lactato.tendencia === 'caindo' ? 'down' : 'stable')
        } : undefined
      ].filter(Boolean) as SparklineSeries[]
    },
    {
      titulo: "Intervenções Relevantes",
      nivel_alerta: 'yellow',
      itens: [
        patient.medications.filter(m => m.ativo).map(m => `${m.nome} ${m.dose} ${m.unidade}`).join('; ') || 'Sem medicações ativas',
        patient.ventilationParams ? `VM: ${patient.ventilationParams.modo} | PEEP: ${patient.ventilationParams.peep}cmH₂O` : 'Sem VM'
      ]
    },
    {
      titulo: "Exames Alterados",
      nivel_alerta: patient.labResults.some(l => l.critico) ? 'red' : 'yellow',
      itens: patient.labResults
        .filter(l => l.critico || (l.tipo === "lactato" && typeof l.valor === 'number' && l.valor > 2))
        .slice(0, 5)
        .map(l => `${l.nome}: ${l.valor} ${l.unidade} ${l.tendencia === 'subindo' ? '(↑)' : l.tendencia === 'caindo' ? '(↓)' : ''}`)
    }
  ];

  return {
    tipo_dashboard: 'evolucao_24h',
    paciente_id: patientId,
    titulo: `Evolução 24h • ${patient.leito} • ${patient.nome}`,
    blocos,
    disclaimer: "Comparação com dados de 24h atrás. Valores aproximados."
  };
}

/**
 * 3. Suporte Respiratório
 */
export function buildSuporteRespiratorio(patientId: string): MicroDashboardPayload {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }

  const hasVM = !!patient.ventilationParams;
  
  if (!hasVM) {
    return {
      tipo_dashboard: 'suporte_respiratorio',
      paciente_id: patientId,
      titulo: `Suporte Respiratório • ${patient.leito} • ${patient.nome}`,
      blocos: [{
        titulo: "Status",
        nivel_alerta: 'green',
        texto: "Paciente sem ventilação mecânica. SpO₂ estável."
      }],
      disclaimer: "Avaliação clínica para indicação de suporte ventilatório."
    };
  }

  const vm = patient.ventilationParams!;
  const paO2FiO2 = vm.paO2FiO2 || 180;
  const pressaoSuporte = vm.pressaoSuporte || 0;
  const desmamePos = paO2FiO2 > 200 && pressaoSuporte <= 12 && vm.peep <= 8;
  
  const blocos: DashboardBlock[] = [
    {
      titulo: "Parâmetros Atuais",
      nivel_alerta: paO2FiO2 < 200 ? 'red' : paO2FiO2 < 300 ? 'yellow' : 'green',
      itens: [
        `Modo: ${vm.modo}`,
        `FiO₂: ${vm.fiO2}%`,
        `PEEP: ${vm.peep} cmH₂O`,
        `Pressão Suporte: ${pressaoSuporte} cmH₂O`,
        `Volume Corrente: ${vm.volumeCorrente} ml/kg`,
        `FR: ${vm.frequenciaRespiratoria} irpm`,
        `PaO₂/FiO₂: ${paO2FiO2}`
      ]
    },
    {
      titulo: "Tendência Ventilatória",
      nivel_alerta: 'yellow',
      sparklines: [
        {
          nome: "FiO₂",
          valor_atual: vm.fiO2,
          unidade: "%",
          pontos: generateSparklinePoints(vm.fiO2, 24, desmamePos ? 'down' : 'stable')
        },
        {
          nome: "PEEP",
          valor_atual: vm.peep,
          unidade: "cmH₂O",
          pontos: generateSparklinePoints(vm.peep, 24, desmamePos ? 'down' : 'stable')
        }
      ]
    },
    {
      titulo: "Gasometria",
      nivel_alerta: paO2FiO2 < 200 ? 'red' : 'yellow',
      itens: [
        `PaO₂/FiO₂: ${paO2FiO2} (${paO2FiO2 < 200 ? 'Grave' : paO2FiO2 < 300 ? 'Moderada' : 'Leve'} SDRA)`,
        `SpO₂: ${patient.vitalSigns.saturacaoO2}%`
      ]
    },
    {
      titulo: "Checklist de Desmame Pediátrico",
      nivel_alerta: desmamePos ? 'green' : 'yellow',
      itens: [
        desmamePos ? "✓ PaO₂/FiO₂ > 200" : "✗ PaO₂/FiO₂ < 200",
        pressaoSuporte <= 12 ? "✓ Pressão Suporte ≤ 12" : "✗ Pressão Suporte > 12",
        vm.peep <= 8 ? "✓ PEEP ≤ 8" : "✗ PEEP > 8",
        patient.vitalSigns.frequenciaRespiratoria <= 40 ? "✓ FR ≤ 40" : "✗ FR > 40",
        !patient.medications.some(m => m.tipo === "vasopressor" && m.ativo) ? "✓ Sem vasopressor" : "✗ Com vasopressor"
      ]
    }
  ];

  return {
    tipo_dashboard: 'suporte_respiratorio',
    paciente_id: patientId,
    titulo: `Suporte Respiratório • ${patient.leito} • ${patient.nome}`,
    blocos,
    disclaimer: "Avaliação clínica sempre necessária antes de iniciar desmame."
  };
}

/**
 * 4. Risco e Scores
 */
export function buildRiscoScores(patientId: string): MicroDashboardPayload {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }

  const riskScore = calculateRiskScore(patient);
  const riskLevel = riskLevelFromScore(riskScore);
  const risk24h = Math.round(patient.riscoMortality24h * 100);
  const risk7d = Math.round(patient.riscoMortality7d * 100);
  
  const fatoresRisco: string[] = [];
  if (patient.vitalSigns.pressaoArterialMedia < 55) fatoresRisco.push("Hipotensão (PAM < 55)");
  if (patient.vitalSigns.saturacaoO2 < 92) fatoresRisco.push("Hipoxemia grave");
  if (patient.medications.some(m => m.tipo === "vasopressor" && m.ativo)) fatoresRisco.push("Uso de vasopressor");
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  if (lactato && typeof lactato.valor === "number" && lactato.valor > 3) fatoresRisco.push(`Lactato elevado (${lactato.valor})`);
  if (patient.fluidBalance.diurese < 1) fatoresRisco.push("Oligúria");
  if (!!patient.ventilationParams) fatoresRisco.push("Ventilação mecânica");
  
  const blocos: DashboardBlock[] = [
    {
      titulo: "Score Atual",
      nivel_alerta: riskLevel === 'alto' ? 'red' : riskLevel === 'moderado' ? 'yellow' : 'green',
      itens: [
        `Risco 24h: ${risk24h}%`,
        `Risco 7d: ${risk7d}%`,
        `Score Calculado: ${(riskScore * 100).toFixed(0)}%`
      ],
      sparklines: [
        {
          nome: "Risco 24h",
          valor_atual: risk24h,
          unidade: "%",
          pontos: generateSparklinePoints(risk24h, 24, risk24h >= 60 ? 'up' : 'down')
        }
      ]
    },
    {
      titulo: "Risco Estimado",
      nivel_alerta: riskLevel === 'alto' ? 'red' : 'yellow',
      texto: riskLevel === 'alto' 
        ? `Alto risco de mortalidade nas próximas 12-24h (${risk24h}%). Requer intervenção imediata.`
        : riskLevel === 'moderado'
        ? `Risco moderado (${risk24h}%). Monitorização intensiva necessária.`
        : `Risco baixo (${risk24h}%). Evolução favorável.`
    },
    {
      titulo: "Fatores que Mais Pesam",
      nivel_alerta: fatoresRisco.length > 3 ? 'red' : fatoresRisco.length > 1 ? 'yellow' : 'green',
      itens: fatoresRisco.slice(0, 6)
    }
  ];

  return {
    tipo_dashboard: 'risco_scores',
    paciente_id: patientId,
    titulo: `Risco e Scores • ${patient.leito} • ${patient.nome}`,
    blocos,
    disclaimer: "Scores são estimativas baseadas em modelos preditivos. Não substituem avaliação clínica."
  };
}

/**
 * 5. Antibiótico / Infecção
 */
export function buildAntibioticoInfeccao(patientId: string): MicroDashboardPayload {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }

  const antibioticos = patient.medications.filter(m => m.tipo === "antibiotico" && m.ativo);
  const pcr = patient.labResults.find(l => l.tipo === "pcr");
  const leucocitos = patient.labResults.find(l => l.tipo === "hemograma");
  const culturas = patient.labResults.filter(l => l.nome.toLowerCase().includes("cultura"));
  
  const blocos: DashboardBlock[] = [
    {
      titulo: "Diagnóstico Infeccioso",
      nivel_alerta: antibioticos.length > 0 ? 'yellow' : 'green',
      texto: patient.diagnosticoPrincipal.includes("infecc") || patient.diagnosticoPrincipal.includes("sepse")
        ? patient.diagnosticoPrincipal
        : "Sem diagnóstico infeccioso principal documentado."
    },
    {
      titulo: "Antibióticos (Dn)",
      nivel_alerta: antibioticos.length > 0 ? 'yellow' : 'green',
      itens: antibioticos.length > 0
        ? antibioticos.map(ab => `${ab.nome} ${ab.dose} ${ab.unidade} | D${ab.diasDeUso}`)
        : ["Sem antibioticoterapia ativa"]
    },
    {
      titulo: "Culturas",
      nivel_alerta: 'yellow',
      itens: culturas.length > 0
        ? culturas.map(c => `${c.nome}: ${c.valor || 'Pendente'}`)
        : ["Sem culturas recentes"]
    },
    {
      titulo: "Marcadores Inflamatórios",
      nivel_alerta: pcr && typeof pcr.valor === 'number' && pcr.valor > 100 ? 'red' : pcr && typeof pcr.valor === 'number' && pcr.valor > 50 ? 'yellow' : 'green',
      itens: [
        pcr ? `PCR: ${pcr.valor} ${pcr.unidade || 'mg/L'}` : "PCR: Não disponível",
        leucocitos ? `Leucócitos: ${leucocitos.valor} ${leucocitos.unidade || ''}` : "Leucócitos: Não disponível"
      ],
      sparklines: pcr && typeof pcr.valor === 'number' ? [
        {
          nome: "PCR",
          valor_atual: pcr.valor,
          unidade: pcr.unidade || "mg/L",
          pontos: generateSparklinePoints(pcr.valor, 48, pcr.tendencia === 'subindo' ? 'up' : pcr.tendencia === 'caindo' ? 'down' : 'stable')
        }
      ] : undefined
    }
  ];

  const sugestao = antibioticos.length > 0 
    ? `Antibioticoterapia em curso. Reavaliar após resultados de culturas e resposta clínica.`
    : `Considerar antibioticoterapia empírica se houver suspeita infecciosa.`;

  blocos.push({
    titulo: "Sugestão",
    nivel_alerta: 'yellow',
    texto: sugestao
  });

  return {
    tipo_dashboard: 'antibiotico_infeccao',
    paciente_id: patientId,
    titulo: `Antibiótico / Infecção • ${patient.leito} • ${patient.nome}`,
    blocos,
    disclaimer: "Recomendações baseadas em protocolos. Sempre revisar com farmácia clínica."
  };
}

/**
 * 6. Resumo para Família
 */
export function buildResumoFamilia(patientId: string): MicroDashboardPayload {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }

  const riskPercent = Math.round(patient.riscoMortality24h * 100);
  const hasVM = !!patient.ventilationParams;
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  
  const situacao = riskPercent >= 60
    ? `${patient.nome} está em situação grave e requer cuidados intensivos. A equipe está monitorando de perto.`
    : riskPercent >= 30
    ? `${patient.nome} está estável mas requer monitorização constante. A equipe está acompanhando a evolução.`
    : `${patient.nome} está estável e apresentando melhora. A equipe continua acompanhando.`;

  const mudancas = [
    hasVM ? "Está com suporte respiratório (respirador) para ajudar na respiração." : "Respiração estável.",
    hasVaso ? "Recebe medicação para manter a pressão arterial estável." : "Pressão arterial estável.",
    riskPercent < 50 ? "Evolução favorável nas últimas horas." : "Situação ainda requer atenção especial."
  ];

  const proximosPassos = [
    "Manter monitorização contínua dos sinais vitais",
    riskPercent >= 60 ? "Ajustar medicações conforme necessário" : "Acompanhar evolução clínica",
    hasVM ? "Avaliar possibilidade de redução do suporte respiratório" : "Manter cuidado preventivo"
  ];

  return {
    tipo_dashboard: 'resumo_familia',
    paciente_id: patientId,
    titulo: `Resumo para a Família • ${patient.leito} • ${patient.nome}`,
    blocos: [
      {
        titulo: "Situação Geral",
        nivel_alerta: riskPercent >= 60 ? 'red' : riskPercent >= 30 ? 'yellow' : 'green',
        texto: situacao
      },
      {
        titulo: "O que Mudou",
        nivel_alerta: 'yellow',
        itens: mudancas
      },
      {
        titulo: "Próximos Passos",
        nivel_alerta: 'green',
        itens: proximosPassos
      }
    ],
    disclaimer: "Este resumo é uma versão simplificada para comunicação com familiares. Para informações detalhadas, consulte a equipe médica."
  };
}

/**
 * Mapa de intents para builders
 */
export const dashboardBuilders = {
  'status_paciente': buildStatusPaciente,
  'evolucao_24h': buildEvolucao24h,
  'suporte_respiratorio': buildSuporteRespiratorio,
  'risco_scores': buildRiscoScores,
  'antibiotico_infeccao': buildAntibioticoInfeccao,
  'resumo_familia': buildResumoFamilia
};

