"use client";

import type { PlantonistaAnswerContent } from "@/types/PlantonistaAnswerContent";
import { MicroDashboardV2Renderer } from "./MicroDashboardV2Renderer";
import { PatientCard } from "../patients/PatientCard";
import type { Patient } from "@/types/Patient";

interface PlantonistaAnswerPanelProps {
  content: PlantonistaAnswerContent;
  onSelectPatient?: (patientId: string) => void;
  onExpandPatient?: (patientId: string) => void;
}

/**
 * Componente canônico para renderizar respostas do Plantonista
 * Padroniza o estilo visual independente da origem (botão pré-definido, texto livre, paciente específico)
 */
export function PlantonistaAnswerPanel({
  content,
  onSelectPatient,
  onExpandPatient,
}: PlantonistaAnswerPanelProps) {
  const handleScrollToEvolution = () => {
    document.getElementById("patient-evolution-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="plantonista-response-panel">
      {/* Header: Texto principal */}
      {content.plainTextAnswer && (
        <div className="plantonista-response-header">
          <p className="plantonista-response-text">
            {content.plainTextAnswer}
          </p>
        </div>
      )}

      {/* Middle: Micro Dashboards */}
      {content.microDashboards && content.microDashboards.length > 0 && (
        <div className="plantonista-response-dashboards">
          {content.microDashboards.map((dashboard, idx) => (
            <MicroDashboardV2Renderer key={idx} dashboard={dashboard} />
          ))}
        </div>
      )}

      {/* TOP N Patients List (para PRIORITIZACAO) */}
      {content.topPatients && content.topPatients.length > 0 && (
        <div className="plantonista-response-patients">
          <h3 className="text-slate-900 font-semibold text-base mb-3">
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

      {/* CTA para ver evolução completa (quando há paciente focado) */}
      {content.focusPatientId && (
        <div className="mt-4 text-center">
          <button
            className="plantonista-cta-button"
            onClick={handleScrollToEvolution}
          >
            Ver evolução completa →
          </button>
        </div>
      )}
    </div>
  );
}

