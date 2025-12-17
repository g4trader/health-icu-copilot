import type { MockPatientSnapshot } from "@/types/MockPatientSnapshot";
import type { MockPatientHistory } from "@/types/MockPatientHistory";
import { getPatientSnapshotById } from "./mockPatients/snapshots";
import { getPatientHistoryById } from "./mockPatients/history";
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
 * Converte TimeSeries para SparklineSeries
 */
function timeSeriesToSparklineSeries(
  timeSeries: { key: string; unit: string; points: { t: string; v: number }[] },
  name: string
): SparklineSeries {
  const currentPoint = timeSeries.points.find(p => p.t === 'agora') || timeSeries.points[timeSeries.points.length - 1];
  
  return {
    nome: name,
    valor_atual: currentPoint.v,
    unidade: timeSeries.unit,
    pontos: timeSeries.points.map(p => ({ t: p.t, v: p.v }))
  };
}

/**
 * Calcula score de risco baseado em snapshot
 */
function calculateRiskScoreFromSnapshot(snapshot: MockPatientSnapshot): number {
  let score = 0;

  // Instabilidade de sinais vitais
  if (snapshot.vitalSigns.pressaoArterialMedia < 65) score += 0.25;
  if (snapshot.vitalSigns.frequenciaCardiaca > 150 || snapshot.vitalSigns.frequenciaCardiaca < 60) score += 0.15;
  if (snapshot.vitalSigns.temperatura > 38.5 || snapshot.vitalSigns.temperatura < 36) score += 0.1;
  if (snapshot.vitalSigns.saturacaoO2 < 92) score += 0.2;

  // Uso de droga vasoativa
  const temVasopressor = snapshot.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  if (temVasopressor) score += 0.25;

  // Ventilação mecânica
  if (snapshot.ventilationParams) score += 0.15;

  // Lactato elevado
  const lactato = snapshot.labResults.find(l => l.tipo === "lactato");
  if (lactato && typeof lactato.valor === "number" && lactato.valor >= 3) score += 0.2;
  if (lactato && lactato.tendencia === "subindo") score += 0.15;

  // Tendência negativa
  if (snapshot.fluidBalance.balanco24h > 5) score += 0.1;
  if (snapshot.fluidBalance.diurese < 1) score += 0.15;

  return Math.min(score, 1.0);
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
 * Usa snapshot para dados atuais
 */
export function buildStatusPaciente(patientId: string): MicroDashboardPayload {
  const snapshot = getPatientSnapshotById(patientId);
  if (!snapshot) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }

  const riskScore = calculateRiskScoreFromSnapshot(snapshot);
  const riskLevel = riskLevelFromScore(riskScore);
  const riskPercent = Math.round(snapshot.riscoMortality24h * 100);
  
  const hasVM = !!snapshot.ventilationParams;
  const hasVaso = snapshot.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  
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
      nivel_alerta: snapshot.vitalSigns.saturacaoO2 < 92 ? 'red' : snapshot.vitalSigns.saturacaoO2 < 95 ? 'yellow' : 'green',
      itens: [
        `SpO₂: ${snapshot.vitalSigns.saturacaoO2}%`,
        `FR: ${snapshot.vitalSigns.frequenciaRespiratoria} irpm`,
        hasVM ? `VM: ${snapshot.ventilationParams?.modo} | FiO₂: ${snapshot.ventilationParams?.fiO2}% | PEEP: ${snapshot.ventilationParams?.peep}cmH₂O` : 'Sem ventilação mecânica'
      ],
      sparklines: (() => {
        const history = getPatientHistoryById(patientId);
        if (!history) return undefined;
        
        const spo2Series = history.series_24h.find(s => s.key === 'spo2');
        const frSeries = history.series_24h.find(s => s.key === 'fr');
        
        return [
          spo2Series ? timeSeriesToSparklineSeries(spo2Series, 'SpO₂') : undefined,
          frSeries ? timeSeriesToSparklineSeries(frSeries, 'FR') : undefined
        ].filter(Boolean) as SparklineSeries[];
      })()
    },
    {
      titulo: "Hemodinâmica",
      nivel_alerta: getAlertLevel(snapshot.vitalSigns.pressaoArterialMedia, { green: 60, yellow: 55, red: 50 }, false),
      itens: [
        `PAM: ${snapshot.vitalSigns.pressaoArterialMedia} mmHg`,
        `FC: ${snapshot.vitalSigns.frequenciaCardiaca} bpm`,
        hasVaso ? `Vasopressor: ${snapshot.medications.find(m => m.tipo === "vasopressor" && m.ativo)?.nome} ${snapshot.medications.find(m => m.tipo === "vasopressor" && m.ativo)?.dose} ${snapshot.medications.find(m => m.tipo === "vasopressor" && m.ativo)?.unidade}` : 'Sem vasopressor'
      ],
      sparklines: (() => {
        const history = getPatientHistoryById(patientId);
        if (!history) return undefined;
        
        const pamSeries = history.series_24h.find(s => s.key === 'pam');
        return pamSeries ? [timeSeriesToSparklineSeries(pamSeries, 'PAM')] : undefined;
      })()
    },
    {
      titulo: "Rim / Balanço",
      nivel_alerta: snapshot.fluidBalance.diurese < 1 ? 'red' : snapshot.fluidBalance.diurese < 2 ? 'yellow' : 'green',
      itens: [
        `Diurese: ${snapshot.fluidBalance.diurese} ml/kg/h`,
        `Balanço 24h: ${snapshot.fluidBalance.balanco24h > 0 ? '+' : ''}${snapshot.fluidBalance.balanco24h.toFixed(1)} ml/kg/h`,
        `Temperatura: ${snapshot.vitalSigns.temperatura.toFixed(1)}°C`
      ]
    }
  ];

  // Alertas (máx 5)
  const alertas: string[] = [];
  if (snapshot.vitalSigns.pressaoArterialMedia < 55) alertas.push("Hipotensão crítica (PAM < 55 mmHg)");
  if (snapshot.vitalSigns.saturacaoO2 < 92) alertas.push("Hipoxemia grave (SpO₂ < 92%)");
  const lactato = snapshot.labResults.find(l => l.tipo === "lactato");
  if (lactato && typeof lactato.valor === "number" && lactato.valor > 3) alertas.push(`Lactato elevado: ${lactato.valor} mmol/L`);
  if (snapshot.fluidBalance.diurese < 1) alertas.push("Oligúria (diurese < 1 ml/kg/h)");
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
    titulo: `Status do Paciente • ${snapshot.leito} • ${snapshot.nome}`,
    blocos,
    disclaimer: "Dados atualizados em tempo quase real. Avaliação clínica necessária."
  };
}

/**
 * 2. Evolução 24h (ROUND / PASSAGEM)
 * Usa history para séries temporais e snapshot para dados atuais
 */
export function buildEvolucao24h(patientId: string): MicroDashboardPayload {
  const snapshot = getPatientSnapshotById(patientId);
  const history = getPatientHistoryById(patientId);
  
  if (!snapshot) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }
  
  if (!history) {
    throw new Error(`Histórico do paciente ${patientId} não encontrado`);
  }

  const riskScore = calculateRiskScoreFromSnapshot(snapshot);
  const riskLevel = riskLevelFromScore(riskScore);
  const riskPercent = Math.round(snapshot.riscoMortality24h * 100);
  
  // Determinar tendência baseada nas séries temporais
  const pamSeries = history.series_24h.find(s => s.key === 'pam');
  const spo2Series = history.series_24h.find(s => s.key === 'spo2');
  
  let trend: 'piorou' | 'melhorou' | 'estável' = 'estável';
  if (pamSeries && pamSeries.points.length >= 2) {
    const first = pamSeries.points[0].v;
    const last = pamSeries.points[pamSeries.points.length - 1].v;
    if (last < first - 5) trend = 'piorou';
    else if (last > first + 5) trend = 'melhorou';
  }
  
  const resumo24h = trend === 'piorou' 
    ? `Paciente apresentou piora nas últimas 24h. Risco atual: ${riskPercent}%. Necessário ajuste de terapêutica.`
    : trend === 'melhorou'
    ? `Evolução favorável nas últimas 24h. Risco atual: ${riskPercent}%. Mantém monitorização.`
    : `Evolução estável nas últimas 24h. Risco atual: ${riskPercent}%.`;

  const lactato = snapshot.labResults.find(l => l.tipo === "lactato");
  const pcr = snapshot.labResults.find(l => l.tipo === "pcr");
  
  const blocos: DashboardBlock[] = [
    {
      titulo: "Resumo 24h",
      nivel_alerta: trend === 'piorou' ? 'red' : trend === 'melhorou' ? 'green' : 'yellow',
      texto: resumo24h
    },
    {
      titulo: "Tendência de Vitais",
      nivel_alerta: trend === 'piorou' ? 'red' : 'yellow',
      sparklines: (() => {
        const sparklines: SparklineSeries[] = [];
        
        const pamSeries = history.series_24h.find(s => s.key === 'pam');
        if (pamSeries) sparklines.push(timeSeriesToSparklineSeries(pamSeries, 'PAM'));
        
        const spo2Series = history.series_24h.find(s => s.key === 'spo2');
        if (spo2Series) sparklines.push(timeSeriesToSparklineSeries(spo2Series, 'SpO₂'));
        
        const lactatoSeries = history.series_72h.find(s => s.key === 'lactato');
        if (lactatoSeries) sparklines.push(timeSeriesToSparklineSeries(lactatoSeries, 'Lactato'));
        
        return sparklines;
      })()
    },
    {
      titulo: "Intervenções Relevantes",
      nivel_alerta: 'yellow',
      itens: [
        snapshot.medications.filter(m => m.ativo).map(m => `${m.nome} ${m.dose} ${m.unidade}`).join('; ') || 'Sem medicações ativas',
        snapshot.ventilationParams ? `VM: ${snapshot.ventilationParams.modo} | PEEP: ${snapshot.ventilationParams.peep}cmH₂O` : 'Sem VM'
      ]
    },
    {
      titulo: "Exames Alterados",
      nivel_alerta: snapshot.labResults.some(l => l.critico) ? 'red' : 'yellow',
      itens: snapshot.labResults
        .filter(l => l.critico || (l.tipo === "lactato" && typeof l.valor === 'number' && l.valor > 2))
        .slice(0, 5)
        .map(l => `${l.nome}: ${l.valor} ${l.unidade} ${l.tendencia === 'subindo' ? '(↑)' : l.tendencia === 'caindo' ? '(↓)' : ''}`)
    }
  ];

  return {
    tipo_dashboard: 'evolucao_24h',
    paciente_id: patientId,
    titulo: `Evolução 24h • ${snapshot.leito} • ${snapshot.nome}`,
    blocos,
    disclaimer: "Comparação com dados de 24h atrás. Valores aproximados."
  };
}

/**
 * 3. Suporte Respiratório
 * Usa snapshot para parâmetros atuais e history para tendências
 */
export function buildSuporteRespiratorio(patientId: string): MicroDashboardPayload {
  const snapshot = getPatientSnapshotById(patientId);
  const history = getPatientHistoryById(patientId);
  
  if (!snapshot) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }

  const hasVM = !!snapshot.ventilationParams;
  
  if (!hasVM) {
    return {
      tipo_dashboard: 'suporte_respiratorio',
      paciente_id: patientId,
      titulo: `Suporte Respiratório • ${snapshot.leito} • ${snapshot.nome}`,
      blocos: [{
        titulo: "Status",
        nivel_alerta: 'green',
        texto: "Paciente sem ventilação mecânica. SpO₂ estável."
      }],
      disclaimer: "Avaliação clínica para indicação de suporte ventilatório."
    };
  }

  const vm = snapshot.ventilationParams!;
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
      sparklines: history ? (() => {
        const sparklines: SparklineSeries[] = [];
        
        const fio2Series = history.series_24h.find(s => s.key === 'fio2');
        if (fio2Series) sparklines.push(timeSeriesToSparklineSeries(fio2Series, 'FiO₂'));
        
        const peepSeries = history.series_24h.find(s => s.key === 'peep');
        if (peepSeries) sparklines.push(timeSeriesToSparklineSeries(peepSeries, 'PEEP'));
        
        return sparklines;
      })() : undefined
    },
    {
      titulo: "Gasometria",
      nivel_alerta: paO2FiO2 < 200 ? 'red' : 'yellow',
      itens: [
        `PaO₂/FiO₂: ${paO2FiO2} (${paO2FiO2 < 200 ? 'Grave' : paO2FiO2 < 300 ? 'Moderada' : 'Leve'} SDRA)`,
        `SpO₂: ${snapshot.vitalSigns.saturacaoO2}%`
      ]
    },
    {
      titulo: "Checklist de Desmame Pediátrico",
      nivel_alerta: desmamePos ? 'green' : 'yellow',
      itens: [
        desmamePos ? "✓ PaO₂/FiO₂ > 200" : "✗ PaO₂/FiO₂ < 200",
        pressaoSuporte <= 12 ? "✓ Pressão Suporte ≤ 12" : "✗ Pressão Suporte > 12",
        vm.peep <= 8 ? "✓ PEEP ≤ 8" : "✗ PEEP > 8",
        snapshot.vitalSigns.frequenciaRespiratoria <= 40 ? "✓ FR ≤ 40" : "✗ FR > 40",
        !snapshot.medications.some(m => m.tipo === "vasopressor" && m.ativo) ? "✓ Sem vasopressor" : "✗ Com vasopressor"
      ]
    }
  ];

  return {
    tipo_dashboard: 'suporte_respiratorio',
    paciente_id: patientId,
    titulo: `Suporte Respiratório • ${snapshot.leito} • ${snapshot.nome}`,
    blocos,
    disclaimer: "Avaliação clínica sempre necessária antes de iniciar desmame."
  };
}

/**
 * 4. Risco e Scores
 * Usa snapshot para dados atuais e history para tendência de risco
 */
export function buildRiscoScores(patientId: string): MicroDashboardPayload {
  const snapshot = getPatientSnapshotById(patientId);
  const history = getPatientHistoryById(patientId);
  
  if (!snapshot) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }

  const riskScore = calculateRiskScoreFromSnapshot(snapshot);
  const riskLevel = riskLevelFromScore(riskScore);
  const risk24h = Math.round(snapshot.riscoMortality24h * 100);
  const risk7d = Math.round(snapshot.riscoMortality7d * 100);
  
  const fatoresRisco: string[] = [];
  if (snapshot.vitalSigns.pressaoArterialMedia < 55) fatoresRisco.push("Hipotensão (PAM < 55)");
  if (snapshot.vitalSigns.saturacaoO2 < 92) fatoresRisco.push("Hipoxemia grave");
  if (snapshot.medications.some(m => m.tipo === "vasopressor" && m.ativo)) fatoresRisco.push("Uso de vasopressor");
  const lactato = snapshot.labResults.find(l => l.tipo === "lactato");
  if (lactato && typeof lactato.valor === "number" && lactato.valor > 3) fatoresRisco.push(`Lactato elevado (${lactato.valor})`);
  if (snapshot.fluidBalance.diurese < 1) fatoresRisco.push("Oligúria");
  if (!!snapshot.ventilationParams) fatoresRisco.push("Ventilação mecânica");
  
  const blocos: DashboardBlock[] = [
    {
      titulo: "Score Atual",
      nivel_alerta: riskLevel === 'alto' ? 'red' : riskLevel === 'moderado' ? 'yellow' : 'green',
      itens: [
        `Risco 24h: ${risk24h}%`,
        `Risco 7d: ${risk7d}%`,
        `Score Calculado: ${(riskScore * 100).toFixed(0)}%`
      ],
      sparklines: undefined // Risco não tem série temporal direta, mas pode ser calculado
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
    titulo: `Risco e Scores • ${snapshot.leito} • ${snapshot.nome}`,
    blocos,
    disclaimer: "Scores são estimativas baseadas em modelos preditivos. Não substituem avaliação clínica."
  };
}

/**
 * 5. Antibiótico / Infecção
 * Usa snapshot para dados atuais e history para tendência de PCR
 */
export function buildAntibioticoInfeccao(patientId: string): MicroDashboardPayload {
  const snapshot = getPatientSnapshotById(patientId);
  const history = getPatientHistoryById(patientId);
  
  if (!snapshot) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }

  const antibioticos = snapshot.medications.filter(m => m.tipo === "antibiotico" && m.ativo);
  const pcr = snapshot.labResults.find(l => l.tipo === "pcr");
  const leucocitos = snapshot.labResults.find(l => l.tipo === "hemograma");
  const culturas = snapshot.labResults.filter(l => l.nome.toLowerCase().includes("cultura"));
  
  const blocos: DashboardBlock[] = [
    {
      titulo: "Diagnóstico Infeccioso",
      nivel_alerta: antibioticos.length > 0 ? 'yellow' : 'green',
      texto: snapshot.diagnosticoPrincipal.includes("infecc") || snapshot.diagnosticoPrincipal.includes("sepse")
        ? snapshot.diagnosticoPrincipal
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
      sparklines: history ? (() => {
        const pcrSeries = history.series_72h.find(s => s.key === 'pcr');
        return pcrSeries ? [timeSeriesToSparklineSeries(pcrSeries, 'PCR')] : undefined;
      })() : undefined
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
    titulo: `Antibiótico / Infecção • ${snapshot.leito} • ${snapshot.nome}`,
    blocos,
    disclaimer: "Recomendações baseadas em protocolos. Sempre revisar com farmácia clínica."
  };
}

/**
 * 6. Resumo para Família
 * Usa snapshot para dados atuais
 */
export function buildResumoFamilia(patientId: string): MicroDashboardPayload {
  const snapshot = getPatientSnapshotById(patientId);
  if (!snapshot) {
    throw new Error(`Paciente ${patientId} não encontrado`);
  }

  const riskPercent = Math.round(snapshot.riscoMortality24h * 100);
  const hasVM = !!snapshot.ventilationParams;
  const hasVaso = snapshot.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  
  const situacao = riskPercent >= 60
    ? `${snapshot.nome} está em situação grave e requer cuidados intensivos. A equipe está monitorando de perto.`
    : riskPercent >= 30
    ? `${snapshot.nome} está estável mas requer monitorização constante. A equipe está acompanhando a evolução.`
    : `${snapshot.nome} está estável e apresentando melhora. A equipe continua acompanhando.`;

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
    titulo: `Resumo para a Família • ${snapshot.leito} • ${snapshot.nome}`,
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

