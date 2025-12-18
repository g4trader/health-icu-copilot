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
  
  // Determinar estado atual baseado no risco
  // Usar riskLevelFromScore para categorizar
  const riskLevel = currentRisk >= 0.61 ? "alto" : currentRisk >= 0.21 ? "moderado" : "baixo";
  
  // Determinar status atual esperado baseado no risco
  let currentStatus: PatientStatusGlobal;
  if (riskLevel === "baixo") {
    // Risco baixo: deve estar em melhora ou alta
    const hasVM = !!patient.ventilationParams;
    const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
    currentStatus = (!hasVM && !hasVaso) ? "alta_uti" : "melhora";
  } else if (riskLevel === "moderado") {
    // Risco moderado: estável ou grave
    currentStatus = currentRisk >= 0.4 ? "grave" : "estavel";
  } else {
    // Risco alto: crítico ou grave
    currentStatus = currentRisk >= 0.75 ? "critico" : "grave";
  }
  
  // Tentar usar perfil clínico se disponível
  const profile = getClinicalProfile(patient.id);
  
  // Calcular data de admissão (hoje menos currentDiaUti dias)
  const admissionDate = new Date(baseDate);
  admissionDate.setDate(admissionDate.getDate() - currentDiaUti + 1);
  
  // Gerar status para cada dia (30 dias totais)
  const maxDays = 30;
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
        // Fora das fases: usar estado atual se for o último dia, senão interpolar
        if (day >= currentDiaUti) {
          // Dia atual ou futuro: usar estado atual
          statusGlobal = currentStatus;
          riskScore = currentRisk;
        } else {
          // Dias anteriores: interpolar do início (crítico) até o estado atual
          const progress = day / currentDiaUti;
          if (riskLevel === "baixo") {
            // Trajetória de melhora: crítico → grave → estável → melhora → alta
            if (progress < 0.15) {
              statusGlobal = "critico";
              riskScore = 0.85 - progress * 0.3;
            } else if (progress < 0.35) {
              statusGlobal = "grave";
              riskScore = 0.6 - (progress - 0.15) * 0.25;
            } else if (progress < 0.65) {
              statusGlobal = "estavel";
              riskScore = 0.35 - (progress - 0.35) * 0.2;
            } else if (progress < 0.85) {
              statusGlobal = "melhora";
              riskScore = 0.2 - (progress - 0.65) * 0.1;
            } else {
              statusGlobal = currentStatus; // Pode ser "melhora" ou "alta_uti"
              riskScore = Math.max(0.1, currentRisk);
            }
          } else if (riskLevel === "moderado") {
            // Trajetória moderada: crítico → grave → estável
            if (progress < 0.25) {
              statusGlobal = "critico";
              riskScore = 0.75 - progress * 0.15;
            } else if (progress < 0.65) {
              statusGlobal = "grave";
              riskScore = 0.6 - (progress - 0.25) * 0.25;
            } else {
              statusGlobal = currentStatus; // "estavel" ou "grave"
              riskScore = Math.max(0.3, currentRisk);
            }
          } else {
            // Trajetória de alto risco: crítico → grave (ou crítico contínuo)
            if (progress < 0.4) {
              statusGlobal = "critico";
              riskScore = 0.9 - progress * 0.1;
            } else {
              statusGlobal = currentStatus; // "critico" ou "grave"
              riskScore = Math.max(0.6, currentRisk);
            }
          }
        }
      }
    } else {
      // Sem perfil: gerar trajetória coerente baseada no risco atual
      if (day >= currentDiaUti) {
        // Dia atual ou futuro: usar estado atual
        statusGlobal = currentStatus;
        riskScore = currentRisk;
      } else {
        // Dias anteriores: gerar trajetória progressiva
        const progress = day / currentDiaUti;
        
        if (riskLevel === "baixo") {
          // Trajetória de melhora: crítico → grave → estável → melhora → alta
          if (progress < 0.15) {
            statusGlobal = "critico";
            riskScore = 0.85 - progress * 0.3;
          } else if (progress < 0.35) {
            statusGlobal = "grave";
            riskScore = 0.6 - (progress - 0.15) * 0.25;
          } else if (progress < 0.65) {
            statusGlobal = "estavel";
            riskScore = 0.35 - (progress - 0.35) * 0.2;
          } else if (progress < 0.85) {
            statusGlobal = "melhora";
            riskScore = 0.2 - (progress - 0.65) * 0.1;
          } else {
            statusGlobal = "alta_uti";
            riskScore = 0.1;
          }
        } else if (riskLevel === "moderado") {
          // Trajetória moderada: crítico → grave → estável
          if (progress < 0.25) {
            statusGlobal = "critico";
            riskScore = 0.75 - progress * 0.15;
          } else if (progress < 0.65) {
            statusGlobal = "grave";
            riskScore = 0.6 - (progress - 0.25) * 0.25;
          } else {
            statusGlobal = "estavel";
            riskScore = 0.4 - (progress - 0.65) * 0.15;
          }
        } else {
          // Trajetória de alto risco: crítico → grave (ou crítico contínuo)
          if (progress < 0.4) {
            statusGlobal = "critico";
            riskScore = 0.9 - progress * 0.1;
          } else {
            statusGlobal = "grave";
            riskScore = 0.8 - (progress - 0.4) * 0.15;
          }
        }
      }
    }
    
    // Determinar fase atual (se usando perfil)
    const phase = profile?.phases.find(p => day >= p.days[0] && day <= p.days[1]);
    
    // Suporte ventilatório - coerente com a trajetória
    let suporteVentilatorio: DailyPatientStatus["suporteVentilatorio"] = {};
    const hasVMNow = !!patient.ventilationParams;
    
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
      // Sem perfil: gerar suporte coerente com trajetória
      if (hasVMNow) {
        // Se tem VM agora, manter nos dias anteriores (pode aumentar no início)
        const baseFiO2 = patient.ventilationParams?.fiO2 || 50;
        const basePEEP = patient.ventilationParams?.peep || 6;
        let fiO2 = baseFiO2;
        
        // Nos primeiros dias, pode ter FiO2 mais alto
        if (day <= 3 && riskLevel === "alto") {
          fiO2 = Math.min(100, baseFiO2 + 20);
        } else if (day <= 5 && riskLevel === "moderado") {
          fiO2 = Math.min(80, baseFiO2 + 10);
        }
        
        suporteVentilatorio = {
          mode: patient.ventilationParams?.modo || "CMV",
          fiO2: Math.round(fiO2),
          peep: basePEEP
        };
      } else if (riskLevel === "baixo" && day < currentDiaUti - 2) {
        // Para baixo risco sem VM agora, deve ter tido VM nos primeiros dias
        if (day <= Math.floor(currentDiaUti * 0.4)) {
          suporteVentilatorio = {
            mode: "CMV",
            fiO2: Math.round(60 - (day - 1) * 2),
            peep: Math.round(10 - (day - 1) * 0.3)
          };
        } else if (day <= Math.floor(currentDiaUti * 0.7)) {
          // Desmame progressivo
          suporteVentilatorio = {
            mode: "PSV",
            fiO2: Math.round(40 - (day - Math.floor(currentDiaUti * 0.4)) * 1.5),
            peep: Math.round(7 - (day - Math.floor(currentDiaUti * 0.4)) * 0.2)
          };
        }
        // Depois disso, sem VM (já desmamado)
      } else if (riskLevel === "moderado" && day < currentDiaUti - 1) {
        // Moderado pode ter VM nos primeiros dias
        if (day <= Math.floor(currentDiaUti * 0.5)) {
          suporteVentilatorio = {
            mode: "CMV",
            fiO2: Math.round(50 - (day - 1) * 1.5),
            peep: Math.round(8 - (day - 1) * 0.2)
          };
        }
      }
    }
    
    // Suporte hemodinâmico - coerente com a trajetória
    const vasopressor = patient.medications.find(m => m.tipo === "vasopressor" && m.ativo);
    const hasVasoNow = !!vasopressor && vasopressor.ativo;
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
      // Sem perfil: gerar suporte coerente com trajetória
      if (hasVasoNow) {
        // Se tem vaso agora, manter nos dias anteriores (pode aumentar no início)
        const baseDose = vasopressor?.dose || 0.5;
        let dose = baseDose;
        
        // Nos primeiros dias, pode ter dose mais alta
        if (day <= 3 && riskLevel === "alto") {
          dose = baseDose * 1.3;
        } else if (day <= 5 && riskLevel === "moderado") {
          dose = baseDose * 1.2;
        }
        
        suporteHemodinamico = {
          hasVasopressor: true,
          mainDrug: vasopressor?.nome || "Noradrenalina",
          dose: `${dose.toFixed(1)} ${vasopressor?.unidade || "mcg/kg/min"}`
        };
      } else if (riskLevel === "baixo" && day < currentDiaUti - 2) {
        // Para baixo risco sem vaso agora, deve ter tido vaso nos primeiros dias
        if (day <= Math.floor(currentDiaUti * 0.3) && vasopressor) {
          const progress = day / Math.floor(currentDiaUti * 0.3);
          const dose = 0.8 * (1 - progress * 0.7); // Redução progressiva
          suporteHemodinamico = {
            hasVasopressor: true,
            mainDrug: vasopressor.nome,
            dose: `${dose.toFixed(1)} ${vasopressor.unidade}`
          };
        }
      } else if (riskLevel === "moderado" && day < currentDiaUti - 1) {
        // Moderado pode ter vaso nos primeiros dias
        if (day <= Math.floor(currentDiaUti * 0.4) && vasopressor) {
          const progress = day / Math.floor(currentDiaUti * 0.4);
          const dose = 0.6 * (1 - progress * 0.5);
          suporteHemodinamico = {
            hasVasopressor: true,
            mainDrug: vasopressor.nome,
            dose: `${dose.toFixed(1)} ${vasopressor.unidade}`
          };
        }
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
      // Em vez disso, gerar eventos de ajuste/piora relevantes
      if (isHighRisk && isRecentDay) {
        // Gerar eventos recentes relevantes para pacientes de alto risco
        if (day === currentDiaUti - 3) {
          principaisEventos.push("Piora de função respiratória");
        }
        if (day === currentDiaUti - 2 && vasopressor) {
          principaisEventos.push("Ajuste de vasopressor");
        }
        if (day === currentDiaUti - 1) {
          principaisEventos.push("Ajuste de parâmetros ventilatórios");
        }
        if (day === currentDiaUti) {
          principaisEventos.push("Estado crítico - monitorização intensiva");
        }
      } else if (!isHighRisk) {
        // Para pacientes de baixo/moderado risco, eventos de alta apenas se status for alta_uti ou melhora
        if (statusGlobal === "melhora" && day >= currentDiaUti - 1) {
          principaisEventos.push("Preparação para alta da UTI");
        }
        if (statusGlobal === "alta_uti" && day >= currentDiaUti - 1) {
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
  
  // Calcular diaUti de cada evento baseado no timestamp e currentDiaUti
  // Assumindo que o último dia (D30) corresponde ao timestamp mais recente
  const evolution = getDailyStatus(patientId);
  const latestDay = evolution.length > 0 ? evolution[evolution.length - 1] : null;
  const latestTimestamp = latestDay ? new Date(latestDay.data).getTime() : Date.now();
  
  // Filtrar eventos dos últimos MAX_DAYS_BACK dias baseado em diaUti calculado
  const recentEvents = allEvents.filter(event => {
    const eventDate = new Date(event.timestamp);
    const eventTime = eventDate.getTime();
    
    // Calcular quantos dias atrás o evento ocorreu (relativo ao último dia)
    const diffMs = latestTimestamp - eventTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Calcular diaUti aproximado do evento
    // Se o evento é mais recente que o último dia conhecido, assumir que é do último dia
    const eventDiaUti = diffDays <= 0 ? currentDiaUti : Math.max(1, currentDiaUti - diffDays);
    
    // Filtrar eventos dos últimos MAX_DAYS_BACK dias
    if (diffDays > MAX_DAYS_BACK || eventDiaUti < currentDiaUti - MAX_DAYS_BACK) {
      return false;
    }
    
    // Para pacientes de alto risco, remover eventos de "Alta UTI" dos últimos dias
    if (isHighRisk && event.title.toLowerCase().includes("alta") && eventDiaUti >= currentDiaUti - 13) {
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

