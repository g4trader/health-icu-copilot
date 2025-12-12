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
  return mockPatients.filter(p => p.ventilationParams !== undefined).length;
}

/**
 * Retorna número de pacientes em droga vasoativa
 */
export function getPatientsOnVasopressors(): number {
  return mockPatients.filter(p => 
    p.medications.some(m => m.tipo === "vasopressor" && m.ativo)
  ).length;
}

/**
 * Retorna número de pacientes em alto risco (score >= 0.7)
 */
export function getHighRiskPatients(): number {
  return mockPatients.filter(p => {
    const riskScore = calculateRiskScore(p);
    return riskLevelFromScore(riskScore) === "alto" || p.riscoMortality24h >= 0.7;
  }).length;
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

