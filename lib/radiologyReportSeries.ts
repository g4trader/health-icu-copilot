import type { Patient } from "@/types/Patient";
import type { RadiologyReportSummary } from "@/types/RadiologyOpinion";
import { buildRadiologyReport } from "./radiologyOpinionBuilder";
import type { ExamType } from "@/types/RadiologyOpinion";

/**
 * Gera série de exames de imagem ao longo do tempo para um paciente
 * Retorna 2-3 exames mais recentes baseados no diagnóstico e evolução
 */
export function generateRadiologyReportSeries(
  patient: Patient,
  daysAgo: number[]
): RadiologyReportSummary[] {
  const reports: RadiologyReportSummary[] = [];
  const baseDate = new Date(patient.ultimaAtualizacao);
  
  // Detectar tipo de exame apropriado baseado no diagnóstico
  const diag = patient.diagnosticoPrincipal.toLowerCase();
  let examType: ExamType = 'chest-xray';
  
  if (diag.includes('trauma') || diag.includes('encefalopatia') || diag.includes('cranioencefalico')) {
    examType = 'head-ct';
  } else if (diag.includes('abdomen') || diag.includes('abdominal') || diag.includes('apendicite')) {
    examType = 'abdominal-ct';
  } else if (diag.includes('cardiopatia') || diag.includes('cardiaco')) {
    examType = 'echo';
  } else if (diag.includes('pneumonia') || diag.includes('bronquiolite') || diag.includes('respiratorio')) {
    examType = 'chest-xray';
  }
  
  // Gerar exames para cada dia especificado (mais antigo primeiro)
  for (let i = 0; i < daysAgo.length; i++) {
    const days = daysAgo[i];
    const examDate = new Date(baseDate);
    examDate.setDate(examDate.getDate() - days);
    const dateMock = examDate.toLocaleDateString('pt-BR');
    
    // Gerar report base (determinístico)
    const report = buildRadiologyReport(patient, examType);
    
    // Modificar o summary para refletir a evolução ao longo do tempo
    // Se for o primeiro (mais antigo), pode ter descrições mais graves
    // Se for o último (mais recente), pode ter descrições de melhora
    let impressionShort = report.summary.impressionShort;
    let correlationShort = report.summary.correlationShort;
    let keyFindings = [...report.summary.keyFindings];
    
    if (daysAgo.length > 1) {
      // Ajustar impressão baseado na posição na série (i = 0 é mais antigo)
      const progress = i / (daysAgo.length - 1); // 0 = mais antigo, 1 = mais recente
      
      if (progress < 0.33) {
        // Primeiros exames: mais grave
        const lowerImpression = impressionShort.toLowerCase();
        if (!lowerImpression.includes("grave") && !lowerImpression.includes("severa") && !lowerImpression.includes("extenso")) {
          impressionShort = "Quadro radiológico grave. " + impressionShort;
        }
        // Ajustar achados para parecer mais grave
        if (keyFindings.length > 0 && !keyFindings[0].toLowerCase().includes("extenso") && !keyFindings[0].toLowerCase().includes("grave")) {
          keyFindings[0] = "Achados extensos e graves: " + keyFindings[0];
        }
      } else if (progress > 0.66) {
        // Últimos exames: melhora
        const lowerImpression = impressionShort.toLowerCase();
        if (lowerImpression.includes("grave")) {
          impressionShort = impressionShort.replace(/grave/g, "melhora do quadro anterior");
        } else if (lowerImpression.includes("severa")) {
          impressionShort = impressionShort.replace(/severa/g, "melhora da condição");
        }
        if (!lowerImpression.includes("melhora") && !lowerImpression.includes("redução") && !lowerImpression.includes("reduzido")) {
          impressionShort = "Melhora parcial dos achados radiológicos. " + impressionShort;
        }
        // Ajustar achados para refletir melhora
        if (keyFindings.length > 0 && keyFindings[0].toLowerCase().includes("extenso")) {
          keyFindings[0] = keyFindings[0].replace(/extensos?/gi, "redução dos achados extensos");
        }
      }
    }
    
    const summary: RadiologyReportSummary = {
      ...report.summary,
      dateMock,
      timestamp: examDate.toISOString(),
      impressionShort,
      correlationShort,
      keyFindings
    };
    
    reports.push(summary);
  }
  
  // Retornar ordenado por data (mais recente primeiro)
  return reports.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Helper para obter série de exames de imagem para um paciente
 * Baseado no diagnóstico e dias de UTI
 */
export function getRadiologyReportSeriesForPatient(patient: Patient): RadiologyReportSummary[] {
  const diag = patient.diagnosticoPrincipal.toLowerCase();
  const daysInICU = patient.diasDeUTI;
  
  // Para diagnósticos respiratórios: 2-3 RX ao longo do tempo
  if (diag.includes('pneumonia') || diag.includes('bronquiolite') || diag.includes('respiratorio')) {
    if (daysInICU >= 5) {
      return generateRadiologyReportSeries(patient, [7, 4, 1]); // 3 exames
    } else if (daysInICU >= 3) {
      return generateRadiologyReportSeries(patient, [3, 1]); // 2 exames
    } else {
      return generateRadiologyReportSeries(patient, [1]); // 1 exame
    }
  }
  
  // Para sepse abdominal: 1-2 TCs de abdome
  if (diag.includes('abdomen') || diag.includes('abdominal') || diag.includes('apendicite')) {
    if (daysInICU >= 3) {
      return generateRadiologyReportSeries(patient, [4, 1]);
    } else {
      return generateRadiologyReportSeries(patient, [1]);
    }
  }
  
  // Para TCE: 2-3 TCs de crânio
  if (diag.includes('trauma') || diag.includes('cranioencefalico')) {
    if (daysInICU >= 6) {
      return generateRadiologyReportSeries(patient, [6, 3, 1]);
    } else if (daysInICU >= 3) {
      return generateRadiologyReportSeries(patient, [3, 1]);
    } else {
      return generateRadiologyReportSeries(patient, [1]);
    }
  }
  
  // Default: 1 exame recente
  return generateRadiologyReportSeries(patient, [1]);
}

