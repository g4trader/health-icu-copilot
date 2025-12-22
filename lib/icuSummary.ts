/**
 * Helpers para resumo da UTI
 * Funções utilitárias para montar o Context Snapshot
 */

import { mockPatients } from "./mockData";
import { calculateRiskScore, riskLevelFromScore } from "./mockData";

/**
 * Retorna o total de pacientes na UTI
 */
export function getTotalPatients(): number {
  return mockPatients.length;
}

/**
 * Retorna número de pacientes em ventilação mecânica
 */
export function getPatientsOnVentilation(): number {
  const onVM = mockPatients.filter(p => p.ventilationParams !== undefined);
  return onVM.length;
}

/**
 * Retorna número de pacientes em droga vasoativa
 */
export function getPatientsOnVasopressors(): number {
  const onVaso = mockPatients.filter(p => 
    p.medications.some(m => m.tipo === "vasopressor" && m.ativo)
  );
  return onVaso.length;
}

/**
 * Retorna número de pacientes em alto risco (riscoMortality24h >= 0.61)
 */
export function getHighRiskPatients(): number {
  // Alto risco: riscoMortality24h >= 0.61 (range padronizado: 0.61-1.00)
  const highRiskPatients = mockPatients.filter(p => {
    const isHighRisk = p.riscoMortality24h >= 0.61 || riskLevelFromScore(p.riscoMortality24h) === "alto";
    return isHighRisk;
  });
  
  return highRiskPatients.length;
}

/**
 * Retorna número de pacientes em risco moderado
 */
export function getModerateRiskPatients(): number {
  return mockPatients.filter(p => {
    const riskScore = calculateRiskScore(p);
    return riskLevelFromScore(riskScore) === "moderado";
  }).length;
}

/**
 * Retorna número de pacientes em risco baixo
 */
export function getLowRiskPatients(): number {
  return mockPatients.filter(p => {
    const riskScore = calculateRiskScore(p);
    return riskLevelFromScore(riskScore) === "baixo";
  }).length;
}

/**
 * Retorna número de pacientes em ventilação invasiva vs não invasiva
 * CMV e SIMV são considerados invasivos; PSV, CPAP, BiPAP, HFOV podem ser invasivos ou não invasivos
 * Por simplicidade, consideramos CMV e SIMV como invasivos, e os demais como não invasivos
 */
export function getVentilationBreakdown(): { invasive: number; nonInvasive: number; total: number } {
  const onVM = mockPatients.filter(p => p.ventilationParams !== undefined);
  const invasive = onVM.filter(p => {
    const vm = p.ventilationParams;
    // CMV e SIMV são modos invasivos típicos
    return vm && (vm.modo === "CMV" || vm.modo === "SIMV");
  }).length;
  const nonInvasive = onVM.length - invasive;
  return { invasive, nonInvasive, total: onVM.length };
}

/**
 * Retorna número de leitos ocupados (total de pacientes)
 */
export function getOccupiedBeds(): number {
  return mockPatients.length;
}

/**
 * Retorna número de admissões nas últimas 24h (mock - pacientes com diasDeUTI <= 1)
 */
export function getAdmissionsLast24h(): number {
  return mockPatients.filter(p => (p.diasDeUTI || 0) <= 1).length;
}

/**
 * Retorna número de altas previstas nas próximas 24h (mock - pacientes de baixo risco sem VM/vaso)
 */
export function getDischargesNext24h(): number {
  return mockPatients.filter(p => {
    const hasVM = !!p.ventilationParams;
    const hasVaso = p.medications.some(m => m.tipo === "vasopressor" && m.ativo);
    const riskScore = calculateRiskScore(p);
    const isLowRisk = riskLevelFromScore(riskScore) === "baixo";
    return isLowRisk && !hasVM && !hasVaso;
  }).length;
}




