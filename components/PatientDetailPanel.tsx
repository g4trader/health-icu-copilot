"use client";

import type { Patient } from "@/lib/mockData";
import { PatientPinButton } from "./PatientPinButton";

interface PatientDetailPanelProps {
  patient: Patient;
}

export function PatientDetailPanel({ patient }: PatientDetailPanelProps) {
  const hasVM = patient.ventilationParams !== undefined;
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  const antibioticos = patient.medications.filter(m => m.tipo === "antibiotico" && m.ativo);
  const risk24h = Math.round(patient.riscoMortality24h * 100);
  const risk7d = Math.round(patient.riscoMortality7d * 100);

  // Buscar exames laboratoriais recentes
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  const pcr = patient.labResults.find(l => l.tipo === "pcr");

  return (
    <div className="patient-detail-panel">
      {/* Resumo */}
      <div className="detail-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h4 className="detail-section-title">Resumo</h4>
          <PatientPinButton patient={patient} />
        </div>
        <div className="detail-summary">
          <div className="detail-row">
            <span className="detail-label">Leito:</span>
            <span className="detail-value">{patient.leito}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Nome:</span>
            <span className="detail-value">{patient.nome}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Idade:</span>
            <span className="detail-value">{patient.idade} {patient.idade === 1 ? "ano" : "anos"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Peso:</span>
            <span className="detail-value">{patient.peso.toFixed(1)} kg</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Diagnóstico:</span>
            <span className="detail-value">{patient.diagnosticoPrincipal}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Dias de UTI:</span>
            <span className="detail-value">{patient.diasDeUTI} {patient.diasDeUTI === 1 ? "dia" : "dias"}</span>
          </div>
        </div>
        <div className="detail-chips">
          <span className="detail-chip detail-chip-risk">
            Risco 24h: {risk24h}%
          </span>
          <span className="detail-chip detail-chip-risk">
            Risco 7d: {risk7d}%
          </span>
          <span className={`detail-chip ${hasVM ? 'detail-chip-active' : ''}`}>
            VM: {hasVM ? 'Sim' : 'Não'}
          </span>
          <span className={`detail-chip ${hasVaso ? 'detail-chip-active' : ''}`}>
            Vasopressor: {hasVaso ? 'Sim' : 'Não'}
          </span>
        </div>
      </div>

      {/* Sinais Vitais */}
      <div className="detail-section">
        <h4 className="detail-section-title">Sinais Vitais</h4>
        <div className="vitals-grid">
          <div className="vital-card">
            <div className="vital-label">MAP</div>
            <div className={`vital-value ${patient.vitalSigns.pressaoArterialMedia < 65 ? 'vital-critical' : ''}`}>
              {patient.vitalSigns.pressaoArterialMedia} mmHg
            </div>
          </div>
          <div className="vital-card">
            <div className="vital-label">FC</div>
            <div className="vital-value">{patient.vitalSigns.frequenciaCardiaca} bpm</div>
          </div>
          <div className="vital-card">
            <div className="vital-label">FR</div>
            <div className="vital-value">{patient.vitalSigns.frequenciaRespiratoria} rpm</div>
          </div>
          <div className="vital-card">
            <div className="vital-label">SpO₂</div>
            <div className={`vital-value ${patient.vitalSigns.saturacaoO2 < 92 ? 'vital-critical' : ''}`}>
              {patient.vitalSigns.saturacaoO2}%
            </div>
          </div>
          <div className="vital-card">
            <div className="vital-label">Temp</div>
            <div className="vital-value">{patient.vitalSigns.temperatura.toFixed(1)} °C</div>
          </div>
        </div>
      </div>

      {/* Exames Laboratoriais */}
      <div className="detail-section">
        <h4 className="detail-section-title">Exames Laboratoriais</h4>
        <div className="lab-results">
          {lactato && (
            <div className="lab-item">
              <span className="lab-label">Lactato:</span>
              <span className={`lab-value ${typeof lactato.valor === 'number' && lactato.valor >= 3 ? 'lab-critical' : ''}`}>
                {typeof lactato.valor === 'number' ? lactato.valor.toFixed(1) : lactato.valor} mmol/L
              </span>
              {lactato.tendencia && (
                <span className="lab-trend">
                  {lactato.tendencia === 'subindo' ? '↑' : lactato.tendencia === 'caindo' ? '↓' : '='}
                </span>
              )}
            </div>
          )}
          {pcr && (
            <div className="lab-item">
              <span className="lab-label">PCR:</span>
              <span className="lab-value">
                {typeof pcr.valor === 'number' ? pcr.valor.toFixed(1) : pcr.valor} mg/L
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Terapias / Prescrições */}
      {hasVaso && (
        <div className="detail-section">
          <h4 className="detail-section-title">Drogas Vasoativas</h4>
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
        <div className="detail-section">
          <h4 className="detail-section-title">Antibióticos</h4>
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
        <div className="detail-section">
          <h4 className="detail-section-title">Ventilação Mecânica</h4>
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

      {/* Balanço Hídrico */}
      <div className="detail-section">
        <h4 className="detail-section-title">Balanço Hídrico (24h)</h4>
        <div className="fluid-balance">
          <div className="fluid-item">
            <span className="fluid-label">Balanço:</span>
            <span className={`fluid-value ${patient.fluidBalance.balanco24h > 5 ? 'fluid-critical' : ''}`}>
              {patient.fluidBalance.balanco24h > 0 ? '+' : ''}{patient.fluidBalance.balanco24h.toFixed(1)} ml/kg/h
            </span>
          </div>
          <div className="fluid-item">
            <span className="fluid-label">Diurese:</span>
            <span className={`fluid-value ${patient.fluidBalance.diurese < 1 ? 'fluid-critical' : ''}`}>
              {patient.fluidBalance.diurese.toFixed(1)} ml/kg/h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

