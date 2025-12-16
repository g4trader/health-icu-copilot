"use client";

import type { Patient } from "@/lib/mockData";

interface TherapiesPanelProps {
  patient: Patient;
}

export function TherapiesPanel({ patient }: TherapiesPanelProps) {
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  const antibioticos = patient.medications.filter(m => m.tipo === "antibiotico" && m.ativo);

  return (
    <div className="mini-panel therapies-panel">
      {hasVaso && (
        <div className="mini-panel-section">
          <h4 className="mini-panel-title">Drogas Vasoativas</h4>
          <div className="medications-list">
            {patient.medications
              .filter(m => m.tipo === "vasopressor" && m.ativo)
              .map(m => (
                <div key={m.id} className="medication-item">
                  <strong>{m.nome}</strong>: {m.dose} {m.unidade}
                </div>
              ))}
          </div>
        </div>
      )}

      {antibioticos.length > 0 && (
        <div className="mini-panel-section">
          <h4 className="mini-panel-title">Antibióticos</h4>
          <div className="medications-list">
            {antibioticos.map(m => (
              <div key={m.id} className="medication-item">
                <strong>{m.nome}</strong>: {m.dose} {m.unidade} • D{m.diasDeUso || 0}
              </div>
            ))}
          </div>
        </div>
      )}

      {patient.ventilationParams && (
        <div className="mini-panel-section">
          <h4 className="mini-panel-title">Ventilação Mecânica</h4>
          <div className="ventilation-params">
            <div className="vent-param">
              <span className="vent-label">Modo:</span>
              <span className="vent-value">{patient.ventilationParams.modo}</span>
            </div>
            <div className="vent-param">
              <span className="vent-label">FiO₂:</span>
              <span className="vent-value">{patient.ventilationParams.fiO2}%</span>
            </div>
            <div className="vent-param">
              <span className="vent-label">PEEP:</span>
              <span className="vent-value">{patient.ventilationParams.peep} cmH₂O</span>
            </div>
            {patient.ventilationParams.pressaoSuporte && (
              <div className="vent-param">
                <span className="vent-label">Pressão de Suporte:</span>
                <span className="vent-value">{patient.ventilationParams.pressaoSuporte} cmH₂O</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}




