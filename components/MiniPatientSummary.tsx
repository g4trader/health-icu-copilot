"use client";

import type { Patient } from "@/lib/mockData";

interface MiniPatientSummaryProps {
  patient: Patient;
}

export function MiniPatientSummary({ patient }: MiniPatientSummaryProps) {
  const hasVM = patient.ventilationParams !== undefined;
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  const risk24h = Math.round(patient.riscoMortality24h * 100);

  return (
    <div className="mini-patient-summary">
      <div className="mini-patient-header">
        <div>
          <div className="mini-patient-bed">{patient.leito}</div>
          <div className="mini-patient-name">{patient.nome}</div>
          <div className="mini-patient-meta">
            {patient.idade} anos • {patient.diagnosticoPrincipal}
          </div>
        </div>
        <div className="mini-patient-chips">
          <span className="mini-patient-chip mini-patient-chip-risk">
            Risco 24h: {risk24h}%
          </span>
          <span className={`mini-patient-chip ${hasVM ? 'mini-patient-chip-active' : ''}`}>
            VM: {hasVM ? 'Sim' : 'Não'}
          </span>
          <span className={`mini-patient-chip ${hasVaso ? 'mini-patient-chip-active' : ''}`}>
            Vasopressor: {hasVaso ? 'Sim' : 'Não'}
          </span>
        </div>
      </div>
    </div>
  );
}

