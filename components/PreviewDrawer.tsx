"use client";

import { usePreview, type PreviewPayload } from "./PreviewProvider";
import { mockPatients, getTopPatients, riskLevelFromScore, calculateRiskScore } from "@/lib/mockData";
import { getPatientsOnVentilation, getPatientsOnVasopressors, getHighRiskPatients } from "@/lib/icuSummary";
import type { Patient } from "@/lib/mockData";
import clsx from "clsx";

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
          <h3 className="drawer-title">
            {previewType === 'icu-overview' && 'Visão Geral da UTI'}
            {previewType === 'allPatients' && 'Todos os Pacientes da UTI'}
            {previewType === 'ventilated' && 'Pacientes em Ventilação Mecânica'}
            {previewType === 'vasopressors' && 'Pacientes em Droga Vasoativa'}
            {previewType === 'high-risk' && 'Pacientes em Alto Risco (24h)'}
            {previewType === 'patient' && 'Resumo do Paciente'}
            {previewType === 'lab-results' && 'Exames Laboratoriais Recentes'}
            {previewType === 'unit-profile' && 'Perfil Epidemiológico da Unidade'}
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
        </div>
        <div className="drawer-body">
          {previewType === 'allPatients' && <AllPatientsPreview payload={previewPayload} />}
          {previewType === 'ventilated' && <VentilatedPreview />}
          {previewType === 'vasopressors' && <VasopressorsPreview />}
          {previewType === 'high-risk' && <HighRiskPreview />}
          {previewType === 'patient' && <PatientPreview payload={previewPayload} />}
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

  return (
    <div className="space-y-3">
      {patients.map((p) => {
        const hasVM = p.ventilationParams !== undefined;
        const hasVaso = p.medications.some(m => m.tipo === "vasopressor" && m.ativo);
        const risk24h = Math.round(p.riscoMortality24h * 100);
        return (
          <div
            key={p.id}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            {/* Linha principal: leito + nome + risco */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {p.leito}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {p.nome}
                </p>
                <p className="text-xs text-slate-500">
                  {p.idade} anos • {p.diagnosticoPrincipal}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Risco 24h
                </span>
                <span
                  className={clsx(
                    'mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                    risk24h >= 70
                      ? 'bg-rose-50 text-rose-600'
                      : risk24h >= 50
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                  )}
                >
                  {risk24h}%
                </span>
              </div>
            </div>
            {/* Linha secundária: VM / Vasopressor */}
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-slate-600">
                VM: <span className="ml-1 font-medium">{hasVM ? 'Sim' : 'Não'}</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-slate-600">
                Vasopressor:{' '}
                <span className="ml-1 font-medium">
                  {hasVaso ? 'Sim' : 'Não'}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VentilatedPreview() {
  const ventilated = mockPatients.filter(p => p.ventilationParams !== undefined);

  return (
    <div className="preview-content">
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
  );
}

function VasopressorsPreview() {
  const onVaso = mockPatients.filter(p => 
    p.medications.some(m => m.tipo === "vasopressor" && m.ativo)
  );

  return (
    <div className="preview-content">
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
  );
}

function HighRiskPreview() {
  const highRisk = mockPatients.filter(p => {
    const riskScore = calculateRiskScore(p);
    return riskLevelFromScore(riskScore) === "alto" || p.riscoMortality24h >= 0.7;
  });

  return (
    <div className="preview-content">
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

