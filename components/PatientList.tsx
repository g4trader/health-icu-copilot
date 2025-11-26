"use client";

import { getSortedByMortalityRisk24h, riskLevelFromScore } from "@/lib/mockData";
import type { Patient } from "@/lib/mockData";

interface Props {
  onSelectPatient?: (patient: Patient) => void;
  selectedPatientId?: string | null;
}

export function PatientList({ onSelectPatient, selectedPatientId }: Props) {
  const sorted = getSortedByMortalityRisk24h();

  return (
    <div className="patients-list">
      {sorted.map((p) => {
        const riskLevel = riskLevelFromScore(p.riscoMortality24h);
        const riskClass =
          riskLevel === "alto"
            ? "risk-high"
            : riskLevel === "moderado"
            ? "risk-medium"
            : "risk-low";

        return (
          <button
            key={p.id}
            type="button"
            className={`patient-card ${riskLevel === "alto" ? "risk-high-card" : ""}`}
            style={
              selectedPatientId === p.id
                ? { borderColor: "#059669", boxShadow: "0 0 0 1px #059669" }
                : undefined
            }
            onClick={() => onSelectPatient?.(p)}
          >
            <div className="patient-header">
              <div className="patient-name">
                {p.nome} <span className="patient-meta">• {p.leito}</span>
              </div>
              <span className={`risk-pill ${riskClass}`}>
                risco {riskLevel}
              </span>
            </div>
            <div className="patient-meta">
              {p.idade} anos • {p.diagnosticoPrincipal}
            </div>
            <div className="patient-score">
              Risco 24h: {(p.riscoMortality24h * 100).toFixed(0)}% • SOFA{" "}
              {p.sofa} • Lactato {p.lactato.toFixed(1)} mmol/L • tendência:{" "}
              {p.tendenciaLactato}
            </div>
            <div className="patient-meta" style={{ marginTop: "0.2rem" }}>
              {p.diasDeUTI} {p.diasDeUTI === 1 ? "dia" : "dias"} de UTI
              {p.emAntibiotico && (
                <span> • Antibiótico (D{p.diasEmAntibioticoAtual})</span>
              )}
            </div>
            <div className="patient-tags">
              {p.tags.map((t) => (
                <span key={t} className="patient-tag">
                  {t}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
