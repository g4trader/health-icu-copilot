"use client";

import type { DailyPatientStatus } from "@/types/DailyPatientStatus";
import type { TimelineHighlight } from "@/types/LlmPatientAnswer";
import { Wind, Heart } from "lucide-react";

interface PatientBigTimelineProps {
  dailyStatus: DailyPatientStatus[];
  highlights?: TimelineHighlight[];
}

export function PatientBigTimeline({ dailyStatus, highlights }: PatientBigTimelineProps) {
  // Criar mapa de highlights por dia
  const highlightsByDay = new Map<number, TimelineHighlight[]>();
  highlights?.forEach((h) => {
    const list = highlightsByDay.get(h.diaUti) ?? [];
    list.push(h);
    highlightsByDay.set(h.diaUti, list);
  });

  // Formatar data para exibição (dd/MM)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  // Pegar últimos 14 dias para densidade melhor (ou 30 se preferir)
  const daysToShow = dailyStatus.slice(-14);

  return (
    <div className="big-timeline">
      <div className="big-timeline-header">
        <h4 className="big-timeline-title">Evolução na UTI (últimos 14 dias)</h4>
      </div>
      
      {/* Row de dias */}
      <div className="big-timeline-days">
        {daysToShow.map((status) => {
          const dayHighlights = highlightsByDay.get(status.diaUti);
          const hasCriticalEvent = dayHighlights?.some(
            h => h.tipo === "evento_critico" || h.tipo === "piora"
          );
          const hasIntervention = dayHighlights?.some(h => h.tipo === "intervencao");
          const hasVM = status.suporteVentilatorio?.mode !== undefined;
          const hasVaso = status.suporteHemodinamico?.hasVasopressor;

          return (
            <div
              key={status.data}
              className={`big-timeline-day ${hasCriticalEvent ? "has-critical-event" : ""} ${hasIntervention ? "has-intervention" : ""}`}
              title={`Dia ${status.diaUti} - ${formatDate(status.data)}: ${status.statusGlobal}`}
            >
              {/* Status dot */}
              <div className={`status-dot status-${status.statusGlobal}`}>
                {hasCriticalEvent && <div className="event-marker event-critical" />}
                {hasIntervention && !hasCriticalEvent && <div className="event-marker event-intervention" />}
              </div>
              
              {/* Ícones de suporte */}
              <div className="big-timeline-support-icons">
                {hasVM && (
                  <span className="support-icon support-vm" title="Ventilação Mecânica">
                    <Wind className="w-3 h-3" />
                  </span>
                )}
                {hasVaso && (
                  <span className="support-icon support-vaso" title="Vasopressor">
                    <Heart className="w-3 h-3" />
                  </span>
                )}
              </div>
              
              {/* Label do dia */}
              <div className="big-timeline-day-label">
                D{status.diaUti}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltips com highlights (se houver) */}
      {highlights && highlights.length > 0 && (
        <div className="big-timeline-highlights">
          {Array.from(highlightsByDay.entries()).map(([diaUti, dayHighlights]) => (
            <div key={diaUti} className="highlight-tag-group">
              {dayHighlights.map((h, idx) => (
                <div
                  key={`${h.data}-${idx}`}
                  className={`highlight-tag highlight-${h.tipo}`}
                  title={h.descricao || h.descricaoCurta}
                >
                  {h.descricaoCurta}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Legenda */}
      <div className="big-timeline-legend">
        <span className="legend-item">
          <span className="dot status-critico" /> Crítico
        </span>
        <span className="legend-item">
          <span className="dot status-grave" /> Grave
        </span>
        <span className="legend-item">
          <span className="dot status-estavel" /> Estável
        </span>
        <span className="legend-item">
          <span className="dot status-melhora" /> Melhora
        </span>
        <span className="legend-item">
          <span className="dot status-alta_uti" /> Alta UTI
        </span>
        <span className="legend-item">
          <Wind className="w-3 h-3 inline" /> VM
        </span>
        <span className="legend-item">
          <Heart className="w-3 h-3 inline" /> Vaso
        </span>
      </div>
    </div>
  );
}

