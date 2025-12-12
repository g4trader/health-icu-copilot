"use client";

import {
  getTotalPatients,
  getPatientsOnVentilation,
  getPatientsOnVasopressors,
  getHighRiskPatients
} from "@/lib/icuSummary";
import { usePreview } from "./PreviewProvider";
import { mockPatients } from "@/lib/mockData";

interface ContextSnapshotProps {
  onPromptClick: (prompt: string) => void;
}

const quickPrompts = [
  "Quais são os 3 pacientes mais graves nas próximas 24h?",
  "Me dê um resumo do paciente da UTI 03",
  "Como está o perfil de germes da unidade?",
  "Mostre os exames laboratoriais recentes",
  "Calcule a manutenção hídrica para uma criança de 12 kg"
];

export function ContextSnapshot({ onPromptClick }: ContextSnapshotProps) {
  const { setPreview } = usePreview();
  const totalPatients = getTotalPatients();
  const onVentilation = getPatientsOnVentilation();
  const onVasopressors = getPatientsOnVasopressors();
  const highRisk = getHighRiskPatients();

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
        </button>
        
        <button
          type="button"
          className="snapshot-card snapshot-card-clickable"
          onClick={() => setPreview('ventilated')}
        >
          <div className="snapshot-card-label">Em Ventilação Mecânica</div>
          <div className="snapshot-card-value">{onVentilation}</div>
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
          className="snapshot-card snapshot-card-highlight snapshot-card-clickable"
          onClick={() => setPreview('high-risk')}
        >
          <div className="snapshot-card-label">Alto Risco (24h)</div>
          <div className="snapshot-card-value snapshot-card-value-highlight">{highRisk}</div>
        </button>
      </div>

      <div className="quick-prompts-section">
        <div className="quick-prompts-label">Perguntas sugeridas:</div>
        <div className="quick-prompts">
          {quickPrompts.map((prompt, idx) => (
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

