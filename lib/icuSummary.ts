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
  console.log('[icuSummary] Patients on VM:', onVM.map(p => ({ id: p.id, nome: p.nome })));
  return onVM.length;
}

/**
 * Retorna número de pacientes em droga vasoativa
 */
export function getPatientsOnVasopressors(): number {
  const onVaso = mockPatients.filter(p => 
    p.medications.some(m => m.tipo === "vasopressor" && m.ativo)
  );
  console.log('[icuSummary] Patients on Vasopressor:', onVaso.map(p => ({ id: p.id, nome: p.nome })));
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
  
  // Log para debug
  console.log('[icuSummary] High Risk Patients:', highRiskPatients.map(p => ({
    id: p.id,
    nome: p.nome,
    risco24h: p.riscoMortality24h,
    riskLevel: riskLevelFromScore(p.riscoMortality24h)
  })));
  
  // Log de todos os pacientes com seus riscos
  console.log('[icuSummary] All Patients Risk:', mockPatients.map(p => ({
    id: p.id,
    nome: p.nome,
    risco24h: p.riscoMortality24h,
    riskLevel: riskLevelFromScore(p.riscoMortality24h),
    hasVM: !!p.ventilationParams,
    hasVaso: p.medications.some(m => m.tipo === "vasopressor" && m.ativo)
  })));
  
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




