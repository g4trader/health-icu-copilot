"use client";

import { usePreview, type PreviewPayload } from "./PreviewProvider";
import { mockPatients, getTopPatients, riskLevelFromScore, calculateRiskScore } from "@/lib/mockData";
import { getPatientsOnVentilation, getPatientsOnVasopressors, getHighRiskPatients } from "@/lib/icuSummary";
import type { Patient } from "@/lib/mockData";

export function RightPreview() {
  const { previewType, previewPayload } = usePreview();

  if (!previewType) {
    return (
      <aside className="right-preview">
        <div className="preview-content">
          <div className="preview-empty">
            <p>Selecione um paciente, um painel ou um indicador para ver detalhes aqui.</p>
          </div>
        </div>
      </aside>
    );
  }

  // Renderizar preview baseado no tipo
  switch (previewType) {
    case 'icu-overview':
      return <IcuOverviewPreview />;
    case 'ventilated':
      return <VentilatedPreview />;
    case 'vasopressors':
      return <VasopressorsPreview />;
    case 'high-risk':
      return <HighRiskPreview />;
    case 'patient':
      return <PatientPreview payload={previewPayload} />;
    default:
      return (
        <aside className="right-preview">
          <div className="preview-content">
            <div className="preview-empty">
              <p>Preview não disponível.</p>
            </div>
          </div>
        </aside>
      );
  }
}

function IcuOverviewPreview() {
  const totalPatients = mockPatients.length;
  const onVentilation = getPatientsOnVentilation();
  const onVasopressors = getPatientsOnVasopressors();
  const highRisk = getHighRiskPatients();

  return (
    <aside className="right-preview">
      <div className="preview-content">
        <div className="preview-header">
          <h3 className="preview-title">Visão Geral da UTI</h3>
        </div>
        <div className="preview-body">
          <div className="preview-stats">
            <div className="preview-stat">
              <div className="preview-stat-label">Total de Pacientes</div>
              <div className="preview-stat-value">{totalPatients}</div>
            </div>
            <div className="preview-stat">
              <div className="preview-stat-label">Em Ventilação Mecânica</div>
              <div className="preview-stat-value">{onVentilation}</div>
            </div>
            <div className="preview-stat">
              <div className="preview-stat-label">Em Droga Vasoativa</div>
              <div className="preview-stat-value">{onVasopressors}</div>
            </div>
            <div className="preview-stat">
              <div className="preview-stat-label">Alto Risco (24h)</div>
              <div className="preview-stat-value preview-stat-highlight">{highRisk}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function VentilatedPreview() {
  const ventilated = mockPatients.filter(p => p.ventilationParams !== undefined);

  return (
    <aside className="right-preview">
      <div className="preview-content">
        <div className="preview-header">
          <h3 className="preview-title">Pacientes em Ventilação Mecânica</h3>
        </div>
        <div className="preview-body">
          <div className="preview-list">
            {ventilated.map((p) => (
              <div key={p.id} className="preview-item">
                <div className="preview-item-header">
                  <strong>{p.leito}</strong> • {p.nome}
                </div>
                <div className="preview-item-details">
                  {p.ventilationParams && (
                    <div>VM: {p.ventilationParams.modo}, FiO2 {p.ventilationParams.fiO2}%, PEEP {p.ventilationParams.peep} cmH2O</div>
                  )}
                  <div>Risco 24h: {(p.riscoMortality24h * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function VasopressorsPreview() {
  const onVaso = mockPatients.filter(p => 
    p.medications.some(m => m.tipo === "vasopressor" && m.ativo)
  );

  return (
    <aside className="right-preview">
      <div className="preview-content">
        <div className="preview-header">
          <h3 className="preview-title">Pacientes em Droga Vasoativa</h3>
        </div>
        <div className="preview-body">
          <div className="preview-list">
            {onVaso.map((p) => {
              const vaso = p.medications.find(m => m.tipo === "vasopressor" && m.ativo);
              return (
                <div key={p.id} className="preview-item">
                  <div className="preview-item-header">
                    <strong>{p.leito}</strong> • {p.nome}
                  </div>
                  <div className="preview-item-details">
                    {vaso && <div>Vasopressor: {vaso.nome} {vaso.dose}</div>}
                    <div>MAP: {p.vitalSigns.pressaoArterialMedia} mmHg</div>
                    <div>Risco 24h: {(p.riscoMortality24h * 100).toFixed(0)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

function HighRiskPreview() {
  const highRisk = mockPatients.filter(p => {
    const riskScore = calculateRiskScore(p);
    return riskLevelFromScore(riskScore) === "alto" || p.riscoMortality24h >= 0.7;
  });

  return (
    <aside className="right-preview">
      <div className="preview-content">
        <div className="preview-header">
          <h3 className="preview-title">Pacientes em Alto Risco (24h)</h3>
        </div>
        <div className="preview-body">
          <div className="preview-list">
            {highRisk.map((p) => (
              <div key={p.id} className="preview-item">
                <div className="preview-item-header">
                  <strong>{p.leito}</strong> • {p.nome}
                </div>
                <div className="preview-item-details">
                  <div>Risco 24h: {(p.riscoMortality24h * 100).toFixed(0)}%</div>
                  <div>Diagnóstico: {p.diagnosticoPrincipal}</div>
                  {p.ventilationParams && <div>VM: Sim</div>}
                  {p.medications.some(m => m.tipo === "vasopressor" && m.ativo) && <div>Vasopressor: Sim</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function PatientPreview({ payload }: { payload: PreviewPayload | null }) {
  if (!payload || !payload.patient) {
    return (
      <aside className="right-preview">
        <div className="preview-content">
          <div className="preview-empty">
            <p>Dados do paciente não disponíveis.</p>
          </div>
        </div>
      </aside>
    );
  }

  const patient = payload.patient as Patient;
  return (
    <aside className="right-preview">
      <div className="preview-content">
        <div className="preview-header">
          <h3 className="preview-title">{patient.leito} • {patient.nome}</h3>
        </div>
        <div className="preview-body">
          <div className="preview-patient-details">
            <div><strong>Idade:</strong> {patient.idade} {patient.idade === 1 ? "ano" : "anos"}</div>
            <div><strong>Peso:</strong> {patient.peso?.toFixed(1) || "N/A"} kg</div>
            <div><strong>Diagnóstico:</strong> {patient.diagnosticoPrincipal}</div>
            <div><strong>Risco 24h:</strong> {(patient.riscoMortality24h * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

