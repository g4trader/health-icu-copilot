import type { Patient } from "@/types/Patient";
import type { DailyPatientStatus, PatientStatusGlobal } from "@/types/DailyPatientStatus";
import type { TimelineEvent, TimelineEventType, TimelineEventSeverity } from "@/types/MockPatientHistory";
import { calculateRiskScore } from "./mockData";
import { getPatientHistoryById } from "./mockPatients/history";
import { getClinicalProfile } from "./patientClinicalProfiles";

// Cache de pacientes processados para evitar dependência circular
let processedPatientsCache: Patient[] | null = null;

/**
 * Define os pacientes processados (chamado de mockData.ts após processamento)
 * Isso quebra a dependência circular
 */
export function setProcessedPatients(patients: Patient[]): void {
  processedPatientsCache = patients;
}

/**
 * Obtém paciente processado do cache ou retorna null
 */
function getProcessedPatient(patientId: string): Patient | null {
  if (!processedPatientsCache) {
    return null;
  }
  return processedPatientsCache.find(p => p.id === patientId) || null;
}

/**
 * Gera evolução de 30 dias para um paciente
 * IMPORTANTE: A timeline sempre começa em CRÍTICO/GRAVE (admissão) e evolui até o estado ATUAL
 * Ninguém entra na UTI com risco baixo - a timeline mostra a EVOLUÇÃO desde a admissão
 */
function generate30DayEvolution(patient: Patient): DailyPatientStatus[] {
  const evolution: DailyPatientStatus[] = [];
  const baseDate = new Date(patient.ultimaAtualizacao);
  const currentDiaUti = patient.diasDeUTI;
  const currentRisk = patient.riscoMortality24h;
  
  // Determinar estado ATUAL baseado no risco (fim da trajetória)
  const riskLevel = currentRisk >= 0.61 ? "alto" : currentRisk >= 0.21 ? "moderado" : "baixo";
  
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
  
  // ESTADO DE ADMISSÃO: Sempre crítico ou grave (ninguém entra na UTI bem)
  // Baseado no diagnóstico e tipo de paciente
  const admissionStatus: PatientStatusGlobal = "critico"; // Sempre crítico na admissão
  const admissionRisk = 0.85; // Risco alto na admissão (choque séptico, insuficiência respiratória, etc.)
  
  // Tentar usar perfil clínico se disponível
  const profile = getClinicalProfile(patient.id);
  
  // Calcular data de admissão (hoje menos currentDiaUti dias)
  const admissionDate = new Date(baseDate);
  admissionDate.setDate(admissionDate.getDate() - currentDiaUti + 1);
  
  // Gerar status para cada dia
  // IMPORTANTE: Gerar pelo menos 14 dias para a timeline, mas sempre incluir todos os dias até currentDiaUti
  // Se currentDiaUti < 14, gerar 14 dias (com dias futuros usando estado atual)
  // Se currentDiaUti >= 14, gerar até currentDiaUti
  const minDaysForTimeline = 14;
  const maxDays = Math.max(minDaysForTimeline, currentDiaUti);
  
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
        // Fora das fases: interpolar da admissão até o estado atual
        if (day > currentDiaUti) {
          // Dia futuro: usar estado atual
          statusGlobal = currentStatus;
          riskScore = currentRisk;
        } else if (day === currentDiaUti) {
          // Dia atual: usar estado atual exato
          statusGlobal = currentStatus;
          riskScore = currentRisk;
        } else {
          // Dias anteriores: interpolar da ADMISSÃO (crítico) até o estado ATUAL
          // Progress: 0 = admissão (dia 1), 1 = hoje (currentDiaUti)
          const progress = (day - 1) / (currentDiaUti - 1);
          riskScore = admissionRisk - (progress * (admissionRisk - currentRisk));
          
          // Determinar status baseado no risco interpolado
          if (riskScore >= 0.75) {
            statusGlobal = "critico";
          } else if (riskScore >= 0.5) {
            statusGlobal = "grave";
          } else if (riskScore >= 0.3) {
            statusGlobal = "estavel";
          } else if (riskScore >= 0.15) {
            statusGlobal = "melhora";
          } else {
            statusGlobal = "alta_uti";
          }
        }
      }
    } else {
      // Sem perfil: gerar trajetória da ADMISSÃO até o estado ATUAL
      if (day > currentDiaUti) {
        // Dia futuro: usar estado atual (para preencher timeline de 14 dias)
        statusGlobal = currentStatus;
        riskScore = currentRisk;
      } else if (day === currentDiaUti) {
        // Dia atual: usar estado atual exato
        statusGlobal = currentStatus;
        riskScore = currentRisk;
      } else {
        // Dias anteriores: interpolar da ADMISSÃO até o estado ATUAL
        // Progress: 0 = admissão, 1 = hoje
        const progress = (day - 1) / (currentDiaUti - 1);
        
        // Interpolar risco: da admissão (alto) até o atual
        riskScore = admissionRisk - (progress * (admissionRisk - currentRisk));
        
        // Determinar status baseado no risco interpolado e na trajetória esperada
        if (riskLevel === "baixo") {
          // Trajetória de melhora completa: crítico → grave → estável → melhora → alta
          if (progress < 0.1) {
            statusGlobal = "critico"; // Primeiros 10%: crítico
          } else if (progress < 0.3) {
            statusGlobal = "grave"; // 10-30%: grave
          } else if (progress < 0.6) {
            statusGlobal = "estavel"; // 30-60%: estável
          } else if (progress < 0.85) {
            statusGlobal = "melhora"; // 60-85%: melhora
          } else {
            statusGlobal = currentStatus; // 85-100%: melhora ou alta
          }
        } else if (riskLevel === "moderado") {
          // Trajetória moderada: crítico → grave → estável
          if (progress < 0.2) {
            statusGlobal = "critico";
          } else if (progress < 0.6) {
            statusGlobal = "grave";
          } else {
            statusGlobal = "estavel";
          }
        } else {
          // Trajetória de alto risco: crítico → grave (ou crítico contínuo)
          if (progress < 0.5) {
            statusGlobal = "critico";
          } else {
            statusGlobal = "grave";
          }
        }
      }
    }
    
    // Determinar fase atual (se usando perfil)
    const phase = profile?.phases.find(p => day >= p.days[0] && day <= p.days[1]);
    
    // Suporte ventilatório - coerente com a EVOLUÇÃO desde a admissão
    let suporteVentilatorio: DailyPatientStatus["suporteVentilatorio"] = {};
    const hasVMNow = !!patient.ventilationParams;
    // Progress: 0 = admissão (dia 1), 1 = hoje (currentDiaUti)
    const progress = day <= currentDiaUti ? (day - 1) / Math.max(1, currentDiaUti - 1) : 1;
    
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
      // Sem perfil: gerar suporte baseado na EVOLUÇÃO desde a admissão
      if (day <= currentDiaUti) {
        if (hasVMNow) {
          // Se tem VM agora, teve desde a admissão (pode ter sido maior no início)
          const baseFiO2 = patient.ventilationParams?.fiO2 || 50;
          const basePEEP = patient.ventilationParams?.peep || 6;
          
          // Na admissão (dia 1), FiO2 mais alto; depois reduz progressivamente
          const fiO2AtAdmission = Math.min(100, baseFiO2 + (1 - progress) * 30);
          const peepAtAdmission = Math.min(14, basePEEP + (1 - progress) * 4);
          
          suporteVentilatorio = {
            mode: day <= currentDiaUti * 0.3 ? "CMV" : (patient.ventilationParams?.modo || "PSV"),
            fiO2: Math.round(fiO2AtAdmission),
            peep: Math.round(peepAtAdmission)
          };
        } else if (riskLevel === "baixo") {
          // Baixo risco sem VM agora: teve VM na admissão e foi desmamado
          // Admissão: VM alta, depois desmame progressivo
          if (progress < 0.3) {
            // Primeiros 30%: VM invasiva (admissão)
            suporteVentilatorio = {
              mode: "CMV",
              fiO2: Math.round(80 - progress * 40),
              peep: Math.round(12 - progress * 4)
            };
          } else if (progress < 0.6) {
            // 30-60%: Desmame (PSV)
            const desmameProgress = (progress - 0.3) / 0.3;
            suporteVentilatorio = {
              mode: "PSV",
              fiO2: Math.round(40 - desmameProgress * 20),
              peep: Math.round(8 - desmameProgress * 3)
            };
          }
          // Depois de 60%: sem VM (já desmamado)
        } else if (riskLevel === "moderado" && progress < 0.5) {
          // Moderado: pode ter tido VM nos primeiros dias
          suporteVentilatorio = {
            mode: "CMV",
            fiO2: Math.round(60 - progress * 20),
            peep: Math.round(10 - progress * 2)
          };
        }
      }
    }
    
    // Suporte hemodinâmico - coerente com a EVOLUÇÃO desde a admissão
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
      // Sem perfil: gerar suporte baseado na EVOLUÇÃO desde a admissão
      if (day <= currentDiaUti) {
        if (hasVasoNow) {
          // Se tem vaso agora, teve desde a admissão (pode ter sido maior no início)
          const baseDose = vasopressor?.dose || 0.5;
          // Na admissão (progress = 0), dose mais alta; depois reduz progressivamente
          const doseAtAdmission = baseDose * (1 + (1 - progress) * 0.5);
          
          suporteHemodinamico = {
            hasVasopressor: true,
            mainDrug: vasopressor?.nome || "Noradrenalina",
            dose: `${doseAtAdmission.toFixed(1)} ${vasopressor?.unidade || "mcg/kg/min"}`
          };
        } else if (riskLevel === "baixo") {
          // Baixo risco sem vaso agora: teve vaso na admissão e foi retirado
          // Admissão: vaso alto, depois redução progressiva
          if (progress < 0.4) {
            // Primeiros 40%: vasopressor (admissão e primeiros dias)
            const vasoProgress = progress / 0.4;
            const dose = 0.8 * (1 - vasoProgress * 0.9); // Redução de 0.8 até 0.08
            suporteHemodinamico = {
              hasVasopressor: true,
              mainDrug: vasopressor?.nome || "Noradrenalina",
              dose: `${dose.toFixed(1)} ${vasopressor?.unidade || "mcg/kg/min"}`
            };
          }
          // Depois de 40%: sem vaso (já retirado)
        } else if (riskLevel === "moderado" && progress < 0.5) {
          // Moderado: pode ter tido vaso nos primeiros dias
          const vasoProgress = progress / 0.5;
          const dose = 0.6 * (1 - vasoProgress * 0.7);
          suporteHemodinamico = {
            hasVasopressor: true,
            mainDrug: vasopressor?.nome || "Noradrenalina",
            dose: `${dose.toFixed(1)} ${vasopressor?.unidade || "mcg/kg/min"}`
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
 * IMPORTANTE: Usa pacientes processados do cache (se disponível)
 * Isso garante que a timeline seja gerada com os dados já ajustados (risco, VM, vaso, etc.)
 */
export function getDailyStatus(patientId: string): DailyPatientStatus[] {
  if (evolutionCache[patientId]) {
    return evolutionCache[patientId];
  }
  
  // Tentar obter paciente processado do cache primeiro
  const patient = getProcessedPatient(patientId);
  if (!patient) {
    return [];
  }
  
  const evolution = generate30DayEvolution(patient);
  evolutionCache[patientId] = evolution;
  return evolution;
}

/**
 * Obtém apenas os últimos N dias da evolução (últimos 14 dias por padrão)
 * IMPORTANTE: Sempre mostra a evolução desde a admissão até hoje
 * Se o paciente tem menos de N dias, mostra todos os dias + dias futuros (com estado atual)
 */
export function getRecentDailyStatus(patientId: string, days: number = 14): DailyPatientStatus[] {
  const all = getDailyStatus(patientId);
  if (all.length === 0) return [];
  
  // Usar paciente processado do cache
  const patient = getProcessedPatient(patientId);
  if (!patient) return [];
  
  const currentDiaUti = patient.diasDeUTI;
  
  // Se o paciente tem menos dias que o solicitado, pegar todos os dias disponíveis
  // Caso contrário, pegar os últimos N dias
  let recent: DailyPatientStatus[];
  if (all.length < days) {
    // Paciente com poucos dias: mostrar todos os dias (incluindo futuros se necessário)
    recent = all;
  } else {
    // Paciente com muitos dias: pegar os últimos N dias
    recent = all.slice(-days);
  }
  
  // Se o paciente está em alto risco (riscoMortality24h > 0.6), 
  // remover qualquer "alta_uti" dos últimos 14 dias e substituir por status apropriado
  const isHighRisk = patient.riscoMortality24h > 0.6;
  
  if (isHighRisk) {
    // Para pacientes de alto risco, garantir que não há "alta_uti" nos últimos dias
    return recent.map((day) => {
      // Se está marcado como "alta_uti" e é um dia recente, substituir
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
  
  // Usar paciente processado do cache
  const patient = getProcessedPatient(patientId);
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
  // Usar paciente processado do cache
  const patient = getProcessedPatient(patientId);
  
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

