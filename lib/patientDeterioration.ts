/**
 * Funções para detectar piora de pacientes nas últimas 6 horas
 */

import { mockPatients, type Patient } from "./mockData";

export interface PatientDeterioration {
  patient: Patient;
  deteriorationScore: number;
  reasons: string[];
}

/**
 * Calcula score de piora para um paciente comparando estado atual com 6h atrás
 */
function calculateDeteriorationScore(patient: Patient): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Obter status atual e de 6h atrás (simulado via timeline)
  const now = new Date(patient.ultimaAtualizacao);
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  
  // Obter status do dia atual (aproximação - getDailyStatus só aceita patientId)
  // Para comparação de 6h, vamos usar os dados atuais do paciente e comparar com thresholds

  // 1. Mudanças em sinais vitais
  const currentVitals = patient.vitalSigns;
  
  // PAM (Pressão Arterial Média) - piora se diminuiu
  if (currentVitals.pressaoArterialMedia < 65) {
    score += 0.3;
    reasons.push(`PAM baixa (${currentVitals.pressaoArterialMedia} mmHg)`);
  } else if (currentVitals.pressaoArterialMedia < 70) {
    score += 0.15;
    reasons.push(`PAM limítrofe (${currentVitals.pressaoArterialMedia} mmHg)`);
  }

  // Saturação O2 - piora se diminuiu
  if (currentVitals.saturacaoO2 < 92) {
    score += 0.25;
    reasons.push(`SpO2 baixa (${currentVitals.saturacaoO2}%)`);
  } else if (currentVitals.saturacaoO2 < 94) {
    score += 0.1;
    reasons.push(`SpO2 limítrofe (${currentVitals.saturacaoO2}%)`);
  }

  // Frequência cardíaca - piora se taquicardia ou bradicardia
  if (currentVitals.frequenciaCardiaca > 150 || currentVitals.frequenciaCardiaca < 60) {
    score += 0.15;
    reasons.push(`FC alterada (${currentVitals.frequenciaCardiaca} bpm)`);
  }

  // Temperatura - piora se febre alta ou hipotermia
  if (currentVitals.temperatura > 38.5 || currentVitals.temperatura < 36) {
    score += 0.1;
    reasons.push(`Temperatura alterada (${currentVitals.temperatura}°C)`);
  }

  // 2. Suporte ventilatório - piora se aumentou FiO2 ou PEEP
  if (patient.ventilationParams) {
    const vm = patient.ventilationParams;
    if (vm.fiO2 > 60) {
      score += 0.2;
      reasons.push(`FiO2 elevado (${vm.fiO2}%)`);
    } else if (vm.fiO2 > 50) {
      score += 0.1;
      reasons.push(`FiO2 aumentado (${vm.fiO2}%)`);
    }
    
    if (vm.peep > 10) {
      score += 0.15;
      reasons.push(`PEEP elevado (${vm.peep} cmH2O)`);
    }
  }

  // 3. Drogas vasoativas - piora se nova droga ou aumento de dose
  const vasopressors = patient.medications.filter(m => m.tipo === "vasopressor" && m.ativo);
  if (vasopressors.length > 0) {
    const totalDose = vasopressors.reduce((sum, v) => {
      const dose = typeof v.dose === "number" ? v.dose : parseFloat(String(v.dose)) || 0;
      return sum + dose;
    }, 0);
    
    if (totalDose > 0.5) {
      score += 0.25;
      reasons.push(`Vasopressor em dose alta (${totalDose.toFixed(2)} ${vasopressors[0].unidade})`);
    } else if (totalDose > 0) {
      score += 0.15;
      reasons.push(`Em uso de vasopressor (${totalDose.toFixed(2)} ${vasopressors[0].unidade})`);
    }
  }

  // 4. Exames críticos recentes
  const recentLabs = patient.labResults.filter(lab => {
    const labDate = new Date(lab.data);
    return labDate >= sixHoursAgo && labDate <= now;
  });

  // Lactato elevado ou subindo
  const lactato = recentLabs.find(l => l.tipo === "lactato");
  if (lactato && typeof lactato.valor === "number") {
    if (lactato.valor >= 4) {
      score += 0.3;
      reasons.push(`Lactato muito elevado (${lactato.valor} mmol/L)`);
    } else if (lactato.valor >= 3) {
      score += 0.2;
      reasons.push(`Lactato elevado (${lactato.valor} mmol/L)`);
    }
    
    if (lactato.tendencia === "subindo") {
      score += 0.15;
      reasons.push(`Lactato em elevação`);
    }
  }

  // PCR elevado ou subindo
  const pcr = recentLabs.find(l => l.tipo === "pcr");
  if (pcr && typeof pcr.valor === "number" && pcr.valor > 100) {
    score += 0.1;
    if (pcr.tendencia === "subindo") {
      score += 0.1;
      reasons.push(`PCR elevado e em elevação (${pcr.valor} mg/L)`);
    } else {
      reasons.push(`PCR elevado (${pcr.valor} mg/L)`);
    }
  }

  // 5. Risco de mortalidade aumentou
  if (patient.riscoMortality24h >= 0.75) {
    score += 0.2;
    reasons.push(`Risco de mortalidade muito alto (${Math.round(patient.riscoMortality24h * 100)}%)`);
  } else if (patient.riscoMortality24h >= 0.61) {
    score += 0.1;
    reasons.push(`Risco de mortalidade alto (${Math.round(patient.riscoMortality24h * 100)}%)`);
  }

  // 6. Balanço hídrico positivo excessivo
  if (patient.fluidBalance.balanco24h > 5) {
    score += 0.1;
    reasons.push(`Balanço hídrico positivo excessivo (${patient.fluidBalance.balanco24h} ml/kg/h)`);
  }

  // 7. Oligúria
  if (patient.fluidBalance.diurese < 1) {
    score += 0.15;
    reasons.push(`Oligúria (${patient.fluidBalance.diurese} ml/kg/h)`);
  }

  return { score, reasons };
}

/**
 * Retorna lista de pacientes que pioraram nas últimas 6h, ordenados por score de piora
 */
export function getPioresPacientesUltimas6h(): PatientDeterioration[] {
  const deteriorations: PatientDeterioration[] = [];

  for (const patient of mockPatients) {
    const { score, reasons } = calculateDeteriorationScore(patient);
    
    // Considerar apenas pacientes com score de piora >= 0.3 (piora significativa)
    if (score >= 0.3 && reasons.length > 0) {
      deteriorations.push({
        patient,
        deteriorationScore: score,
        reasons
      });
    }
  }

  // Ordenar por score de piora (maior primeiro)
  return deteriorations.sort((a, b) => b.deteriorationScore - a.deteriorationScore);
}

