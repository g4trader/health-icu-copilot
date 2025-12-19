/**
 * Funções para atualizar dados do paciente com notas de voz
 */

import type { Patient } from "@/types/Patient";
import type { TimelineEvent } from "@/types/MockPatientHistory";
import { getPatientHistoryById } from "./mockPatients/history";
import { patientsSnapshots } from "./mockPatients/snapshots";

/**
 * Constrói um parecer do plantonista a partir dos dados estruturados
 * Formato específico para o card "Parecer do Plantonista"
 */
export function buildPlantonistaOpinion(patient: Patient, structured: any): string {
  if (!structured) {
    return `Paciente ${patient.nome} (${patient.idade} anos), leito ${patient.leito}. Avaliação clínica realizada via nota de voz.`;
  }
  
  const status = structured.statusClinico ?? "estável";
  const plano = structured.plano ?? null;
  
  const parts: string[] = [
    `Paciente ${patient.nome} (${patient.idade} anos), leito ${patient.leito}.`
  ];
  
  // Adicionar diagnóstico principal se disponível
  if (patient.diagnosticoPrincipal) {
    parts.push(`Diagnóstico: ${patient.diagnosticoPrincipal}.`);
  }
  
  // Adicionar risco de mortalidade se disponível
  if (patient.riscoMortality24h !== undefined) {
    const riskPercent = Math.round(patient.riscoMortality24h * 100);
    parts.push(`Risco de mortalidade em 24h: ${riskPercent}%.`);
  }
  
  // Adicionar status clínico se disponível
  if (structured.statusClinico) {
    parts.push(`Encontra-se ${status}.`);
  }
  
  // Adicionar informações adicionais se disponíveis
  if (structured.diureseAdequada === true) {
    parts.push("Diurese adequada.");
  } else if (structured.diureseAdequada === false) {
    parts.push("Diurese inadequada.");
  }
  
  if (structured.sinaisVitaisBons === true) {
    parts.push("Sinais vitais bons.");
  } else if (structured.sinaisVitaisBons === false) {
    parts.push("Sinais vitais alterados.");
  }
  
  // Adicionar exames recentes se disponível
  if (structured.examesRecentes) {
    parts.push(`Exames recentes: ${structured.examesRecentes}.`);
  }
  
  // Adicionar radiologia se disponível
  if (structured.radiologia) {
    parts.push(`Radiologia: ${structured.radiologia}.`);
  }
  
  // Adicionar plano
  if (plano) {
    parts.push(`Plano: ${plano}`);
  }
  
  // Se não houver informações suficientes, adicionar mensagem padrão
  if (parts.length <= 2) {
    parts.push("Avaliação clínica realizada via nota de voz.");
  }
  
  return parts.join(" ");
}

/**
 * Constrói um resumo em português a partir dos dados estruturados da nota de voz
 */
export function buildVoiceNoteSummary(patient: Patient, structured: any): string {
  const parts: string[] = [];
  
  // Nome e leito
  const bedNumber = structured.bed || patient.leito.replace(/\D/g, '') || '';
  parts.push(`Paciente ${patient.nome}${bedNumber ? `, leito ${bedNumber}` : ''}.`);
  
  // Status clínico
  if (structured.statusClinico) {
    const statusMap: Record<string, string> = {
      'estavel': 'estável',
      'instavel': 'instável',
      'melhorando': 'em melhora',
      'piorando': 'em piora',
      'critico': 'crítico'
    };
    const statusText = statusMap[structured.statusClinico] || structured.statusClinico;
    parts.push(`Estado clínico: ${statusText}.`);
  }
  
  // Diurese e sinais vitais
  const statusDetails: string[] = [];
  if (structured.diureseAdequada === true) {
    statusDetails.push('diurese adequada');
  }
  if (structured.sinaisVitaisBons === true) {
    statusDetails.push('sinais vitais bons');
  }
  if (statusDetails.length > 0) {
    parts.push(statusDetails.join(', ').charAt(0).toUpperCase() + statusDetails.join(', ').slice(1) + '.');
  }
  
  // Plano
  if (structured.plano) {
    parts.push(`Plano: ${structured.plano}.`);
  }
  
  // Se não houver informações suficientes, criar um resumo básico
  if (parts.length === 1) {
    parts.push('Avaliação clínica realizada via nota de voz.');
  }
  
  return parts.join(' ');
}

/**
 * Adiciona um evento de nota de voz na timeline do paciente
 */
export function addVoiceNoteToTimeline(
  patientId: string,
  structuredData: any,
  rawText: string
): TimelineEvent | null {
  try {
    const history = getPatientHistoryById(patientId);
    if (!history) {
      console.warn(`Histórico não encontrado para paciente ${patientId}`);
      return null;
    }
    
    const now = new Date();
    
    // Construir descrição baseada nos dados estruturados
    const descriptionParts: string[] = [];
    
    if (structuredData.statusClinico) {
      descriptionParts.push(`Status: ${structuredData.statusClinico}`);
    }
    
    if (structuredData.ventilation?.fio2) {
      descriptionParts.push(`FiO₂: ${(structuredData.ventilation.fio2 * 100).toFixed(0)}%`);
    }
    
    if (structuredData.drugs && structuredData.drugs.length > 0) {
      const drugsList = structuredData.drugs
        .map((d: any) => `${d.name} ${d.dose || ''} ${d.unit || ''}`)
        .join(", ");
      descriptionParts.push(`Drogas: ${drugsList}`);
    }
    
    if (structuredData.plano) {
      descriptionParts.push(`Plano: ${structuredData.plano.substring(0, 40)}`);
    }
    
    const description = descriptionParts.join(" • ") || rawText.substring(0, 90);
    
    // Determinar severidade baseada no status clínico
    let severity: "normal" | "warning" | "critical" = "normal";
    if (structuredData.statusClinico === "critico" || structuredData.statusClinico === "instavel") {
      severity = "critical";
    } else if (structuredData.statusClinico === "moderado") {
      severity = "warning";
    }
    
    const event: TimelineEvent = {
      id: `voice-note-${patientId}-${now.getTime()}`,
      type: "note",
      title: "Nota de voz do plantonista",
      description: description.substring(0, 90),
      timestamp: now.toISOString(),
      severity,
    };
    
    // Adicionar evento à timeline (em produção, isso seria uma chamada à API)
    // Por enquanto, apenas retornamos o evento
    // A timeline será atualizada quando o snapshot for recarregado
    
    return event;
  } catch (error) {
    console.error("Erro ao adicionar nota de voz à timeline:", error);
    return null;
  }
}

/**
 * Atualiza o snapshot do paciente com dados estruturados da nota de voz
 */
export function updatePatientFromVoiceNote(
  patientId: string,
  structuredData: any
): Partial<Patient> | null {
  try {
    const snapshot = patientsSnapshots[patientId];
    if (!snapshot) {
      console.warn(`Snapshot não encontrado para paciente ${patientId}`);
      return null;
    }
    
    const updates: Partial<Patient> = {};
    
    // Atualizar ventilação se presente
    if (structuredData.ventilation) {
      const vent = structuredData.ventilation;
      if (vent.fio2 !== null && vent.fio2 !== undefined) {
        updates.ventilationParams = {
          ...snapshot.ventilationParams,
          fiO2: Math.round(vent.fio2 * 100), // Converter de decimal para porcentagem
          ...(vent.fr !== null && vent.fr !== undefined && { frequenciaRespiratoria: vent.fr }),
          ...(vent.mode && { modo: vent.mode }),
          ...(vent.param2 !== null && vent.param2 !== undefined && snapshot.ventilationParams && { 
            peep: vent.param2 // Assumindo que param2 é PEEP
          }),
        };
      }
    }
    
    // Atualizar drogas se presentes
    if (structuredData.drugs && structuredData.drugs.length > 0) {
      const existingMeds = [...(snapshot.medications || [])];
      
      structuredData.drugs.forEach((drug: any) => {
        const existingIndex = existingMeds.findIndex(
          (m: any) => m.nome.toLowerCase() === drug.name.toLowerCase()
        );
        
        if (existingIndex >= 0) {
          // Atualizar droga existente
          existingMeds[existingIndex] = {
            ...existingMeds[existingIndex],
            dose: drug.dose || existingMeds[existingIndex].dose,
            unidade: drug.unit || existingMeds[existingIndex].unidade,
            ativo: true,
          };
        } else {
          // Adicionar nova droga
          const isVasopressor = drug.name.toLowerCase().includes("adrenalina") || 
                                drug.name.toLowerCase().includes("noradrenalina") ||
                                drug.name.toLowerCase().includes("dopamina") ||
                                drug.name.toLowerCase().includes("dobutamina");
          
          const isSedation = drug.name.toLowerCase().includes("fentanil") ||
                            drug.name.toLowerCase().includes("midazolam") ||
                            drug.name.toLowerCase().includes("fenta") ||
                            drug.name.toLowerCase().includes("mida");
          
          existingMeds.push({
            id: `med-${Date.now()}-${Math.random()}`,
            nome: drug.name,
            tipo: isVasopressor ? "vasopressor" : isSedation ? "sedativo" : "outro",
            dose: drug.dose || 0,
            unidade: drug.unit || (isVasopressor ? "mcg/kg/min" : null),
            via: "EV",
            frequencia: "contínuo",
            diasDeUso: 0,
            inicio: new Date().toISOString(),
            ativo: true,
          });
        }
      });
      
      updates.medications = existingMeds;
    }
    
    // Atualizar última atualização
    updates.ultimaAtualizacao = new Date().toISOString();
    
    // Aplicar atualizações ao snapshot (em produção, isso seria uma chamada à API)
    Object.assign(snapshot, updates);
    
    return updates;
  } catch (error) {
    console.error("Erro ao atualizar paciente com nota de voz:", error);
    return null;
  }
}

/**
 * Processa uma nota de voz completa: adiciona evento na timeline e atualiza snapshot
 */
export function processVoiceNote(
  patientId: string,
  structuredData: any,
  rawText: string,
  patient?: Patient
): { event: TimelineEvent | null; updates: Partial<Patient> | null; summary: string | null } {
  const event = addVoiceNoteToTimeline(patientId, structuredData, rawText);
  let updates = updatePatientFromVoiceNote(patientId, structuredData);
  
  // Gerar resumo se o paciente estiver disponível
  let summary: string | null = null;
  if (patient) {
    summary = buildVoiceNoteSummary(patient, structuredData);
    // Garantir que summary é uma string válida
    if (summary && typeof summary === 'string') {
      if (!updates) {
        // Se não houver updates, criar objeto com apenas o summary
        updates = { voiceNoteSummary: summary };
      } else {
        updates.voiceNoteSummary = summary;
      }
    } else {
      console.warn("Resumo gerado não é uma string válida:", summary);
    }
  }
  
  return { event, updates, summary };
}

