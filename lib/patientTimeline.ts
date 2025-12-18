import type { Patient } from "@/types/Patient";
import type { DailyPatientStatus, PatientStatusGlobal } from "@/types/DailyPatientStatus";
import type { TimelineEvent, TimelineEventType, TimelineEventSeverity } from "@/types/MockPatientHistory";
import { mockPatientsRaw } from "./mockData";
import { calculateRiskScore } from "./mockData";
import { getPatientHistoryById } from "./mockPatients/history";
import { getClinicalProfile } from "./patientClinicalProfiles";

/**
 * Gera evolução de 30 dias para um paciente
 * Simula trajetória clínica plausível baseada no estado atual
 * Usa perfis clínicos quando disponíveis para maior realismo
 */
function generate30DayEvolution(patient: Patient): DailyPatientStatus[] {
  const evolution: DailyPatientStatus[] = [];
  const baseDate = new Date(patient.ultimaAtualizacao);
  const currentDiaUti = patient.diasDeUTI;
  const currentRisk = patient.riscoMortality24h;
  
  // Tentar usar perfil clínico se disponível
  const profile = getClinicalProfile(patient.id);
  
  // Calcular dia de alta (se aplicável)
  let altaDay = profile?.altaDay || 30;
  if (!profile) {
    // Fallback: determinar trajetória baseada no diagnóstico e estado atual
    const isCritical = currentRisk >= 0.65;
    const isImproving = currentRisk < 0.5 && currentDiaUti > 3;
    const hasShortStay = currentDiaUti <= 3 && currentRisk < 0.4;
    
    if (hasShortStay) {
      altaDay = currentDiaUti + 2; // Alta em 2-3 dias
    } else if (isImproving) {
      altaDay = Math.min(25, currentDiaUti + 5); // Melhora gradual
    } else if (isCritical) {
      altaDay = 30; // Permanece crítico por mais tempo
    }
  }
  
  // Calcular data de admissão (hoje menos currentDiaUti dias)
  const admissionDate = new Date(baseDate);
  admissionDate.setDate(admissionDate.getDate() - currentDiaUti + 1);
  
  // Gerar status para cada dia (30 dias totais: até max(30, altaDay) dias desde admissão)
  const maxDays = Math.max(30, altaDay);
  for (let day = 1; day <= maxDays; day++) {
    const date = new Date(admissionDate);
    date.setDate(date.getDate() + (day - 1));
    
    let statusGlobal: PatientStatusGlobal;
    let riskScore: number;
    
    // Usar perfil clínico se disponível
    if (profile) {
      const phase = profile.phases.find(p => day >= p.days[0] && day <= p.days[1]);
      if (phase) {
        statusGlobal = phase.statusGlobal;
        // Interpolar riskScore dentro do range da fase
        const [minRisk, maxRisk] = phase.riskScoreRange;
        const phaseProgress = (day - phase.days[0]) / (phase.days[1] - phase.days[0] + 1);
        riskScore = maxRisk - (phaseProgress * (maxRisk - minRisk));
      } else {
        // Fora das fases definidas: considerar se é futuro ou passado
        if (day > altaDay && day > currentDiaUti) {
          // Passou do dia de alta e já passou do dia atual = alta
          statusGlobal = "alta_uti";
          riskScore = 0.1;
        } else if (day > currentDiaUti) {
          // Dia futuro (ainda não aconteceu): usar status do último dia conhecido
          const lastPhase = profile.phases[profile.phases.length - 1];
          statusGlobal = lastPhase.statusGlobal;
          riskScore = lastPhase.riskScoreRange[0];
        } else {
          // Dentro do período esperado mas sem fase definida: usar última fase anterior
          const previousPhases = profile.phases.filter(p => p.days[1] < day);
          if (previousPhases.length > 0) {
            const lastPhase = previousPhases[previousPhases.length - 1];
            statusGlobal = lastPhase.statusGlobal;
            riskScore = lastPhase.riskScoreRange[0];
          } else {
            // Se não há fase anterior, usar primeira fase
            statusGlobal = profile.phases[0].statusGlobal;
            riskScore = profile.phases[0].riskScoreRange[0];
          }
        }
      }
    } else {
      // Fallback: lógica original
      if (day > altaDay) {
        statusGlobal = "alta_uti";
        riskScore = 0.1;
      } else if (day === altaDay) {
        statusGlobal = "alta_uti";
        riskScore = 0.15;
      } else if (day >= altaDay - 2) {
        statusGlobal = "melhora";
        riskScore = Math.max(0.2, currentRisk - 0.3);
      } else {
        const isCritical = currentRisk >= 0.65;
        if (isCritical && day <= currentDiaUti) {
          if (day <= 3) {
            statusGlobal = "critico";
            riskScore = Math.min(1.0, currentRisk + (3 - day) * 0.05);
          } else if (day <= 10) {
            statusGlobal = "grave";
            riskScore = Math.max(0.5, currentRisk - (day - 3) * 0.03);
          } else {
            statusGlobal = "estavel";
            riskScore = Math.max(0.4, currentRisk - (day - 10) * 0.02);
          }
        } else if (day <= currentDiaUti) {
          if (day <= 2) {
            statusGlobal = "grave";
            riskScore = Math.min(0.7, currentRisk + 0.1);
          } else {
            statusGlobal = "estavel";
            riskScore = Math.max(0.3, currentRisk - (day - 2) * 0.05);
          }
        } else {
          statusGlobal = day < altaDay - 5 ? "estavel" : "melhora";
          riskScore = Math.max(0.2, currentRisk - (day - currentDiaUti) * 0.03);
        }
      }
    }
    
    // Determinar fase atual (se usando perfil)
    const phase = profile?.phases.find(p => day >= p.days[0] && day <= p.days[1]);
    
    // Suporte ventilatório
    let suporteVentilatorio: DailyPatientStatus["suporteVentilatorio"] = {};
    if (phase) {
      if (phase.hasVM) {
        const baseFiO2 = patient.ventilationParams?.fiO2 || 50;
        const basePEEP = patient.ventilationParams?.peep || 6;
        let fiO2 = baseFiO2;
        
        // Ajustar FiO2 baseado na tendência da fase
        if (phase.fiO2Trend === "up") {
          fiO2 = Math.min(100, baseFiO2 + (day - phase.days[0]) * 3);
        } else if (phase.fiO2Trend === "down") {
          fiO2 = Math.max(21, baseFiO2 - (day - phase.days[0]) * 2);
        }
        
        suporteVentilatorio = {
          mode: patient.ventilationParams?.modo || "PSV",
          fiO2: Math.round(fiO2),
          peep: basePEEP
        };
      }
    } else {
      // Fallback: lógica original
      if (day <= altaDay - 3 && patient.ventilationParams) {
        suporteVentilatorio = {
          mode: patient.ventilationParams.modo,
          fiO2: Math.max(21, patient.ventilationParams.fiO2 - (30 - day) * 2),
          peep: Math.max(5, patient.ventilationParams.peep - (30 - day) * 0.5)
        };
      }
    }
    
    // Suporte hemodinâmico
    const vasopressor = patient.medications.find(m => m.tipo === "vasopressor" && m.ativo);
    let suporteHemodinamico: DailyPatientStatus["suporteHemodinamico"] = {
      hasVasopressor: false
    };
    
    if (phase) {
      suporteHemodinamico.hasVasopressor = phase.hasVasopressor;
      if (phase.hasVasopressor && vasopressor) {
        let dose = vasopressor.dose;
        // Ajustar dose baseado na tendência
        if (phase.vasopressorDoseTrend === "up") {
          dose = vasopressor.dose * (1 + (day - phase.days[0]) * 0.1);
        } else if (phase.vasopressorDoseTrend === "down") {
          dose = Math.max(0.1, vasopressor.dose * (1 - (day - phase.days[0]) * 0.1));
        }
        suporteHemodinamico.mainDrug = vasopressor.nome;
        suporteHemodinamico.dose = `${dose.toFixed(1)} ${vasopressor.unidade}`;
      }
    } else {
      // Fallback
      if (day <= altaDay - 2 && vasopressor) {
        suporteHemodinamico = {
          hasVasopressor: true,
          mainDrug: vasopressor.nome,
          dose: `${vasopressor.dose} ${vasopressor.unidade}`
        };
      }
    }
    
    // Eventos principais do dia
    const principaisEventos: string[] = [];
    
    // Determinar se paciente está em alto risco (para não gerar eventos de alta antigos)
    const isHighRisk = currentRisk > 0.6;
    const isRecentDay = day >= currentDiaUti - 13; // Últimos 14 dias
    
    // Usar eventos do perfil se disponível
    if (profile) {
      const keyEvent = profile.keyEvents.find(e => e.day === day);
      if (keyEvent) {
        // Para pacientes de alto risco, não incluir eventos de "Alta" nos últimos dias
        if (isHighRisk && isRecentDay && keyEvent.description.toLowerCase().includes("alta")) {
          // Substituir por evento de piora/ajuste
          principaisEventos.push(`Ajuste de suporte ventilatório/hemodinâmico`);
        } else {
          principaisEventos.push(keyEvent.description);
        }
      }
    } else {
      // Fallback: eventos genéricos
      if (day === 1) {
        principaisEventos.push("Admissão na UTI");
        principaisEventos.push(`Diagnóstico: ${patient.diagnosticoPrincipal.substring(0, 50)}`);
      }
      if (day === 2 && patient.ventilationParams) {
        principaisEventos.push("Início de ventilação mecânica");
      }
      if (day === 3 && vasopressor) {
        principaisEventos.push(`Início de ${vasopressor.nome}`);
      }
      
      // Para pacientes de alto risco, não gerar eventos de alta nos últimos dias
      if (isHighRisk && isRecentDay) {
        // Em vez de alta, gerar eventos de ajuste/piora
        if (day === currentDiaUti - 2) {
          principaisEventos.push("Piora de função respiratória");
        }
        if (day === currentDiaUti - 1) {
          principaisEventos.push("Ajuste de vasopressor");
        }
        if (day === currentDiaUti) {
          principaisEventos.push("Estado crítico - monitorização intensiva");
        }
      } else {
        // Para pacientes de baixo/moderado risco, manter eventos de alta
        if (day === altaDay - 1) {
          principaisEventos.push("Preparação para alta da UTI");
        }
        if (day === altaDay) {
          principaisEventos.push("Alta da UTI");
        }
      }
    }
    
    // Resumo diário
    let resumoDiario = "";
    if (phase) {
      resumoDiario = phase.description;
    } else {
      // Fallback: resumos genéricos
      if (statusGlobal === "critico") {
        resumoDiario = `Paciente em estado crítico. ${patient.ventilationParams ? 'Em ventilação mecânica.' : ''} ${vasopressor ? 'Suporte hemodinâmico ativo.' : ''}`;
      } else if (statusGlobal === "grave") {
        resumoDiario = `Estado grave, requer monitorização intensiva.`;
      } else if (statusGlobal === "estavel") {
        resumoDiario = `Paciente estável, mantendo monitorização.`;
      } else if (statusGlobal === "melhora") {
        resumoDiario = `Evolução favorável, preparando desmame de suportes.`;
      } else {
        resumoDiario = `Paciente em alta da UTI.`;
      }
    }
    
    evolution.push({
      diaUti: day,
      data: date.toISOString(),
      statusGlobal,
      riskScore,
      suporteVentilatorio,
      suporteHemodinamico,
      principaisEventos: principaisEventos.slice(0, 5),
      resumoDiario
    });
  }
  
  return evolution;
}

/**
 * Cache de evoluções geradas
 */
const evolutionCache: Record<string, DailyPatientStatus[]> = {};

/**
 * Obtém evolução de 30 dias para um paciente
 */
export function getDailyStatus(patientId: string): DailyPatientStatus[] {
  if (evolutionCache[patientId]) {
    return evolutionCache[patientId];
  }
  
  const patient = mockPatientsRaw.find(p => p.id === patientId);
  if (!patient) {
    return [];
  }
  
  const evolution = generate30DayEvolution(patient);
  evolutionCache[patientId] = evolution;
  return evolution;
}

/**
 * Obtém apenas os últimos N dias da evolução (últimos 14 dias por padrão)
 * Garante que o último dia seja "hoje" (D30) e remove "alta_uti" antiga para pacientes de alto risco
 */
export function getRecentDailyStatus(patientId: string, days: number = 14): DailyPatientStatus[] {
  const all = getDailyStatus(patientId);
  if (all.length === 0) return [];
  
  const patient = mockPatientsRaw.find(p => p.id === patientId);
  if (!patient) return [];
  
  // Pegar os últimos N dias
  const recent = all.slice(-days);
  
  // Se o paciente está em alto risco (riscoMortality24h > 0.6), 
  // remover qualquer "alta_uti" dos últimos 14 dias e substituir por status apropriado
  const isHighRisk = patient.riscoMortality24h > 0.6;
  const currentDiaUti = patient.diasDeUTI;
  
  if (isHighRisk) {
    // Para pacientes de alto risco, garantir que não há "alta_uti" nos últimos dias
    return recent.map((day, idx) => {
      // Se é um dos últimos 14 dias e está marcado como "alta_uti", substituir
      if (day.statusGlobal === "alta_uti" && day.diaUti >= currentDiaUti - 13) {
        // Substituir por "critico" ou "grave" baseado no risco
        return {
          ...day,
          statusGlobal: patient.riscoMortality24h >= 0.75 ? "critico" : "grave",
          riskScore: Math.max(0.6, patient.riscoMortality24h),
          resumoDiario: day.resumoDiario.replace(/alta da UTI/i, "estado crítico/grave")
        };
      }
      return day;
    });
  }
  
  return recent;
}

/**
 * Obtém o status mais recente do paciente
 */
export function getLatestDailyStatus(patientId: string): DailyPatientStatus | undefined {
  const evolution = getDailyStatus(patientId);
  return evolution[evolution.length - 1] || evolution[0];
}

/**
 * Obtém timeline de eventos do paciente
 * Usa history.timelineEvents se disponível, senão gera a partir de dailyEvolution
 */
export function getPatientTimeline(patientId: string): TimelineEvent[] {
  const history = getPatientHistoryById(patientId);
  if (history && history.timelineEvents.length > 0) {
    return history.timelineEvents;
  }
  
  // Fallback: gerar a partir de dailyEvolution
  const evolution = getDailyStatus(patientId);
  const events: TimelineEvent[] = [];
  
  const patient = mockPatientsRaw.find(p => p.id === patientId);
  const isHighRisk = patient ? patient.riscoMortality24h > 0.6 : false;
  const currentDiaUti = patient ? patient.diasDeUTI : 30;
  
  evolution.forEach((day, idx) => {
    // Para pacientes de alto risco, não incluir eventos de "Alta" nos últimos 14 dias
    const isRecentDay = day.diaUti >= currentDiaUti - 13;
    const isAltaEvent = day.principaisEventos.some(e => e.toLowerCase().includes('alta'));
    
    if (isHighRisk && isRecentDay && isAltaEvent) {
      // Pular eventos de alta para pacientes de alto risco nos últimos dias
      return;
    }
    
    if (day.principaisEventos.length > 0) {
      day.principaisEventos.forEach((evento, eventIdx) => {
        // Filtrar eventos de "Alta" antigos para pacientes de alto risco
        if (isHighRisk && isRecentDay && evento.toLowerCase().includes('alta')) {
          return; // Pular este evento
        }
        
        let type: TimelineEventType = 'note';
        let severity: TimelineEventSeverity = 'normal';
        
        if (evento.includes('Admissão')) {
          type = 'admission';
          severity = 'normal';
        } else if (evento.includes('ventilação') || evento.includes('VM') || evento.includes('respiratória') || evento.includes('respiratorio')) {
          type = 'therapy';
          severity = day.statusGlobal === 'critico' ? 'critical' : 'warning';
        } else if (evento.includes('Noradrenalina') || evento.includes('vasopressor') || evento.includes('Ajuste de vasopressor')) {
          type = 'therapy';
          severity = 'critical';
        } else if (evento.includes('Alta')) {
          type = 'note';
          severity = 'normal';
        } else if (evento.includes('Piora') || evento.includes('crítico') || evento.includes('critico')) {
          type = 'note';
          severity = 'critical';
        }
        
        // Verificar se é evento de imagem
        const isImaging = evento.toLowerCase().includes('raio') || 
                         evento.toLowerCase().includes('tomografia') || 
                         evento.toLowerCase().includes('tc') ||
                         evento.toLowerCase().includes('rx');
        
        events.push({
          id: `${patientId}-day${day.diaUti}-event${eventIdx}`,
          type: isImaging ? 'imaging' : type,
          title: evento,
          description: day.resumoDiario.substring(0, 90),
          timestamp: day.data,
          severity,
          examId: isImaging ? `${patientId}-exam-${day.diaUti}` : undefined,
          examType: isImaging ? (evento.toLowerCase().includes('tórax') || evento.toLowerCase().includes('pulmão') ? 'chest-xray' : 'head-ct') : undefined,
          relatedExamId: isImaging ? `${patientId}-exam-${day.diaUti}` : undefined
        });
      });
    }
  });
  
  return events.sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return bTime - aTime;
  });
}

/**
 * Obtém resumo da timeline focando nas últimas 24-72h (máximo 5 dias)
 * Nunca mostra eventos de "Alta UTI" antigos para pacientes de alto risco
 */
export function getPatientTimelineSummary(patientId: string): { events: TimelineEvent[]; isFallback: boolean } {
  const allEvents = getPatientTimeline(patientId);
  const patient = mockPatientsRaw.find(p => p.id === patientId);
  
  if (!patient) {
    return { events: [], isFallback: false };
  }
  
  const currentDiaUti = patient.diasDeUTI;
  const isHighRisk = patient.riscoMortality24h > 0.6;
  const MAX_DAYS_BACK = 5; // Máximo de 5 dias para eventos recentes
  
  // Filtrar eventos dos últimos MAX_DAYS_BACK dias baseado em diaUti
  // Assumindo que os eventos têm um campo diaUti ou podemos calcular a partir do timestamp
  const recentEvents = allEvents.filter(event => {
    // Tentar extrair diaUti do evento ou calcular a partir do timestamp
    // Se o evento tem um campo relacionado ao dia, usar isso
    // Caso contrário, calcular diferença em dias a partir do timestamp
    const eventDate = new Date(event.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - eventDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Filtrar eventos dos últimos MAX_DAYS_BACK dias
    if (diffDays > MAX_DAYS_BACK) {
      return false;
    }
    
    // Para pacientes de alto risco, remover eventos de "Alta UTI" antigos
    if (isHighRisk && event.title.toLowerCase().includes("alta") && diffDays > 1) {
      return false;
    }
    
    return true;
  });
  
  // Ordenar por relevância (severity) e depois por timestamp (mais recente primeiro)
  const sortedRecent = recentEvents.sort((a, b) => {
    const severityOrder = { critical: 3, warning: 2, normal: 1 };
    const aSeverity = severityOrder[a.severity || 'normal'];
    const bSeverity = severityOrder[b.severity || 'normal'];
    if (aSeverity !== bSeverity) {
      return bSeverity - aSeverity;
    }
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return bTime - aTime;
  });
  
  if (sortedRecent.length > 0) {
    return { events: sortedRecent.slice(0, 5), isFallback: false };
  }
  
  // Se não há eventos recentes, retornar vazio (não mostrar eventos antigos)
  return { events: [], isFallback: true };
}

/**
 * Formata timestamp relativo (ex: "há 2h", "há 1 dia")
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const eventDate = new Date(timestamp);
  const diffMs = now.getTime() - eventDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins < 1 ? 'agora' : `há ${diffMins}min`;
  } else if (diffHours < 24) {
    return `há ${diffHours}h`;
  } else if (diffDays === 1) {
    return 'há 1 dia';
  } else {
    return `há ${diffDays} dias`;
  }
}

/**
 * Labels para tipos de eventos
 */
export const eventTypeLabels: Record<TimelineEventType, string> = {
  admission: 'Admissão',
  therapy: 'Terapia',
  lab: 'Laboratório',
  imaging: 'Imagem',
  note: 'Nota'
};

// Re-exportar TimelineEvent type
export type { TimelineEvent } from "@/types/MockPatientHistory";

