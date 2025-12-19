"use client";

import { useState, useEffect } from "react";
import type { Patient } from "@/types/Patient";
import type { PatientFocusPayload } from "@/types/PatientFocusPayload";
import { 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  X,
  Pin,
  PinOff,
  Activity,
  HeartPulse,
  Droplets,
  Thermometer,
  Wind,
  Scan,
  Heart,
  Pill,
  Mic
} from "lucide-react";
import { BaseCard } from "./ui/BaseCard";
import { SectionHeader } from "./ui/SectionHeader";
import { MetricTile } from "./ui/MetricTile";
import { MetricChip } from "./ui/MetricChip";
import { PatientPinButton } from "./PatientPinButton";
import { riskLevelFromScore, calculateSOFA } from "@/lib/mockData";
import { PatientTimeline } from "./PatientTimeline";
import { PatientTimelineSummary } from "./PatientTimelineSummary";
import { getPatientTimeline } from "@/lib/patientTimeline";
import { VitalSignsChart } from "./ui/VitalSignsChart";
import { LabSparkline } from "./ui/LabSparkline";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";

interface PatientFocusModeProps {
  patient: Patient;
  onCollapse: () => void;
  onRequestRadiologistOpinion?: () => void;
  focusPayload?: PatientFocusPayload; // Payload estruturado (opcional)
  timelineHighlights?: import("@/types/LlmPatientAnswer").TimelineHighlight[]; // Highlights do LLM (opcional)
}

export function PatientFocusMode({ 
  patient, 
  onCollapse,
  onRequestRadiologistOpinion,
  focusPayload,
  timelineHighlights
}: PatientFocusModeProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "evolution" | "opinion">("overview");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const riskLevel = riskLevelFromScore(patient.riscoMortality24h);
  const riskPercent = Math.round(patient.riscoMortality24h * 100);
  const sofaScore = calculateSOFA(patient);
  
  const vs = patient.vitalSigns;
  const hasVM = !!patient.ventilationParams;
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  const hasAntibiotic = patient.medications.some(m => m.tipo === "antibiotico" && m.ativo);
  
  // Calcular alertas clínicos (máx. 3)
  const alerts: Array<{ type: "critical" | "warning" | "info"; message: string }> = [];
  
  if (vs.pressaoArterialMedia < 65) {
    alerts.push({ type: "critical", message: "Hipotensão arterial (MAP < 65 mmHg)" });
  }
  
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  const lactatoValue = lactato && typeof lactato.valor === "number" ? lactato.valor : null;
  if (lactatoValue && lactatoValue >= 3) {
    alerts.push({ type: "critical", message: `Lactato elevado (${lactatoValue.toFixed(1)} mmol/L)` });
  }
  
  if (vs.saturacaoO2 < 92) {
    alerts.push({ type: "critical", message: `Hipoxemia (SpO₂ ${vs.saturacaoO2}%)` });
  }
  
  // Limitar a 3 alertas
  const displayAlerts = alerts.slice(0, 3);
  
  // Terapias ativas
  const vasopressors = patient.medications.filter(m => m.tipo === "vasopressor" && m.ativo);
  const antibiotics = patient.medications.filter(m => m.tipo === "antibiotico" && m.ativo);
  
  return (
    <BaseCard className={`mt-4 patient-focus-mode-mobile`} padding="lg">
      {/* Cabeçalho compacto para mobile */}
      {isMobile && (
        <div className="patient-mobile-header">
          <div className="patient-mobile-header-left">
            <div className="patient-mobile-header-info">
              <span className="patient-mobile-header-bed">{patient.leito}</span>
              <span className="patient-mobile-header-name">{patient.nome}</span>
            </div>
            <div className="patient-mobile-header-chips">
              <span
                className={`patient-mobile-header-chip ${
                  riskLevel === "alto"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : riskLevel === "moderado"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {riskPercent}%
              </span>
              {hasVM && (
                <span className="patient-mobile-header-chip bg-blue-50 text-blue-700 border border-blue-200">
                  VM
                </span>
              )}
              {hasVaso && (
                <span className="patient-mobile-header-chip bg-purple-50 text-purple-700 border border-purple-200">
                  Vaso
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="patient-mobile-header-voice-btn"
            aria-label="Nota de voz"
            title="Gravar nota de voz"
            onClick={() => {
              // Scroll para a aba de Evolução onde está o VoiceNoteRecorder
              setActiveTab("evolution");
              setTimeout(() => {
                const evolutionSection = document.querySelector('.patient-tab-content.active section');
                if (evolutionSection) {
                  evolutionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header do paciente (desktop) */}
      {!isMobile && (
        <div className="sticky top-0 z-10 bg-white pb-4 border-b border-slate-200 -mx-6 px-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {patient.leito}
                </span>
                <h3 className="text-xl font-semibold text-slate-900">
                  {patient.nome}
                </h3>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                {patient.idade} anos • {patient.peso.toFixed(1)} kg • {patient.diagnosticoPrincipal}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={`
                    px-2.5 py-1
                    rounded-md
                    border
                    text-xs font-semibold tabular-nums
                    ${
                      riskLevel === "alto"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : riskLevel === "moderado"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }
                  `}
                >
                  Risco 24h: {riskPercent}%
                </div>
                {hasVM && (
                  <MetricChip label="VM" value="Ativo" variant="info" />
                )}
                {hasVaso && (
                  <MetricChip label="Vaso" value="Ativo" variant="danger" />
                )}
                {hasAntibiotic && (
                  <MetricChip label="ATB" value={`${antibiotics.length} ativo${antibiotics.length > 1 ? 's' : ''}`} variant="default" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <PatientPinButton patient={patient} />
              <button
                type="button"
                onClick={onCollapse}
                className="inline-flex items-center justify-center w-8 h-8 border border-slate-300 rounded-lg bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                aria-label="Recolher perfil"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar para mobile */}
      {isMobile && (
        <div className="patient-tab-bar">
          <button
            type="button"
            className={`patient-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Visão geral
          </button>
          <button
            type="button"
            className={`patient-tab ${activeTab === "evolution" ? "active" : ""}`}
            onClick={() => setActiveTab("evolution")}
          >
            Evolução
          </button>
          <button
            type="button"
            className={`patient-tab ${activeTab === "opinion" ? "active" : ""}`}
            onClick={() => setActiveTab("opinion")}
          >
            Parecer
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Conteúdo da aba Visão geral */}
        <div className={`patient-tab-content ${!isMobile || activeTab === "overview" ? "active" : ""}`}>
          {/* 2. Alertas clínicos */}
          {displayAlerts.length > 0 && (
            <section>
              <SectionHeader title="Alertas clínicos" />
              <div className="mt-3 space-y-2">
                {displayAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`
                      flex items-start gap-2 p-3 rounded-lg border
                      ${
                        alert.type === "critical"
                          ? "bg-rose-50 border-rose-200 text-rose-900"
                          : alert.type === "warning"
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-blue-50 border-blue-200 text-blue-900"
                      }
                    `}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{alert.message}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Resumo das últimas 24h */}
          <PatientTimelineSummary 
            patientId={patient.id} 
            timelineHighlights={timelineHighlights}
          />

          {/* 3. Sinais vitais (gráficos) */}
          <section>
            <SectionHeader title="Sinais vitais" />
            <div className="mt-3 space-y-3">
              <VitalSignsChart patient={patient} metric="fc" />
              <VitalSignsChart patient={patient} metric="spo2" />
              <VitalSignsChart patient={patient} metric="fr" />
              {/* Métricas adicionais */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <MetricTile
                  label="MAP"
                  value={vs.pressaoArterialMedia}
                  unit="mmHg"
                  critical={vs.pressaoArterialMedia < 65}
                />
                <MetricTile
                  label="Temp"
                  value={vs.temperatura.toFixed(1)}
                  unit="°C"
                />
                <MetricTile
                  label="Diurese"
                  value={patient.fluidBalance.diurese.toFixed(1)}
                  unit="mL/kg/h"
                />
              </div>
            </div>
          </section>

          {/* 4. Laboratórios com sparklines */}
          {patient.labResults.length > 0 && (
            <section>
              <SectionHeader title="Exames laboratoriais" />
              <div className="mt-3 space-y-2">
                {patient.labResults
                  .filter(lab => lab.tipo === "lactato" || lab.tipo === "pcr")
                  .map((lab, idx) => {
                    const value = typeof lab.valor === "number" ? lab.valor : parseFloat(String(lab.valor));
                    
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-900">
                              {lab.tipo === "lactato" ? "Lactato" : lab.tipo === "pcr" ? "PCR" : lab.nome}
                            </span>
                            <span
                              className={`text-sm font-semibold tabular-nums ${
                                lab.tipo === "lactato" && value >= 3
                                  ? "text-rose-600"
                                  : "text-slate-700"
                              }`}
                            >
                              {value.toFixed(lab.tipo === "lactato" ? 1 : 0)} {lab.unidade}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Ref: {lab.referencia || "—"}
                          </div>
                        </div>
                        <LabSparkline lab={lab} />
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* 5. Imagem (resumo) */}
          <section>
            <SectionHeader title="Exames de imagem" />
            <div className="mt-3">
              {(() => {
                // Buscar último exame de imagem na timeline
                const timelineEvents = getPatientTimeline(patient.id);
                const lastImagingEvent = timelineEvents
                  .filter(e => e.type === 'imaging')
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                
                if (lastImagingEvent) {
                  const examTypeLabel = lastImagingEvent.title.includes('RX') || lastImagingEvent.title.includes('Radiografia') ? 'RX' :
                                      lastImagingEvent.title.includes('TC') || lastImagingEvent.title.includes('Tomografia') ? 'TC' :
                                      lastImagingEvent.title.includes('ECO') || lastImagingEvent.title.includes('Ecocardiograma') ? 'ECO' :
                                      'Imagem';
                  
                  return (
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-white border border-slate-200 rounded-lg">
                            <Scan className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-semibold">
                                {examTypeLabel}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(lastImagingEvent.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                              {lastImagingEvent.title}
                            </p>
                            {lastImagingEvent.description && (
                              <p className="text-xs text-slate-600 mt-1">
                                {lastImagingEvent.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {lastImagingEvent.relatedExamId && onRequestRadiologistOpinion && (
                          <button
                            type="button"
                            onClick={onRequestRadiologistOpinion}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex-shrink-0"
                          >
                            Ver laudo
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3">
                    <Scan className="w-10 h-10 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      Nenhum exame de imagem disponível
                    </p>
                    {onRequestRadiologistOpinion && (
                      <button
                        type="button"
                        onClick={onRequestRadiologistOpinion}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Solicitar análise do Radiologista Virtual
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </section>

          {/* 6. Terapias ativas */}
          <section>
            <SectionHeader title="Terapias ativas" />
            <div className="mt-3 space-y-4">
              {/* Ventilação mecânica */}
              {hasVM && patient.ventilationParams && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-900">Ventilação Mecânica</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-600">Modo:</span>
                      <span className="ml-1 font-medium text-slate-900">{patient.ventilationParams.modo}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">FiO₂:</span>
                      <span className="ml-1 font-medium text-slate-900">{patient.ventilationParams.fiO2}%</span>
                    </div>
                    <div>
                      <span className="text-slate-600">PEEP:</span>
                      <span className="ml-1 font-medium text-slate-900">{patient.ventilationParams.peep} cmH₂O</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Drogas vasoativas */}
              {hasVaso && vasopressors.length > 0 && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <HeartPulse className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-900">Drogas Vasoativas</h4>
                  </div>
                  <div className="space-y-1">
                    {vasopressors.map((med, idx) => (
                      <div key={idx} className="text-sm text-slate-700">
                        <span className="font-medium">{med.nome}</span>
                        <span className="text-slate-500 ml-2">{med.dose} {med.unidade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Antibióticos */}
              {hasAntibiotic && antibiotics.length > 0 && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-900">Antibioticoterapia</h4>
                  </div>
                  <div className="space-y-1">
                    {antibiotics.map((med, idx) => (
                      <div key={idx} className="text-sm text-slate-700">
                        <span className="font-medium">{med.nome}</span>
                        <span className="text-slate-500 ml-2">{med.dose} {med.unidade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Conteúdo da aba Evolução */}
        <div className={`patient-tab-content ${!isMobile || activeTab === "evolution" ? "active" : ""}`}>
          {/* 7. Nota de Voz */}
          <section>
            <SectionHeader title="Evolução clínica" />
            <div className="mt-3">
              <VoiceNoteRecorder
                patientContext={{
                  bed: patient.leito,
                  patientId: patient.id,
                  unit: "UTI 1"
                }}
                onTranscription={(text) => {
                  console.log("Transcrição:", text);
                }}
                onStructuredData={(data) => {
                  console.log("Dados estruturados:", data);
                  // TODO: Aplicar atualizações ao paciente
                  // Por enquanto, apenas logamos os dados
                  // Em produção, isso atualizaria o snapshot do paciente e adicionaria evento na timeline
                }}
                onError={(error) => {
                  console.error("Erro na nota de voz:", error);
                }}
              />
            </div>
          </section>

          {/* 8. Linha do Tempo Clínica */}
          <PatientTimeline patient={patient} />
        </div>

        {/* Conteúdo da aba Parecer */}
        <div className={`patient-tab-content ${!isMobile || activeTab === "opinion" ? "active" : ""}`}>
          {/* 9. Parecer do Plantonista */}
          <section key={`parecer-${patient.id}-${patient.voiceNoteSummary?.substring(0, 20) || 'default'}`}>
            <SectionHeader title="Parecer do Plantonista" />
            <div className="mt-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              {patient.voiceNoteSummary ? (
                <p className="text-sm text-slate-700 leading-relaxed">
                  {patient.voiceNoteSummary}
                </p>
              ) : focusPayload?.narrativaAgente ? (
                <p className="text-sm text-slate-700 leading-relaxed">
                  {focusPayload.narrativaAgente}
                </p>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed">
                  Paciente {patient.nome} ({patient.idade} anos, {patient.peso.toFixed(1)} kg), leito {patient.leito}, 
                  com diagnóstico principal de {patient.diagnosticoPrincipal}. 
                  {riskLevel === "alto" && ` Apresenta risco de mortalidade em 24h elevado (${riskPercent}%).`}
                  {lactatoValue && lactatoValue >= 3 && ` Lactato elevado (${lactatoValue.toFixed(1)} mmol/L), sugerindo comprometimento da perfusão tecidual.`}
                  {hasVM && " Em ventilação mecânica com parâmetros ajustados."}
                  {hasVaso && " Em uso de drogas vasoativas para suporte hemodinâmico."}
                  {sofaScore > 10 && ` Escore SOFA: ${sofaScore}, indicando disfunção orgânica significativa.`}
                  Recomenda-se monitorização próxima e reavaliação periódica do quadro clínico.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </BaseCard>
  );
}

