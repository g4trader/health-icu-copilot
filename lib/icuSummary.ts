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




