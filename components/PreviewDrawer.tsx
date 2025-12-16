"use client";

import { usePreview, type PreviewPayload } from "./PreviewProvider";
import { mockPatients, getTopPatients, riskLevelFromScore, calculateRiskScore } from "@/lib/mockData";
import { getPatientsOnVentilation, getPatientsOnVasopressors, getHighRiskPatients } from "@/lib/icuSummary";
import type { Patient } from "@/lib/mockData";
import { PatientDetailPanel } from "./PatientDetailPanel";
import { PatientPinButton } from "./PatientPinButton";
import { PatientListItem } from "./ui/PatientListItem";
import { useClinicalSession } from "@/lib/ClinicalSessionContext";
import type { ClinicalAgentId } from "@/lib/clinicalAgents";
import { RadiologyReportDetails } from "./ui/RadiologyReportDetails";

function PatientDrawerHeader({ patient }: { patient: Patient }) {
  const { clearPreview } = usePreview();
  const risk24h = Math.round(patient.riscoMortality24h * 100);
  const riskLevel = riskLevelFromScore(patient.riscoMortality24h);
  
  const getRiskBadgeColor = () => {
    if (riskLevel === "alto") return "bg-rose-50 text-rose-700 border-rose-200";
    if (riskLevel === "moderado") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="drawer-header-patient">
      <div className="drawer-header-patient-info">
        <div className="drawer-header-patient-main">
          <span className="drawer-header-patient-bed">{patient.leito}</span>
          <h3 className="drawer-header-patient-name">{patient.nome}</h3>
        </div>
        <div className="drawer-header-patient-badges">
          <span className={`drawer-header-risk-badge ${getRiskBadgeColor()}`}>
            Risco 24h: {risk24h}%
          </span>
        </div>
      </div>
      <div className="drawer-header-patient-actions">
        <PatientPinButton patient={patient} />
        <button
          type="button"
          className="drawer-close-btn"
          onClick={clearPreview}
          aria-label="Fechar preview"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="drawer-close-icon"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function PreviewDrawer() {
  const { previewType, previewPayload, clearPreview } = usePreview();

  if (!previewType) {
    return null;
  }

  return (
    <>
      <div className="drawer-overlay" onClick={clearPreview} />
      <aside className="preview-drawer">
        <div className="drawer-header">
          {previewType === 'patient' && previewPayload?.patient ? (
            <PatientDrawerHeader patient={previewPayload.patient as Patient} />
          ) : (
            <>
              <h3 className="drawer-title">
                {previewType === 'icu-overview' && 'Visão Geral da UTI'}
                {previewType === 'allPatients' && 'Todos os Pacientes da UTI'}
                {previewType === 'ventilated' && 'Pacientes em Ventilação Mecânica'}
                {previewType === 'vasopressors' && 'Pacientes em Droga Vasoativa'}
                {previewType === 'high-risk' && 'Pacientes em Alto Risco (24h)'}
                {previewType === 'lab-results' && 'Exames Laboratoriais Recentes'}
                {previewType === 'unit-profile' && 'Perfil Epidemiológico da Unidade'}
                {previewType === 'radiology-report' && 'Laudo Radiológico'}
              </h3>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={clearPreview}
                aria-label="Fechar preview"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="drawer-close-icon"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
        </div>
        <div className="drawer-body">
          {previewType === 'allPatients' && <AllPatientsPreview payload={previewPayload} />}
          {previewType === 'ventilated' && <VentilatedPreview />}
          {previewType === 'vasopressors' && <VasopressorsPreview />}
          {previewType === 'high-risk' && <HighRiskPreview />}
          {previewType === 'patient' && previewPayload?.patient && (
            <PatientDetailPanel patient={previewPayload.patient as Patient} />
          )}
          {previewType === 'radiology-report' && previewPayload?.report && (
            <RadiologyReportDetails report={previewPayload.report as import("@/types/RadiologyOpinion").RadiologyReportFull} />
          )}
          {previewType === 'icu-overview' && <IcuOverviewPreview />}
        </div>
      </aside>
    </>
  );
}

function IcuOverviewPreview() {
  const totalPatients = mockPatients.length;
  const onVentilation = getPatientsOnVentilation();
  const onVasopressors = getPatientsOnVasopressors();
  const highRisk = getHighRiskPatients();

  return (
    <div className="preview-content">
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
  );
}

function AllPatientsPreview({ payload }: { payload: PreviewPayload | null }) {
  const patients = (payload?.patients || mockPatients) as Patient[];
  const { onSelectPatient } = usePreview();

  return (
    <div className="preview-content">
      <div className="space-y-4">
        {patients.map((p) => (
          <PatientListItem
            key={p.id}
            patient={p}
            onSelect={(patient) => onSelectPatient?.(patient.id)}
            showActions={true}
          />
        ))}
      </div>
    </div>
  );
}

function VentilatedPreview() {
  const ventilated = mockPatients.filter(p => p.ventilationParams !== undefined);
  const { onSelectPatient } = usePreview();

  return (
    <div className="preview-content">
      <div className="space-y-4">
        {ventilated.map((p) => (
          <PatientListItem
            key={p.id}
            patient={p}
            onSelect={(patient) => onSelectPatient?.(patient.id)}
            showActions={true}
          />
        ))}
      </div>
    </div>
  );
}

function VasopressorsPreview() {
  const onVaso = mockPatients.filter(p => 
    p.medications.some(m => m.tipo === "vasopressor" && m.ativo)
  );
  const { onSelectPatient } = usePreview();

  return (
    <div className="preview-content">
      <div className="space-y-4">
        {onVaso.map((p) => (
          <PatientListItem
            key={p.id}
            patient={p}
            onSelect={(patient) => onSelectPatient?.(patient.id)}
            showActions={true}
          />
        ))}
      </div>
    </div>
  );
}

function HighRiskPreview() {
  const highRisk = mockPatients.filter(p => {
    const riskScore = calculateRiskScore(p);
    return riskLevelFromScore(riskScore) === "alto" || p.riscoMortality24h >= 0.7;
  });
  const { onSelectPatient } = usePreview();

  return (
    <div className="preview-content">
      <div className="space-y-4">
        {highRisk.map((p) => (
          <PatientListItem
            key={p.id}
            patient={p}
            onSelect={(patient) => onSelectPatient?.(patient.id)}
            showActions={true}
          />
        ))}
      </div>
    </div>
  );
}

function PatientPreview({ payload }: { payload: PreviewPayload | null }) {
  if (!payload || !payload.patient) {
    return (
      <div className="preview-content">
        <div className="preview-empty">
          <p>Dados do paciente não disponíveis.</p>
        </div>
      </div>
    );
  }

  const patient = payload.patient as Patient;
  return (
    <div className="preview-content">
      <div className="preview-patient-details">
        <div><strong>Idade:</strong> {patient.idade} {patient.idade === 1 ? "ano" : "anos"}</div>
        <div><strong>Peso:</strong> {patient.peso?.toFixed(1) || "N/A"} kg</div>
        <div><strong>Diagnóstico:</strong> {patient.diagnosticoPrincipal}</div>
        <div><strong>Risco 24h:</strong> {(patient.riscoMortality24h * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}

