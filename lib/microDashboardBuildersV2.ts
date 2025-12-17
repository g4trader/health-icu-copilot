import type { Patient } from "@/types/Patient";
import type { MicroDashboard, MicroDashboardBlock, MicroDashboardType } from "@/types/MicroDashboardV2";
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
 * Constrói todos os dashboards para um paciente
 */
export function buildAllDashboards(patient: Patient): MicroDashboard[] {
  return [
    buildStatusGlobalDashboard(patient),
    buildRespiratorioDashboard(patient),
    buildHemodinamicoDashboard(patient),
    buildLabsCriticosDashboard(patient),
    buildInfeccaoDashboard(patient)
  ];
}

