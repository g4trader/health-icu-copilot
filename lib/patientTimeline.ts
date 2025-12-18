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
          // Se currentDiaUti = 1, usar progress = 0 (sempre admissão)
          const progress = currentDiaUti > 1 ? (day - 1) / (currentDiaUti - 1) : 0;
          riskScore = admissionRisk - (progress * (admissionRisk - currentRisk));
          
          // IMPORTANTE: Garantir coerência - se o paciente está em alto risco hoje,
          // os últimos dias também devem refletir alto risco (não melhorar)
          // Ajustar riskScore para nunca ser menor que o risco atual nos últimos dias
          const daysFromCurrent = currentDiaUti - day;
          if (riskLevel === "alto" && daysFromCurrent <= 3) {
            // Nos últimos 3 dias antes de hoje, garantir que riskScore >= currentRisk * 0.9
            riskScore = Math.max(riskScore, currentRisk * 0.9);
          }
          
          // Determinar status baseado no risco interpolado, mas respeitando o riskLevel atual
          if (riskLevel === "alto") {
            // Alto risco: nunca deve mostrar "melhora" ou "alta_uti" na timeline recente
            if (riskScore >= 0.75) {
              statusGlobal = "critico";
            } else {
              statusGlobal = "grave"; // Sempre grave ou crítico para alto risco
            }
          } else if (riskLevel === "moderado") {
            // Moderado: pode ter estável, mas não melhora/alta
            if (riskScore >= 0.6) {
              statusGlobal = "grave";
            } else if (riskScore >= 0.35) {
              statusGlobal = "estavel";
            } else {
              statusGlobal = "grave"; // Nunca melhora/alta para moderado
            }
          } else {
            // Baixo risco: pode ter trajetória completa
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
        // Progress: 0 = admissão (dia 1), 1 = hoje (currentDiaUti)
        // Se currentDiaUti = 1, usar progress = 0 (sempre admissão)
        const progress = currentDiaUti > 1 ? (day - 1) / (currentDiaUti - 1) : 0;
        
        // Interpolar risco: da admissão (alto) até o atual
        riskScore = admissionRisk - (progress * (admissionRisk - currentRisk));
        
        // IMPORTANTE: Garantir coerência - se o paciente está em alto risco hoje,
        // os últimos dias também devem refletir alto risco (não melhorar)
        // Ajustar riskScore para nunca ser menor que o risco atual nos últimos dias
        const daysFromCurrent = currentDiaUti - day;
        if (riskLevel === "alto" && daysFromCurrent <= 3) {
          // Nos últimos 3 dias antes de hoje, garantir que riskScore >= currentRisk * 0.9
          riskScore = Math.max(riskScore, currentRisk * 0.9);
        } else if (riskLevel === "moderado" && daysFromCurrent <= 2) {
          // Para moderado, garantir que os últimos 2 dias não mostrem melhora
          riskScore = Math.max(riskScore, currentRisk * 0.85);
        }
        
        // Determinar status baseado no risco interpolado e na trajetória esperada
        // IMPORTANTE: Respeitar o riskLevel atual - nunca mostrar melhora se está em alto risco
        if (riskLevel === "baixo") {
          // Trajetória de melhora completa: crítico → grave → estável → melhora → alta
          // Distribuir fases ao longo da progressão
          if (progress < 0.15) {
            statusGlobal = "critico"; // Primeiros 15%: crítico (admissão)
          } else if (progress < 0.35) {
            statusGlobal = "grave"; // 15-35%: grave
          } else if (progress < 0.65) {
            statusGlobal = "estavel"; // 35-65%: estável
          } else if (progress < 0.85) {
            statusGlobal = "melhora"; // 65-85%: melhora
          } else {
            statusGlobal = currentStatus; // 85-100%: melhora ou alta (hoje)
          }
        } else if (riskLevel === "moderado") {
          // Trajetória moderada: crítico → grave → estável
          // NUNCA mostrar melhora ou alta
          if (progress < 0.25) {
            statusGlobal = "critico"; // Primeiros 25%: crítico
          } else if (progress < 0.65) {
            statusGlobal = "grave"; // 25-65%: grave
          } else {
            statusGlobal = "estavel"; // 65-100%: estável (nunca melhora)
          }
        } else {
          // Trajetória de alto risco: crítico → grave (ou crítico contínuo)
          // NUNCA mostrar estável, melhora ou alta - sempre crítico ou grave
          // Se está em alto risco hoje, os últimos dias também devem ser graves/críticos
          if (riskScore >= 0.75 || progress < 0.3) {
            statusGlobal = "critico"; // Primeiros 30% ou risco muito alto: crítico
          } else {
            statusGlobal = "grave"; // Resto: grave (nunca estável/melhora/alta)
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
    // Se currentDiaUti = 1, usar progress = 0 (sempre admissão)
    const progress = day <= currentDiaUti && currentDiaUti > 1 
      ? (day - 1) / (currentDiaUti - 1) 
      : (day <= currentDiaUti ? 0 : 1);
    
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
    
    // Eventos principais do dia - COERENTES com a evolução diária
    const principaisEventos: string[] = [];
    
    // Usar eventos do perfil se disponível
    if (profile) {
      const keyEvent = profile.keyEvents.find(e => e.day === day);
      if (keyEvent) {
        principaisEventos.push(keyEvent.description);
      }
    } else {
      // Gerar eventos baseados no statusGlobal e na fase da evolução
      // Progress: 0 = admissão, 1 = hoje
      const progress = currentDiaUti > 1 ? (day - 1) / (currentDiaUti - 1) : 0;
      
      // Eventos baseados no status do dia
      if (day === 1) {
        // Admissão: sempre crítico
        principaisEventos.push("Admissão na UTI");
        principaisEventos.push(`Diagnóstico: ${patient.diagnosticoPrincipal.substring(0, 50)}`);
        if (statusGlobal === "critico") {
          principaisEventos.push("Estado crítico - choque séptico/insuficiência respiratória");
        }
      }
      
      // Eventos baseados na fase da evolução
      if (statusGlobal === "critico") {
        // Fase crítica: eventos de instabilidade
        if (day === 1 || day === 2) {
          if (suporteVentilatorio.mode) {
            principaisEventos.push("Início de ventilação mecânica invasiva");
          }
          if (suporteHemodinamico.hasVasopressor) {
            principaisEventos.push(`Início de ${suporteHemodinamico.mainDrug || "Noradrenalina"}`);
          }
        } else if (day <= 3) {
          principaisEventos.push("Estado crítico - ajuste de suportes");
        }
      } else if (statusGlobal === "grave") {
        // Fase grave: eventos de estabilização parcial
        if (progress >= 0.15 && progress < 0.25) {
          // Transição crítico → grave
          principaisEventos.push("Resposta parcial ao tratamento");
        } else if (progress >= 0.25 && progress < 0.35) {
          principaisEventos.push("Estabilização hemodinâmica parcial");
        } else if (suporteVentilatorio.mode && progress >= 0.3) {
          principaisEventos.push("Ajuste de parâmetros ventilatórios");
        }
      } else if (statusGlobal === "estavel") {
        // Fase estável: eventos de melhora gradual
        if (progress >= 0.35 && progress < 0.45) {
          // Transição grave → estável
          principaisEventos.push("Melhora da função respiratória");
        } else if (progress >= 0.45 && progress < 0.55) {
          principaisEventos.push("Redução progressiva de suportes");
        } else if (progress >= 0.55 && progress < 0.65) {
          if (suporteHemodinamico.hasVasopressor) {
            principaisEventos.push("Redução significativa de vasopressor");
          } else if (suporteVentilatorio.mode === "PSV") {
            principaisEventos.push("Desmame ventilatório em andamento");
          }
        }
      } else if (statusGlobal === "melhora") {
        // Fase de melhora: eventos de preparação para alta
        if (progress >= 0.65 && progress < 0.75) {
          // Transição estável → melhora
          principaisEventos.push("Franca melhora clínica");
        } else if (progress >= 0.75 && progress < 0.85) {
          if (!suporteVentilatorio.mode && !suporteHemodinamico.hasVasopressor) {
            principaisEventos.push("Retirada completa de suportes");
          } else if (suporteVentilatorio.mode === "PSV") {
            principaisEventos.push("Desmame ventilatório avançado");
          }
        } else if (progress >= 0.85) {
          principaisEventos.push("Preparação para alta da UTI");
        }
      } else if (statusGlobal === "alta_uti") {
        // Alta: evento final
        if (day === currentDiaUti || day === currentDiaUti - 1) {
          principaisEventos.push("Alta da UTI");
        }
      }
      
      // Eventos específicos baseados em mudanças de suporte
      if (day > 1) {
        const prevDay = evolution[evolution.length - 1];
        if (prevDay) {
          // Detectar mudanças significativas
          const hadVM = !!prevDay.suporteVentilatorio?.mode;
          const hasVM = !!suporteVentilatorio.mode;
          const hadVaso = prevDay.suporteHemodinamico?.hasVasopressor;
          const hasVaso = suporteHemodinamico.hasVasopressor;
          
          // Retirada de VM
          if (hadVM && !hasVM && statusGlobal !== "critico") {
            principaisEventos.push("Extubação - retirada de ventilação mecânica");
          }
          // Retirada de vasopressor
          if (hadVaso && !hasVaso && statusGlobal !== "critico") {
            principaisEventos.push("Retirada de vasopressor");
          }
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
 * IMPORTANTE: Limpar cache quando pacientes são reprocessados
 */
const evolutionCache: Record<string, DailyPatientStatus[]> = {};

/**
 * Limpa o cache de evoluções (chamado quando pacientes são reprocessados)
 */
export function clearEvolutionCache(): void {
  Object.keys(evolutionCache).forEach(key => delete evolutionCache[key]);
}

/**
 * Obtém evolução de 30 dias para um paciente
 * IMPORTANTE: Usa pacientes processados do cache (se disponível)
 * Isso garante que a timeline seja gerada com os dados já ajustados (risco, VM, vaso, etc.)
 */
export function getDailyStatus(patientId: string): DailyPatientStatus[] {
  // Tentar obter paciente processado do cache primeiro
  const patient = getProcessedPatient(patientId);
  if (!patient) {
    return [];
  }
  
  // Gerar chave de cache baseada no paciente processado (risco atual)
  // Isso garante que se o risco mudar, a timeline seja regenerada
  const cacheKey = `${patientId}-${patient.riscoMortality24h.toFixed(3)}-${patient.diasDeUTI}`;
  
  if (evolutionCache[cacheKey]) {
    return evolutionCache[cacheKey];
  }
  
  const evolution = generate30DayEvolution(patient);
  evolutionCache[cacheKey] = evolution;
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
          diaUti: day.diaUti, // Adicionar diaUti para facilitar filtro
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
  
  // Obter evolução para calcular timestamps
  const evolution = getDailyStatus(patientId);
  const latestDay = evolution.length > 0 ? evolution[evolution.length - 1] : null;
  const latestTimestamp = latestDay ? new Date(latestDay.data).getTime() : Date.now();
  
  // Filtrar eventos dos últimos MAX_DAYS_BACK dias baseado no diaUti do evento
  const recentEvents = allEvents.filter(event => {
    // Usar diaUti do evento (se disponível) ou extrair do ID
    const eventDiaUti = event.diaUti ?? (() => {
      const dayMatch = event.id.match(/day(\d+)/);
      return dayMatch ? parseInt(dayMatch[1]) : null;
    })();
    
    if (eventDiaUti === null || eventDiaUti === undefined) {
      // Se não conseguir extrair, calcular a partir do timestamp
      const eventDate = new Date(event.timestamp);
      const eventTime = eventDate.getTime();
      const diffMs = latestTimestamp - eventTime;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const calculatedDiaUti = diffDays <= 0 ? currentDiaUti : Math.max(1, currentDiaUti - diffDays);
      
      // Filtrar eventos dos últimos MAX_DAYS_BACK dias
      if (calculatedDiaUti < currentDiaUti - MAX_DAYS_BACK || calculatedDiaUti > currentDiaUti) {
        return false;
      }
      
      // Para pacientes de alto risco, remover eventos de "Alta UTI"
      if (isHighRisk && event.title.toLowerCase().includes("alta") && calculatedDiaUti >= currentDiaUti - 13) {
        return false;
      }
      
      return true;
    }
    
    // Filtrar eventos dos últimos MAX_DAYS_BACK dias usando diaUti
    const diffDays = currentDiaUti - eventDiaUti;
    if (diffDays < 0 || diffDays > MAX_DAYS_BACK) {
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

