"use client";

import type { Patient } from "@/lib/mockData";
import { usePreview } from "./PreviewProvider";
import { PatientPinButton } from "./PatientPinButton";

interface PatientContextBarProps {
  activePatient: Patient | null;
  onClear: () => void;
}

export function PatientContextBar({ activePatient, onClear }: PatientContextBarProps) {
  const { setPreview } = usePreview();

  if (!activePatient) {
    return (
      <div className="patient-context-bar patient-context-bar-empty">
        <p className="patient-context-text">
          Nenhum paciente selecionado — selecione um paciente na lista à direita ou peça um resumo no chat.
        </p>
      </div>
    );
  }

  const hasVM = activePatient.ventilationParams !== undefined;
  const hasVaso = activePatient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  const risk24h = Math.round(activePatient.riscoMortality24h * 100);

  const handleViewDetails = () => {
    // Abre o drawer mantendo o paciente ativo (não limpa activePatientId)
    // O activePatientId já está definido quando este componente é renderizado
    setPreview('patient', { patient: activePatient });
  };

  return (
    <div className="patient-context-bar patient-context-bar-active">
      <div className="patient-context-info">
        <div className="patient-context-main">
          <strong className="patient-context-bed">{activePatient.leito}</strong>
          <span className="patient-context-name">{activePatient.nome}</span>
          <span className="patient-context-meta">
            {activePatient.idade} {activePatient.idade === 1 ? "ano" : "anos"} • {activePatient.diagnosticoPrincipal}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <PatientPinButton patient={activePatient} />
          <div className="patient-context-chips">
            <span className="patient-context-chip patient-context-chip-risk">
              Risco 24h: {risk24h}%
            </span>
            <span className="patient-context-chip">
              VM: {hasVM ? 'Sim' : 'Não'}
            </span>
            <span className="patient-context-chip">
              Vasopressor: {hasVaso ? 'Sim' : 'Não'}
            </span>
          </div>
        </div>
      </div>
      <div className="patient-context-actions">
        <button
          type="button"
          className="patient-context-action-btn"
          onClick={handleViewDetails}
        >
          Ver detalhes
        </button>
        <button
          type="button"
          className="patient-context-action-btn"
          onClick={onClear}
        >
          Limpar
        </button>
      </div>
    </div>
  );
}

