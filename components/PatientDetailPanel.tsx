"use client";

import type { Patient } from "@/lib/mockData";
import type { MicroDashboard } from "@/types/MicroDashboardV2";
import { PatientPinButton } from "./PatientPinButton";
import { riskLevelFromScore } from "@/lib/mockData";
import { MicroDashboardV2Renderer } from "./ui/MicroDashboardV2Renderer";
import { getRecentDailyStatus } from "@/lib/patientTimeline";
import { PatientBigTimeline } from "./ui/PatientBigTimeline";
import { PatientTimelineSummary } from "./PatientTimelineSummary";
import type { TimelineHighlight } from "@/types/LlmPatientAnswer";
import { useClinicalSession } from "@/lib/ClinicalSessionContext";
import type { PlantonistaAnswerContent } from "@/types/PlantonistaAnswerContent";
import { buildAllDashboards } from "@/lib/microDashboardBuildersV2";

interface PatientDetailPanelProps {
  patient: Patient;
  microDashboards?: MicroDashboard[]; // Dashboards V2 (opcional) - se não fornecido, usa do contexto ou determinístico
  timelineHighlights?: TimelineHighlight[]; // Highlights do LLM (opcional) - se não fornecido, usa do contexto
}

export function PatientDetailPanel({ patient, microDashboards: propsMicroDashboards, timelineHighlights: propsTimelineHighlights }: PatientDetailPanelProps) {
  const { lastAnswerByPatientId } = useClinicalSession();
  const dailyStatus = getRecentDailyStatus(patient.id, 14);
  
  // Buscar resposta do Plantonista para este paciente, se disponível
  const plantonistaAnswer = lastAnswerByPatientId[patient.id];
  
  // Preferir dados do LLM, depois props, depois determinístico
  const microDashboards = propsMicroDashboards ?? plantonistaAnswer?.microDashboards ?? buildAllDashboards(patient);
  const timelineHighlights = propsTimelineHighlights ?? plantonistaAnswer?.timelineHighlights;
  
  const hasVM = patient.ventilationParams !== undefined;
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  const antibioticos = patient.medications.filter(m => m.tipo === "antibiotico" && m.ativo);
  const risk24h = Math.round(patient.riscoMortality24h * 100);
  const risk7d = Math.round(patient.riscoMortality7d * 100);
  const riskLevel24h = riskLevelFromScore(patient.riscoMortality24h);
  const riskLevel7d = riskLevelFromScore(patient.riscoMortality7d);

  // Buscar exames laboratoriais recentes
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  const pcr = patient.labResults.find(l => l.tipo === "pcr");

  // Função auxiliar para determinar cor do risco
  const getRiskColor = (level: "alto" | "moderado" | "baixo") => {
    if (level === "alto") return "bg-rose-50 text-rose-700 border-rose-200";
    if (level === "moderado") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="patient-detail-refined">
      {/* Seção Resumo */}
      <div className="detail-card">
        <h4 className="detail-card-title">Resumo</h4>
        <div className="detail-summary-grid">
          <div className="detail-key-value">
            <span className="detail-key">Leito</span>
            <span className="detail-value">{patient.leito}</span>
          </div>
          <div className="detail-key-value">
            <span className="detail-key">Nome</span>
            <span className="detail-value">{patient.nome}</span>
          </div>
          <div className="detail-key-value">
            <span className="detail-key">Idade</span>
            <span className="detail-value">{patient.idade} {patient.idade === 1 ? "ano" : "anos"}</span>
          </div>
          <div className="detail-key-value">
            <span className="detail-key">Peso</span>
            <span className="detail-value">{patient.peso.toFixed(1)} kg</span>
          </div>
          <div className="detail-key-value detail-key-value-full">
            <span className="detail-key">Diagnóstico</span>
            <span className="detail-value">{patient.diagnosticoPrincipal}</span>
          </div>
          <div className="detail-key-value">
            <span className="detail-key">Dias de UTI</span>
            <span className="detail-value">{patient.diasDeUTI} {patient.diasDeUTI === 1 ? "dia" : "dias"}</span>
          </div>
        </div>
        <div className="detail-chips-refined">
          <span className={`detail-chip-refined ${getRiskColor(riskLevel24h)}`}>
            Risco 24h: {risk24h}%
          </span>
          <span className={`detail-chip-refined ${getRiskColor(riskLevel7d)}`}>
            Risco 7d: {risk7d}%
          </span>
          <span className={`detail-chip-refined ${hasVM ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            VM: {hasVM ? 'Sim' : 'Não'}
          </span>
          <span className={`detail-chip-refined ${hasVaso ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            Vasopressor: {hasVaso ? 'Sim' : 'Não'}
          </span>
        </div>
      </div>

      {/* Seção Sinais Vitais */}
      <div className="detail-card">
        <h4 className="detail-card-title">Sinais Vitais</h4>
        <div className="vitals-grid-refined">
          <div className="vital-item-refined">
            <span className="vital-label-refined">MAP</span>
            <span className={`vital-value-refined ${patient.vitalSigns.pressaoArterialMedia < 65 ? 'text-rose-600' : 'text-slate-900'}`}>
              {patient.vitalSigns.pressaoArterialMedia} mmHg
              {patient.vitalSigns.pressaoArterialMedia < 65 && <span className="vital-critical-icon">!</span>}
            </span>
          </div>
          <div className="vital-item-refined">
            <span className="vital-label-refined">FC</span>
            <span className="vital-value-refined">{patient.vitalSigns.frequenciaCardiaca} bpm</span>
          </div>
          <div className="vital-item-refined">
            <span className="vital-label-refined">FR</span>
            <span className="vital-value-refined">{patient.vitalSigns.frequenciaRespiratoria} rpm</span>
          </div>
          <div className="vital-item-refined">
            <span className="vital-label-refined">SpO₂</span>
            <span className={`vital-value-refined ${patient.vitalSigns.saturacaoO2 < 92 ? 'text-rose-600' : 'text-slate-900'}`}>
              {patient.vitalSigns.saturacaoO2}%
              {patient.vitalSigns.saturacaoO2 < 92 && <span className="vital-critical-icon">!</span>}
            </span>
          </div>
          <div className="vital-item-refined">
            <span className="vital-label-refined">Temp</span>
            <span className="vital-value-refined">{patient.vitalSigns.temperatura.toFixed(1)} °C</span>
          </div>
          {patient.vitalSigns.escalaGlasgow && (
            <div className="vital-item-refined">
              <span className="vital-label-refined">GCS</span>
              <span className="vital-value-refined">{patient.vitalSigns.escalaGlasgow}</span>
            </div>
          )}
        </div>
      </div>

      {/* Exames Laboratoriais */}
      {(lactato || pcr) && (
        <div className="detail-card">
          <h4 className="detail-card-title">Exames Laboratoriais</h4>
          <div className="lab-results-refined">
            {lactato && (
              <div className="lab-item-refined">
                <div className="lab-item-left">
                  <span className="lab-item-label">Lactato</span>
                  {lactato.tendencia && (
                    <span className={`lab-trend-refined ${lactato.tendencia === 'subindo' ? 'trend-up' : lactato.tendencia === 'caindo' ? 'trend-down' : 'trend-stable'}`}>
                      {lactato.tendencia === 'subindo' ? '↑' : lactato.tendencia === 'caindo' ? '↓' : '='}
                      <span className="lab-trend-text">
                        {lactato.tendencia === 'subindo' ? 'Subindo' : lactato.tendencia === 'caindo' ? 'Melhora' : 'Estável'}
                      </span>
                    </span>
                  )}
                </div>
                <span className={`lab-value-refined ${typeof lactato.valor === 'number' && lactato.valor >= 3 ? 'text-rose-600 font-semibold' : 'text-slate-900'}`}>
                  {typeof lactato.valor === 'number' ? lactato.valor.toFixed(1) : lactato.valor} mmol/L
                </span>
              </div>
            )}
            {pcr && (
              <div className="lab-item-refined">
                <div className="lab-item-left">
                  <span className="lab-item-label">PCR</span>
                </div>
                <span className={`lab-value-refined ${typeof pcr.valor === 'number' && pcr.valor >= 50 ? 'text-rose-600 font-semibold' : 'text-slate-900'}`}>
                  {typeof pcr.valor === 'number' ? pcr.valor.toFixed(1) : pcr.valor} mg/L
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drogas Vasoativas */}
      {hasVaso && (
        <div className="detail-card">
          <h4 className="detail-card-title">Drogas Vasoativas</h4>
          <div className="medications-list-refined">
            {patient.medications
              .filter(m => m.tipo === "vasopressor" && m.ativo)
              .map(m => (
                <div key={m.id} className="medication-item-refined">
                  <strong className="medication-name">{m.nome}</strong>
                  <span className="medication-dose">{m.dose} {m.unidade}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Antibióticos */}
      {antibioticos.length > 0 && (
        <div className="detail-card">
          <h4 className="detail-card-title">Antibióticos</h4>
          <div className="medications-list-refined">
            {antibioticos.map(m => (
              <div key={m.id} className="medication-item-refined">
                <strong className="medication-name">{m.nome}</strong>
                <span className="medication-dose">{m.dose} {m.unidade} • D{m.diasDeUso || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ventilação Mecânica */}
      {patient.ventilationParams && (
        <div className="detail-card">
          <h4 className="detail-card-title">Ventilação Mecânica</h4>
          <div className="ventilation-params-refined">
            <div className="vent-param-refined">
              <span className="vent-label-refined">Modo</span>
              <span className="vent-value-refined">{patient.ventilationParams.modo}</span>
            </div>
            <div className="vent-param-refined">
              <span className="vent-label-refined">FiO₂</span>
              <span className="vent-value-refined">{patient.ventilationParams.fiO2}%</span>
            </div>
            <div className="vent-param-refined">
              <span className="vent-label-refined">PEEP</span>
              <span className="vent-value-refined">{patient.ventilationParams.peep} cmH₂O</span>
            </div>
            {patient.ventilationParams.pressaoSuporte && (
              <div className="vent-param-refined">
                <span className="vent-label-refined">Pressão de Suporte</span>
                <span className="vent-value-refined">{patient.ventilationParams.pressaoSuporte} cmH₂O</span>
              </div>
            )}
            {patient.ventilationParams.paO2FiO2 && (
              <div className="vent-param-refined">
                <span className="vent-label-refined">PaO₂/FiO₂</span>
                <span className="vent-value-refined">{patient.ventilationParams.paO2FiO2}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Dashboards de decisão */}
      {microDashboards && microDashboards.length > 0 && (
        <>
          <h3 className="patient-detail-section-title">Dashboards de decisão</h3>
          <div className="mb-6 micro-dashboards-list">
            {microDashboards.map((dashboard, idx) => (
              <MicroDashboardV2Renderer key={idx} dashboard={dashboard} />
            ))}
          </div>
        </>
      )}

      {/* 3. Evolução na UTI (últimos 14 dias) */}
      <h3 className="patient-detail-section-title">Evolução na UTI (últimos 14 dias)</h3>
      <div className="mb-6">
        <PatientBigTimeline
          dailyStatus={dailyStatus}
          highlights={timelineHighlights}
        />
      </div>

      {/* 4. Eventos marcantes */}
      <h3 className="patient-detail-section-title">Eventos marcantes</h3>
      <div className="mb-6">
        <PatientTimelineSummary
          patientId={patient.id}
          timelineHighlights={timelineHighlights}
        />
      </div>

      {/* Balanço Hídrico */}
      <div className="detail-card">
        <h4 className="detail-card-title">Balanço Hídrico (24h)</h4>
        <div className="fluid-balance-refined">
          <div className="fluid-item-refined">
            <span className="fluid-label-refined">Balanço</span>
            <span className={`fluid-value-refined ${patient.fluidBalance.balanco24h > 3 ? 'text-rose-600' : patient.fluidBalance.balanco24h < -1 ? 'text-blue-600' : 'text-slate-900'}`}>
              {patient.fluidBalance.balanco24h > 0 ? '+' : ''}{patient.fluidBalance.balanco24h.toFixed(1)} ml/kg/h
            </span>
          </div>
          <div className="fluid-item-refined">
            <span className="fluid-label-refined">Diurese</span>
            <span className={`fluid-value-refined ${patient.fluidBalance.diurese < 1 ? 'text-rose-600 font-semibold' : 'text-slate-900'}`}>
              {patient.fluidBalance.diurese.toFixed(1)} ml/kg/h
              {patient.fluidBalance.diurese < 1 && <span className="vital-critical-icon">!</span>}
            </span>
          </div>
          <div className="fluid-item-refined">
            <span className="fluid-label-refined">Entrada 24h</span>
            <span className="fluid-value-refined">{patient.fluidBalance.entrada24h.toFixed(1)} ml/kg/h</span>
          </div>
          <div className="fluid-item-refined">
            <span className="fluid-label-refined">Saída 24h</span>
            <span className="fluid-value-refined">{patient.fluidBalance.saida24h.toFixed(1)} ml/kg/h</span>
          </div>
        </div>
      </div>
    </div>
  );
}