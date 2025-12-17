"use client";

import type { PlantonistaAnswerContent } from "@/types/PlantonistaAnswerContent";
import { MicroDashboardV2Renderer } from "./MicroDashboardV2Renderer";
import { PatientCard } from "../patients/PatientCard";
import type { Patient } from "@/types/Patient";
import { OpinionBullets } from "./OpinionBullets";
import { PatientBigTimeline } from "./PatientBigTimeline";
import { getDailyStatus } from "@/lib/patientTimeline";
import { mockPatients } from "@/lib/mockData";

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
}: PlantonistaAnswerPanelProps) {
  const handleScrollToEvolution = () => {
    document.getElementById("patient-evolution-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Buscar paciente e dailyStatus se houver focusPayload
  const patient = content.focusPayload?.patientId 
    ? mockPatients.find(p => p.id === content.focusPayload!.patientId)
    : null;
  const dailyStatus = patient ? getDailyStatus(patient.id) : [];

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
              />
            ))}
          </div>
        </div>
      )}

      {/* Andar 1: Cabeçalho clínico curto - dentro de card */}
      {content.focusPayload && (
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

      {/* Andar 4: Parecer resumido - dentro de card */}
      {content.plainTextAnswer && (
        <section className="plantonista-section plantonista-section-opinion">
          <div className="plantonista-opinion-card">
            <h3 className="plantonista-section-title">Parecer do Plantonista</h3>
            <OpinionBullets text={content.plainTextAnswer} />
          </div>
        </section>
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

