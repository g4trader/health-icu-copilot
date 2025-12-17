import type { Patient } from "@/types/Patient";
import type { DailyPatientStatus, PatientStatusGlobal } from "@/types/DailyPatientStatus";
import type { TimelineEvent, TimelineEventType, TimelineEventSeverity } from "@/types/MockPatientHistory";
import { mockPatientsRaw } from "./mockData";
import { calculateRiskScore } from "./mockData";
import { getPatientHistoryById } from "./mockPatients/history";

/**
 * Gera evolução de 30 dias para um paciente
 * Simula trajetória clínica plausível baseada no estado atual
 */
function generate30DayEvolution(patient: Patient): DailyPatientStatus[] {
  const evolution: DailyPatientStatus[] = [];
  const baseDate = new Date(patient.ultimaAtualizacao);
  const currentDiaUti = patient.diasDeUTI;
  const currentRisk = patient.riscoMortality24h;
  
  // Determinar trajetória baseada no diagnóstico e estado atual
  const isCritical = currentRisk >= 0.65;
  const isImproving = currentRisk < 0.5 && currentDiaUti > 3;
  const hasShortStay = currentDiaUti <= 3 && currentRisk < 0.4;
  
  // Calcular dia de alta (se aplicável)
  let altaDay = 30;
  if (hasShortStay) {
    altaDay = currentDiaUti + 2; // Alta em 2-3 dias
  } else if (isImproving) {
    altaDay = Math.min(25, currentDiaUti + 5); // Melhora gradual
  } else if (isCritical) {
    altaDay = 30; // Permanece crítico por mais tempo
  }
  
  // Gerar status para cada dia (30 dias, começando 29 dias atrás)
  for (let day = 1; day <= 30; day++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - (30 - day));
    
    let statusGlobal: PatientStatusGlobal;
    let riskScore: number;
    
    if (day > altaDay) {
      statusGlobal = "alta_uti";
      riskScore = 0.1; // Risco muito baixo após alta
    } else if (day === altaDay) {
      statusGlobal = "alta_uti";
      riskScore = 0.15;
    } else if (day >= altaDay - 2) {
      statusGlobal = "melhora";
      riskScore = Math.max(0.2, currentRisk - 0.3);
    } else if (isCritical && day <= currentDiaUti) {
      // Fase crítica inicial
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
      // Trajetória para pacientes menos críticos
      if (day <= 2) {
        statusGlobal = "grave";
        riskScore = Math.min(0.7, currentRisk + 0.1);
      } else {
        statusGlobal = "estavel";
        riskScore = Math.max(0.3, currentRisk - (day - 2) * 0.05);
      }
    } else {
      // Dias futuros (projeção)
      statusGlobal = day < altaDay - 5 ? "estavel" : "melhora";
      riskScore = Math.max(0.2, currentRisk - (day - currentDiaUti) * 0.03);
    }
    
    // Suporte ventilatório
    const suporteVentilatorio = {
      mode: day <= altaDay - 3 && patient.ventilationParams ? patient.ventilationParams.modo : undefined,
      fiO2: day <= altaDay - 3 && patient.ventilationParams 
        ? Math.max(21, patient.ventilationParams.fiO2 - (30 - day) * 2)
        : undefined,
      peep: day <= altaDay - 3 && patient.ventilationParams
        ? Math.max(5, patient.ventilationParams.peep - (30 - day) * 0.5)
        : undefined
    };
    
    // Suporte hemodinâmico
    const vasopressor = patient.medications.find(m => m.tipo === "vasopressor" && m.ativo);
    const suporteHemodinamico = {
      hasVasopressor: day <= altaDay - 2 && !!vasopressor,
      mainDrug: vasopressor?.nome,
      dose: vasopressor ? `${vasopressor.dose} ${vasopressor.unidade}` : undefined
    };
    
    // Eventos principais do dia
    const principaisEventos: string[] = [];
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
    if (day === altaDay - 1) {
      principaisEventos.push("Preparação para alta da UTI");
    }
    if (day === altaDay) {
      principaisEventos.push("Alta da UTI");
    }
    
    // Resumo diário
    let resumoDiario = "";
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
  
  evolution.forEach((day, idx) => {
    if (day.principaisEventos.length > 0) {
      day.principaisEventos.forEach((evento, eventIdx) => {
        let type: TimelineEventType = 'note';
        let severity: TimelineEventSeverity = 'normal';
        
        if (evento.includes('Admissão')) {
          type = 'admission';
          severity = 'normal';
        } else if (evento.includes('ventilação') || evento.includes('VM')) {
          type = 'therapy';
          severity = day.statusGlobal === 'critico' ? 'critical' : 'warning';
        } else if (evento.includes('Noradrenalina') || evento.includes('vasopressor')) {
          type = 'therapy';
          severity = 'critical';
        } else if (evento.includes('Alta')) {
          type = 'note';
          severity = 'normal';
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
 * Obtém resumo da timeline (últimas 24h ou mais recentes)
 */
export function getPatientTimelineSummary(patientId: string): { events: TimelineEvent[]; isFallback: boolean } {
  const allEvents = getPatientTimeline(patientId);
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Filtrar eventos das últimas 24h
  const recentEvents = allEvents.filter(event => {
    const eventDate = new Date(event.timestamp);
    return eventDate >= twentyFourHoursAgo;
  });
  
  // Ordenar por relevância (severity) e depois por timestamp
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
  
  if (sortedRecent.length >= 3) {
    return { events: sortedRecent.slice(0, 3), isFallback: false };
  }
  
  // Fallback: pegar os 3 mais recentes de todos os eventos
  const sortedAll = allEvents.sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return bTime - aTime;
  });
  
  return { events: sortedAll.slice(0, 3), isFallback: true };
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
