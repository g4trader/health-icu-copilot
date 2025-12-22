"use client";

import { useState, useEffect } from "react";
import type { PlantonistaAnswerContent } from "@/types/PlantonistaAnswerContent";
import { MicroDashboardV2Renderer } from "./MicroDashboardV2Renderer";
import { PatientCard } from "../patients/PatientCard";
import type { Patient } from "@/types/Patient";
import { OpinionBullets } from "./OpinionBullets";
import { PatientBigTimeline } from "./PatientBigTimeline";
import { getRecentDailyStatus } from "@/lib/patientTimeline";
import { mockPatients } from "@/lib/mockData";
import { Mic } from "lucide-react";
import { usePreview } from "../PreviewProvider";

interface PlantonistaAnswerPanelProps {
  content: PlantonistaAnswerContent;
  onSelectPatient?: (patientId: string) => void;
  onExpandPatient?: (patientId: string) => void;
  onShowFullEvolution?: (patientId: string) => void;
}

/**
 * Ordena dashboards por ordem de importância visual
 */
function orderDashboards(dashboards: PlantonistaAnswerContent["microDashboards"]) {
  if (!dashboards) return [];
  
  const order: Record<string, number> = {
    status_global: 1,
    respiratorio: 2,
    hemodinamico: 3,
    labs_evolutivos: 4,
    imagem_evolutiva: 5,
    evolucao24h: 6,
    riscoscores: 7,
    antibiotico_infeccao: 8,
  };
  
  return [...dashboards].sort((a, b) => {
    const orderA = order[a.tipo] ?? 99;
    const orderB = order[b.tipo] ?? 99;
    return orderA - orderB;
  });
}

/**
 * Componente canônico para renderizar respostas do Plantonista
 * Estrutura em 4 andares fixos: Header, Dashboards, Evolution, Opinion
 */
export function PlantonistaAnswerPanel({
  content,
  onSelectPatient,
  onExpandPatient,
  onShowFullEvolution,
  patientUpdateKey = 0,
}: PlantonistaAnswerPanelProps & { patientUpdateKey?: number }) {
  const [activeTab, setActiveTab] = useState<"overview" | "evolution" | "opinion">("overview");
  const [isMobile, setIsMobile] = useState(false);
  const { onSendMessage } = usePreview();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleScrollToEvolution = () => {
    document.getElementById("patient-evolution-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Buscar paciente e dailyStatus se houver focusPayload
  // IMPORTANTE: Sempre buscar do array mockPatients para ter versão mais recente com voiceNoteSummary
  const patient = content.focusPayload?.patientId 
    ? mockPatients.find(p => p.id === content.focusPayload!.patientId) || null
    : null;
  const dailyStatus = patient ? getRecentDailyStatus(patient.id, 14) : [];
  
  // Log para debug (apenas quando houver voiceNoteSummary)
  // Removido para reduzir logs excessivos

  // Ordenar dashboards
  const orderedDashboards = orderDashboards(content.microDashboards);

  return (
    <div className="plantonista-response-panel">
      {/* TOP N Patients List (para PRIORITIZACAO) - renderiza antes dos andares */}
      {content.topPatients && content.topPatients.length > 0 && (
        <div className="plantonista-response-patients">
          <h3 className="plantonista-section-title">
            TOP {content.topPatients.length} Pacientes por Prioridade
          </h3>
          <div className="patients-list">
            {content.topPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onSelect={onSelectPatient}
                onSendPatientMessage={(patientId, message) => {
                  // Enviar mensagem ao chat em vez de abrir drawer
                  console.log('[PlantonistaAnswerPanel] onSendPatientMessage chamado', { patientId, message, hasOnSendMessage: !!onSendMessage });
                  if (onSendMessage) {
                    console.log('[PlantonistaAnswerPanel] Chamando onSendMessage do contexto');
                    onSendMessage(message, patientId);
                  } else {
                    console.warn('[PlantonistaAnswerPanel] onSendMessage não disponível no contexto');
                    // Fallback: disparar evento customizado para que o page.tsx possa capturar
                    window.dispatchEvent(new CustomEvent('sendPatientMessage', {
                      detail: { patientId, message }
                    }));
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cabeçalho compacto para mobile */}
      {isMobile && content.focusPayload && (
        <div className="patient-mobile-header">
          <div className="patient-mobile-header-left">
            <div className="patient-mobile-header-info">
              <span className="patient-mobile-header-bed">{content.focusPayload.leito}</span>
              <span className="patient-mobile-header-name">{content.focusPayload.nome}</span>
            </div>
            <div className="patient-mobile-header-chips">
              <span
                className={`patient-mobile-header-chip ${
                  content.focusPayload.riskLevel === "alto"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : content.focusPayload.riskLevel === "moderado"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {content.focusPayload.riskPercent24h}%
              </span>
              {content.focusPayload.hasVM && (
                <span className="patient-mobile-header-chip bg-blue-50 text-blue-700 border border-blue-200">
                  VM
                </span>
              )}
              {content.focusPayload.hasVaso && (
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
              // Em mobile, o microfone está no ChatInput fixo no rodapé
              // Este botão pode ser usado para scroll até o chat ou apenas indicar que o microfone está disponível
              const chatInput = document.querySelector('.chat-input-footer');
              if (chatInput) {
                chatInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
              }
            }}
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tab bar para mobile - apenas "Visão geral" quando há paciente ativo */}
      {isMobile && content.focusPayload && (
        <div className="patient-tab-bar">
          <button
            type="button"
            className={`patient-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Visão geral
          </button>
        </div>
      )}

      {/* Andar 1: Cabeçalho clínico curto - dentro de card (desktop) */}
      {!isMobile && content.focusPayload && (
        <section className="plantonista-section plantonista-section-header">
          <div className="plantonista-header-card">
            <div className="plantonista-header-main">
              <span className="plantonista-header-bed">{content.focusPayload.leito}</span>
              <h3 className="plantonista-header-name">{content.focusPayload.nome}</h3>
            </div>
            <p className="plantonista-header-diagnosis">
              {content.focusPayload.idade} anos • {content.focusPayload.peso} kg • {content.focusPayload.diagnosticoPrincipal}
            </p>
            <div className="plantonista-header-chips">
              <span className={`plantonista-header-chip ${content.focusPayload.riskLevel === "alto" ? "chip-risk-high" : content.focusPayload.riskLevel === "moderado" ? "chip-risk-medium" : "chip-risk-low"}`}>
                Risco 24h: {content.focusPayload.riskPercent24h}%
              </span>
              {content.focusPayload.hasVM && (
                <span className="plantonista-header-chip chip-vm">VM: Sim</span>
              )}
              {content.focusPayload.hasVaso && (
                <span className="plantonista-header-chip chip-vaso">Vaso: Sim</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Conteúdo da aba Visão geral - em mobile mostra apenas isso quando há paciente */}
      <div className={`patient-tab-content ${!isMobile || activeTab === "overview" ? "active" : ""}`}>
        {/* Andar 2: Dashboards de decisão - dentro de card */}
        {orderedDashboards.length > 0 && (
          <section className="plantonista-section plantonista-section-dashboards">
            <div className="plantonista-dashboards-card">
              <h3 className="plantonista-section-title">Dashboards de decisão</h3>
              <div className="plantonista-dashboards-grid">
                {orderedDashboards.map((dashboard, idx) => (
                  <MicroDashboardV2Renderer key={idx} dashboard={dashboard} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Conteúdo da aba Evolução - apenas em desktop ou se não for mobile */}
      {!isMobile && (
        <div className={`patient-tab-content ${!isMobile || activeTab === "evolution" ? "active" : ""}`}>
          {/* Andar 3: Evolução - apenas timeline, eventos marcantes vão no preview */}
          {patient && dailyStatus.length > 0 && (
            <section className="plantonista-section plantonista-section-evolution">
              <div className="plantonista-evolution-card">
                <h3 className="plantonista-section-title">Evolução na UTI</h3>
                <div className="plantonista-evolution-timeline">
                  <PatientBigTimeline
                    dailyStatus={dailyStatus}
                    highlights={content.timelineHighlights}
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Conteúdo da aba Parecer - apenas em desktop ou se não for mobile */}
      {!isMobile && (
        <div className={`patient-tab-content ${!isMobile || activeTab === "opinion" ? "active" : ""}`}>
          {/* Andar 4: Parecer resumido - dentro de card */}
          {/* IMPORTANTE: Priorizar voiceNoteSummary do paciente se disponível, senão usar plainTextAnswer */}
          {/* Só renderizar se houver texto para exibir */}
          {(patient?.voiceNoteSummary || content.plainTextAnswer) && (
            <section 
              className="plantonista-section plantonista-section-opinion"
              key={`parecer-${patient?.id || 'default'}-${patient?.voiceNoteSummary ? patient.voiceNoteSummary.substring(0, 30).replace(/\s/g, '-') : 'plaintext'}-${patientUpdateKey || 0}`}
            >
              <div className="plantonista-opinion-card">
                <h3 className="plantonista-section-title">Parecer do Plantonista</h3>
                <OpinionBullets text={patient?.voiceNoteSummary || content.plainTextAnswer || ''} />
              </div>
            </section>
          )}
        </div>
      )}

      {/* CTA para ver evolução completa */}
      {content.focusPayload?.patientId && (
        <div className="plantonista-cta-wrapper">
          <button
            className="plantonista-cta-button"
            onClick={() => {
              if (onShowFullEvolution && content.focusPayload?.patientId) {
                onShowFullEvolution(content.focusPayload.patientId);
              } else {
                handleScrollToEvolution();
              }
            }}
          >
            Ver evolução completa →
          </button>
        </div>
      )}
    </div>
  );
}

