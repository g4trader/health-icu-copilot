"use client";

import {
  getTotalPatients,
  getPatientsOnVentilation,
  getPatientsOnVasopressors,
  getHighRiskPatients,
  getVentilationBreakdown,
  getOccupiedBeds,
  getAdmissionsLast24h,
  getDischargesNext24h,
  getAdmissoes24h,
  getAltasPrevistas24h
} from "@/lib/icuSummary";
import { usePreview } from "./PreviewProvider";
import { mockPatients } from "@/lib/mockData";

interface ContextSnapshotProps {
  onPromptClick: (prompt: string) => void;
}

const quickAccessPrompts = [
  "Quais são os 3 pacientes mais graves nas próximas 24h e por quê?",
  "Quem piorou nas últimas 6h?",
  "Quais pacientes têm maior risco respiratório hoje?",
  "Me dê um resumo clínico das últimas 24h do paciente do leito 03."
];

export function ContextSnapshot({ onPromptClick }: ContextSnapshotProps) {
  const { setPreview } = usePreview();
  const totalPatients = getTotalPatients();
  const occupiedBeds = getOccupiedBeds();
  const ventilation = getVentilationBreakdown();
  const onVasopressors = getPatientsOnVasopressors();
  const highRisk = getHighRiskPatients();
  const admissions24h = getAdmissionsLast24h();
  const discharges24h = getDischargesNext24h();

  return (
    <div className="context-snapshot">
      <div className="snapshot-cards">
        <button
          type="button"
          className="snapshot-card snapshot-card-clickable"
          onClick={() => setPreview('allPatients', { patients: mockPatients })}
        >
          <div className="snapshot-card-label">Total de Pacientes</div>
          <div className="snapshot-card-value">{totalPatients}</div>
          <div className="snapshot-card-subtext">Leitos ocupados: {occupiedBeds}</div>
        </button>
        
        <button
          type="button"
          className="snapshot-card snapshot-card-clickable"
          onClick={() => setPreview('ventilated')}
        >
          <div className="snapshot-card-label">Em Ventilação Mecânica</div>
          <div className="snapshot-card-value">{ventilation.total}</div>
          {ventilation.total > 0 && (
            <div className="snapshot-card-subtext">
              {ventilation.invasive} invasiva • {ventilation.nonInvasive} não invasiva
            </div>
          )}
        </button>
        
        <button
          type="button"
          className="snapshot-card snapshot-card-clickable"
          onClick={() => setPreview('vasopressors')}
        >
          <div className="snapshot-card-label">Em Droga Vasoativa</div>
          <div className="snapshot-card-value">{onVasopressors}</div>
        </button>
        
        <button
          type="button"
          className="snapshot-card snapshot-card-highlight snapshot-card-clickable snapshot-card-alert"
          onClick={() => setPreview('high-risk')}
        >
          <div className="snapshot-card-label">Alto Risco (24h)</div>
          <div className="snapshot-card-value snapshot-card-value-highlight">{highRisk}</div>
          <div className="snapshot-card-subtext">Pacientes classificados como alto risco</div>
        </button>
        
        <button
          type="button"
          className="snapshot-card snapshot-card-clickable"
          onClick={() => setPreview('allPatients', { patients: getAdmissoes24h() })}
        >
          <div className="snapshot-card-label">Admissões (24h)</div>
          <div className="snapshot-card-value">{admissions24h}</div>
          <div className="snapshot-card-subtext">Últimas 24 horas</div>
        </button>
        
        <button
          type="button"
          className="snapshot-card snapshot-card-clickable"
          onClick={() => setPreview('allPatients', { patients: getAltasPrevistas24h() })}
        >
          <div className="snapshot-card-label">Altas Previstas (24h)</div>
          <div className="snapshot-card-value">{discharges24h}</div>
          <div className="snapshot-card-subtext">Próximas 24 horas</div>
        </button>
      </div>

      <div className="quick-prompts-section">
        <h3 className="prompts-block-title">Acesso rápido</h3>
        <div className="quick-prompts">
          {quickAccessPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="quick-prompt-chip"
              onClick={() => onPromptClick(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

