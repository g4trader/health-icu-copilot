"use client";

import type { Patient } from "@/lib/mockData";

interface VitalsPanelProps {
  patient: Patient;
}

export function VitalsPanel({ patient }: VitalsPanelProps) {
  return (
    <div className="mini-panel vitals-panel">
      <h4 className="mini-panel-title">Sinais Vitais</h4>
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
  );
}

