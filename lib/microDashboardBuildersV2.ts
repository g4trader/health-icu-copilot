import type { Patient } from "@/types/Patient";
import type { MicroDashboard, MicroDashboardBlock, MicroDashboardType } from "@/types/MicroDashboardV2";
import type { RadiologyReportSummary } from "@/types/RadiologyOpinion";
import { calculateRiskScore, riskLevelFromScore, type RiskLevel } from "@/lib/mockData";

/**
 * Constrói dashboard de status global
 */
export function buildStatusGlobalDashboard(patient: Patient): MicroDashboard {
  const riskScore = calculateRiskScore(patient);
  const riskLevel = riskLevelFromScore(riskScore);
  const riskPercent24h = Math.round(patient.riscoMortality24h * 100);
  
  const hasVM = !!patient.ventilationParams;
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  
  const blocks: MicroDashboardBlock[] = [
    {
      titulo: "Sinais Vitais",
      tipo: "kpi",
      itens: [
        `PAM: ${patient.vitalSigns.pressaoArterialMedia} mmHg`,
        `FC: ${patient.vitalSigns.frequenciaCardiaca} bpm`,
        `SpO₂: ${patient.vitalSigns.saturacaoO2}%`,
        `FR: ${patient.vitalSigns.frequenciaRespiratoria} irpm`,
        `Temp: ${patient.vitalSigns.temperatura.toFixed(1)}°C`
      ]
    },
    {
      titulo: "Suporte",
      tipo: "lista",
      itens: [
        hasVM ? `VM: ${patient.ventilationParams?.modo} | FiO₂: ${patient.ventilationParams?.fiO2}% | PEEP: ${patient.ventilationParams?.peep}cmH₂O` : "Sem ventilação mecânica",
        hasVaso ? `Vasopressor: ${patient.medications.find(m => m.tipo === "vasopressor" && m.ativo)?.nome} ${patient.medications.find(m => m.tipo === "vasopressor" && m.ativo)?.dose} ${patient.medications.find(m => m.tipo === "vasopressor" && m.ativo)?.unidade}` : "Sem vasopressor"
      ]
    },
    {
      titulo: "Balanço Hídrico",
      tipo: "kpi",
      itens: [
        `Diurese: ${patient.fluidBalance.diurese} ml/kg/h`,
        `Balanço 24h: ${patient.fluidBalance.balanco24h > 0 ? '+' : ''}${patient.fluidBalance.balanco24h.toFixed(1)} ml/kg/h`
      ]
    }
  ];
  
  return {
    tipo: "status_global",
    titulo: `Status Global • ${patient.leito} • ${patient.nome}`,
    subtitulo: `Risco 24h: ${riskPercent24h}%`,
    riskLevel,
    riskPercent24h,
    blocks
  };
}

/**
 * Constrói dashboard respiratório
 */
export function buildRespiratorioDashboard(patient: Patient): MicroDashboard {
  const riskScore = calculateRiskScore(patient);
  const riskLevel = riskLevelFromScore(riskScore);
  const riskPercent24h = Math.round(patient.riscoMortality24h * 100);
  
  const hasVM = !!patient.ventilationParams;
  
  const blocks: MicroDashboardBlock[] = [];
  
  if (hasVM && patient.ventilationParams) {
    const vm = patient.ventilationParams;
    const paO2FiO2 = vm.paO2FiO2 || 180;
    
    blocks.push({
      titulo: "Parâmetros Ventilatórios",
      tipo: "kpi",
      itens: [
        `Modo: ${vm.modo}`,
        `FiO₂: ${vm.fiO2}%`,
        `PEEP: ${vm.peep} cmH₂O`,
        vm.pressaoSuporte ? `Pressão Suporte: ${vm.pressaoSuporte} cmH₂O` : "",
        `Volume Corrente: ${vm.volumeCorrente} ml/kg`,
        `FR: ${vm.frequenciaRespiratoria} irpm`,
        `PaO₂/FiO₂: ${paO2FiO2}`
      ].filter(Boolean)
    });
    
    blocks.push({
      titulo: "Gasometria",
      tipo: "kpi",
      itens: [
        `PaO₂/FiO₂: ${paO2FiO2} (${paO2FiO2 < 200 ? 'Grave' : paO2FiO2 < 300 ? 'Moderada' : 'Leve'} SDRA)`,
        `SpO₂: ${patient.vitalSigns.saturacaoO2}%`
      ]
    });
  } else {
    blocks.push({
      titulo: "Status Respiratório",
      tipo: "lista",
      itens: [
        `SpO₂: ${patient.vitalSigns.saturacaoO2}%`,
        `FR: ${patient.vitalSigns.frequenciaRespiratoria} irpm`,
        "Sem ventilação mecânica"
      ]
    });
  }
  
  return {
    tipo: "respiratorio",
    titulo: `Suporte Respiratório • ${patient.leito} • ${patient.nome}`,
    riskLevel,
    riskPercent24h,
    blocks
  };
}

/**
 * Constrói dashboard hemodinâmico
 */
export function buildHemodinamicoDashboard(patient: Patient): MicroDashboard {
  const riskScore = calculateRiskScore(patient);
  const riskLevel = riskLevelFromScore(riskScore);
  const riskPercent24h = Math.round(patient.riscoMortality24h * 100);
  
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  const vasopressor = patient.medications.find(m => m.tipo === "vasopressor" && m.ativo);
  
  const blocks: MicroDashboardBlock[] = [
    {
      titulo: "Hemodinâmica",
      tipo: "kpi",
      itens: [
        `PAM: ${patient.vitalSigns.pressaoArterialMedia} mmHg`,
        `FC: ${patient.vitalSigns.frequenciaCardiaca} bpm`,
        hasVaso ? `Vasopressor: ${vasopressor?.nome} ${vasopressor?.dose} ${vasopressor?.unidade}` : "Sem vasopressor"
      ]
    },
    {
      titulo: "Função Renal",
      tipo: "kpi",
      itens: [
        `Diurese: ${patient.fluidBalance.diurese} ml/kg/h`,
        `Balanço 24h: ${patient.fluidBalance.balanco24h > 0 ? '+' : ''}${patient.fluidBalance.balanco24h.toFixed(1)} ml/kg/h`
      ]
    }
  ];
  
  return {
    tipo: "hemodinamico",
    titulo: `Hemodinâmica • ${patient.leito} • ${patient.nome}`,
    riskLevel,
    riskPercent24h,
    blocks
  };
}

/**
 * Constrói dashboard de laboratórios críticos
 */
export function buildLabsCriticosDashboard(patient: Patient): MicroDashboard {
  const riskScore = calculateRiskScore(patient);
  const riskLevel = riskLevelFromScore(riskScore);
  const riskPercent24h = Math.round(patient.riscoMortality24h * 100);
  
  const criticalLabs = patient.labResults.filter(l => 
    l.critico && 
    ["lactato", "pcr", "procalcitonina", "funcao_renal"].includes(l.tipo)
  );
  
  const blocks: MicroDashboardBlock[] = [];
  
  if (criticalLabs.length > 0) {
    blocks.push({
      titulo: "Exames Críticos",
      tipo: "lista",
      itens: criticalLabs.map(lab => {
        const trend = lab.tendencia === 'subindo' ? '↑' : lab.tendencia === 'caindo' ? '↓' : '';
        return `${lab.nome}: ${lab.valor} ${lab.unidade} ${trend}`;
      })
    });
  } else {
    blocks.push({
      titulo: "Exames Laboratoriais",
      tipo: "lista",
      itens: ["Nenhum exame crítico no momento"]
    });
  }
  
  return {
    tipo: "labs_criticos",
    titulo: `Laboratórios Críticos • ${patient.leito} • ${patient.nome}`,
    riskLevel,
    riskPercent24h,
    blocks
  };
}

/**
 * Constrói dashboard de labs evolutivos (últimos 3)
 */
export function buildLabsEvolutivosDashboard(patient: Patient): MicroDashboard {
  const riskScore = calculateRiskScore(patient);
  const riskLevel = riskLevelFromScore(riskScore);
  
  const criticalLabs = patient.labResults ?? [];
  
  // Focus on key types
  const relevantTypes: Array<"lactato" | "pcr" | "procalcitonina" | "funcao_renal" | "hemograma"> = [
    "lactato",
    "pcr",
    "procalcitonina",
    "funcao_renal",
    "hemograma",
  ];
  
  const filtered = criticalLabs
    .filter((l) => relevantTypes.includes(l.tipo as any))
    // sort descending by date
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  
  const byType = new Map<string, typeof filtered>();
  for (const lab of filtered) {
    const list = byType.get(lab.tipo) ?? [];
    list.push(lab);
    byType.set(lab.tipo, list);
  }
  
  const itensResumo: string[] = [];
  const itensDetalhes: string[] = [];
  
  for (const [tipo, exams] of byType.entries()) {
    const lastThree = exams.slice(0, 3);
    if (!lastThree.length) continue;
    
    const atual = lastThree[0];
    const anterior = lastThree[1];
    const labelBase = atual.nome || tipo;
    
    // Determine trend text
    let tendencia: string | undefined = atual.tendencia;
    if (!tendencia && anterior && typeof atual.valor === "number" && typeof anterior.valor === "number") {
      if (atual.valor > anterior.valor * 1.1) tendencia = "subindo";
      else if (atual.valor < anterior.valor * 0.9) tendencia = "caindo";
      else tendencia = "estavel";
    }
    
    const valorAtual =
      typeof atual.valor === "number"
        ? `${atual.valor.toFixed(1)} ${atual.unidade ?? ""}`.trim()
        : String(atual.valor);
    
    const tendenciaText = tendencia === "subindo" ? "↑" : tendencia === "caindo" ? "↓" : "→";
    const resumo = `${labelBase}: ${valorAtual} ${tendenciaText} ${tendencia === "subindo" ? "(subindo)" : tendencia === "caindo" ? "(caindo)" : "(estável)"}`;
    itensResumo.push(resumo);
    
    lastThree.forEach((exam, idx) => {
      const v =
        typeof exam.valor === "number"
          ? `${exam.valor.toFixed(1)} ${exam.unidade ?? ""}`.trim()
          : String(exam.valor);
      const dateStr = new Date(exam.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const trendText = exam.tendencia 
        ? exam.tendencia === "subindo" ? "↑" : exam.tendencia === "caindo" ? "↓" : "→"
        : "";
      itensDetalhes.push(
        `${dateStr}: ${labelBase} = ${v}${trendText ? ` ${trendText}` : ""}`
      );
    });
  }
  
  // Determine risk level based on trends
  let calculatedRiskLevel: RiskLevel = "moderado";
  if (itensResumo.some((t) => t.includes("subindo") && (t.includes("Lactato") || t.includes("PCR")))) {
    calculatedRiskLevel = "alto";
  } else if (itensResumo.some((t) => t.includes("caindo"))) {
    calculatedRiskLevel = "baixo";
  }
  
  return {
    tipo: "labs_evolutivos",
    titulo: "Labs evolutivos (últimos 3)",
    subtitulo: "Foco em lactato, PCR, função renal e hemograma",
    riskLevel: calculatedRiskLevel,
    blocks: [
      {
        titulo: "Resumo por exame",
        tipo: "lista",
        itens: itensResumo.length
          ? itensResumo
          : ["Sem exames laboratoriais relevantes recentes."],
      },
      {
        titulo: "Últimos 3 por tipo",
        tipo: "lista",
        itens: itensDetalhes.length > 0 ? itensDetalhes : ["Sem histórico detalhado disponível"],
      },
    ],
  };
}

/**
 * Constrói dashboard de infecção/antibiótico
 */
export function buildInfeccaoDashboard(patient: Patient): MicroDashboard {
  const riskScore = calculateRiskScore(patient);
  const riskLevel = riskLevelFromScore(riskScore);
  const riskPercent24h = Math.round(patient.riscoMortality24h * 100);
  
  const antibioticos = patient.medications.filter(m => m.tipo === "antibiotico" && m.ativo);
  const inflammatoryLabs = patient.labResults.filter(l => 
    l.critico && 
    ["pcr", "procalcitonina"].includes(l.tipo)
  );
  
  const blocks: MicroDashboardBlock[] = [];
  
  if (antibioticos.length > 0) {
    blocks.push({
      titulo: "Antibióticos Ativos",
      tipo: "lista",
      itens: antibioticos.map(ab => `${ab.nome} ${ab.dose} ${ab.unidade} | D${ab.diasDeUso}`)
    });
  } else {
    blocks.push({
      titulo: "Antibióticos",
      tipo: "lista",
      itens: ["Sem antibioticoterapia ativa"]
    });
  }
  
  if (inflammatoryLabs.length > 0) {
    blocks.push({
      titulo: "Marcadores Inflamatórios",
      tipo: "kpi",
      itens: inflammatoryLabs.map(lab => {
        const trend = lab.tendencia === 'subindo' ? '↑' : lab.tendencia === 'caindo' ? '↓' : '';
        return `${lab.nome}: ${lab.valor} ${lab.unidade} ${trend}`;
      })
    });
  }
  
  return {
    tipo: "infeccao_antibiotico",
    titulo: `Infecção / Antibiótico • ${patient.leito} • ${patient.nome}`,
    riskLevel,
    riskPercent24h,
    blocks
  };
}

/**
 * Constrói dashboard de imagem evolutiva (últimos 3 exames)
 */
export function buildImagemEvolutivaDashboard(
  exams: RadiologyReportSummary[],
): MicroDashboard {
  // Sort by date descending
  const sorted = [...exams].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const lastThree = sorted.slice(0, 3);
  
  const itensResumo: string[] = [];
  const itensDetalhes: string[] = [];
  
  lastThree.forEach((exam) => {
    const label = `${exam.examTypeLabel} - ${exam.dateMock}`;
    itensResumo.push(`${label}: ${exam.impressionShort}`);
    itensDetalhes.push(
      `${label}: achados-chave – ${exam.keyFindings.join(", ")} | correlação: ${exam.correlationShort}`,
    );
  });
  
  // Simple heuristic: if latest impressionShort contains words like "melhora", "redução", mark as improving
  const latest = lastThree[0];
  const impression = (latest?.impressionShort ?? "").toLowerCase();
  let riskLevel: RiskLevel = "moderado";
  if (impression.includes("piora") || impression.includes("aumento") || impression.includes("pior")) {
    riskLevel = "alto";
  }
  if (impression.includes("melhora") || impression.includes("redução") || impression.includes("reduzido") || impression.includes("melhor")) {
    riskLevel = "baixo";
  }
  
  return {
    tipo: "imagem_evolutiva",
    titulo: "Imagem – últimos exames",
    subtitulo: "Últimos laudos e tendência radiológica",
    riskLevel,
    blocks: [
      {
        titulo: "Resumo recente",
        tipo: "lista",
        itens: itensResumo.length
          ? itensResumo
          : ["Sem exames de imagem recentes registrados."],
      },
      {
        titulo: "Detalhes dos últimos 3",
        tipo: "lista",
        itens: itensDetalhes.length > 0 ? itensDetalhes : ["Sem detalhes adicionais disponíveis"],
      },
    ],
  };
}

/**
 * Constrói todos os dashboards para um paciente
 */
export function buildAllDashboards(
  patient: Patient,
  radiologyReports?: RadiologyReportSummary[] | null
): MicroDashboard[] {
  const dashboards: MicroDashboard[] = [
    buildStatusGlobalDashboard(patient),
    buildRespiratorioDashboard(patient),
    buildHemodinamicoDashboard(patient),
    buildLabsCriticosDashboard(patient),
    buildInfeccaoDashboard(patient)
  ];
  
  // Adicionar labs evolutivos se houver exames
  if (patient.labResults?.length) {
    dashboards.push(buildLabsEvolutivosDashboard(patient));
  }
  
  // Adicionar imagem evolutiva se houver exames de imagem
  if (radiologyReports && radiologyReports.length > 0) {
    dashboards.push(buildImagemEvolutivaDashboard(radiologyReports));
  }
  
  return dashboards;
}

