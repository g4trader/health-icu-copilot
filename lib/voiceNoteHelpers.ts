/**
 * Helpers para processar notas de voz e atualizar dados do paciente
 */

import type { TimelineEvent } from "@/types/MockPatientHistory";
import { getPatientHistoryById } from "./mockPatients/history";

/**
 * Cria um evento de timeline a partir de dados estruturados de uma nota de voz
 */
export function createVoiceNoteTimelineEvent(
  patientId: string,
  structuredData: any,
  rawText: string
): TimelineEvent {
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
  
  return {
    id: `voice-note-${patientId}-${now.getTime()}`,
    type: "note",
    title: "Evolução clínica (nota de voz)",
    description: description.substring(0, 90),
    timestamp: now.toISOString(),
    severity,
  };
}

/**
 * Aplica dados estruturados de uma nota de voz ao snapshot do paciente
 * Retorna um objeto com as atualizações a serem aplicadas
 */
export function applyVoiceNoteToPatient(
  patient: any,
  structuredData: any
): Partial<any> {
  const updates: any = {};
  
  // Atualizar ventilação se presente
  if (structuredData.ventilation) {
    const vent = structuredData.ventilation;
    if (vent.fio2 !== null && vent.fio2 !== undefined) {
      updates.ventilationParams = {
        ...patient.ventilationParams,
        fiO2: Math.round(vent.fio2 * 100), // Converter de decimal para porcentagem
        ...(vent.fr !== null && vent.fr !== undefined && { frequenciaRespiratoria: vent.fr }),
        ...(vent.mode && { modo: vent.mode }),
      };
    }
  }
  
  // Atualizar drogas se presentes
  if (structuredData.drugs && structuredData.drugs.length > 0) {
    // Adicionar ou atualizar drogas vasoativas
    const existingMeds = [...(patient.medications || [])];
    
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
        existingMeds.push({
          id: `med-${Date.now()}-${Math.random()}`,
          nome: drug.name,
          tipo: drug.name.toLowerCase().includes("adrenalina") || 
                drug.name.toLowerCase().includes("noradrenalina") ||
                drug.name.toLowerCase().includes("dopamina") ||
                drug.name.toLowerCase().includes("dobutamina")
            ? "vasopressor"
            : "outro",
          dose: drug.dose || 0,
          unidade: drug.unit || "mcg/kg/min",
          via: "EV",
          frequencia: "contínuo",
          diasDeUso: 0,
          ativo: true,
        });
      }
    });
    
    updates.medications = existingMeds;
  }
  
  // Atualizar status clínico (se houver campo para isso)
  if (structuredData.statusClinico) {
    // Pode ser usado para atualizar tags ou outros campos
    updates.tags = [
      ...(patient.tags || []),
      ...(structuredData.statusClinico ? [`status: ${structuredData.statusClinico}`] : []),
    ].filter((tag, index, self) => self.indexOf(tag) === index); // Remover duplicatas
  }
  
  // Atualizar última atualização
  updates.ultimaAtualizacao = new Date().toISOString();
  
  return updates;
}

/**
 * Obtém o histórico do paciente e adiciona um evento de nota de voz
 * Nota: Em produção, isso seria uma chamada à API para atualizar o banco de dados
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
    
    const event = createVoiceNoteTimelineEvent(patientId, structuredData, rawText);
    
    // Em um sistema real, isso seria uma chamada à API
    // Por enquanto, apenas retornamos o evento para ser usado no frontend
    return event;
  } catch (error) {
    console.error("Erro ao adicionar nota de voz à timeline:", error);
    return null;
  }
}

