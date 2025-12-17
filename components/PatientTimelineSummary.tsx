"use client";

import { getPatientTimelineSummary, formatRelativeTime, eventTypeLabels } from "@/lib/patientTimeline";
import type { TimelineEvent } from "@/lib/patientTimeline";
import { UserPlus, Beaker, Scan, Syringe, FileText, Activity } from "lucide-react";
import { BaseCard } from "./ui/BaseCard";
import { SectionHeader } from "./ui/SectionHeader";
import { usePreview } from "./PreviewProvider";
import { buildRadiologyReport } from "@/lib/radiologyOpinionBuilder";
import { mockPatients } from "@/lib/mockData";
import { TimelineEventCard } from "./TimelineEventCard";

interface PatientTimelineSummaryProps {
  patientId: string;
  timelineHighlights?: import("@/types/LlmPatientAnswer").TimelineHighlight[]; // Destaques do LLM (opcional)
}

const eventIcons: Record<TimelineEvent['type'], typeof UserPlus> = {
  admission: UserPlus,
  lab: Beaker,
  imaging: Scan,
  therapy: Syringe,
  note: FileText,
};

const severityBadgeClasses: Record<NonNullable<TimelineEvent['severity']>, string> = {
  normal: 'bg-slate-100 text-slate-700 border-slate-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
};

const severityLabels: Record<NonNullable<TimelineEvent['severity']>, string> = {
  normal: 'Normal',
  warning: 'Atenção',
  critical: 'Crítico',
};

export function PatientTimelineSummary({ patientId, timelineHighlights }: PatientTimelineSummaryProps) {
  const { setPreview } = usePreview();
  const { events, isFallback } = getPatientTimelineSummary(patientId);
  const patient = mockPatients.find(p => p.id === patientId);

  // Se houver highlights do LLM, renderizar eles primeiro
  if (timelineHighlights && timelineHighlights.length > 0) {
    const highlightEvents: TimelineEvent[] = timelineHighlights.map((highlight, idx) => {
      let severity: 'normal' | 'warning' | 'critical' = 'normal';
      if (highlight.relevancia === 'alta') {
        severity = 'critical';
      } else if (highlight.relevancia === 'media') {
        severity = 'warning';
      }
      
      return {
        id: `highlight-${idx}`,
        type: 'note' as const,
        title: highlight.titulo || highlight.descricaoCurta,
        description: highlight.descricao || highlight.descricaoCurta,
        timestamp: highlight.data,
        severity
      };
    });

    return (
      <div className="plantonista-timeline-summary-card">
        <h4 className="plantonista-timeline-summary-title">Destaques da Evolução</h4>
        <div className="plantonista-timeline-events-list">
          {highlightEvents.map((event) => {
            const Icon = eventIcons[event.type];
            const severity = event.severity || 'normal';
            const badgeClass = severityBadgeClasses[severity];
            const badgeLabel = severityLabels[severity];

            return (
              <div key={event.id} className="plantonista-timeline-event-card">
                <div className="plantonista-timeline-event-icon">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <div className="plantonista-timeline-event-content">
                  <div className="plantonista-timeline-event-header">
                    <div className="plantonista-timeline-event-text">
                      <p className="plantonista-timeline-event-title">{event.title}</p>
                      {event.description && (
                        <p className="plantonista-timeline-event-description">{event.description}</p>
                      )}
                      <p className="plantonista-timeline-event-time">{formatRelativeTime(event.timestamp)}</p>
                    </div>
                    <span className={`plantonista-timeline-event-badge ${badgeClass}`}>
                      {badgeLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  const handleEventClick = (event: TimelineEvent) => {
    if (event.relatedExamId) {
      const patient = mockPatients.find(p => p.id === patientId);
      if (patient) {
        const report = buildRadiologyReport(patient);
        setPreview('radiology-report', { report: report.full });
      }
    }
  };

  return (
    <div className="plantonista-timeline-summary-card">
      <h4 className="plantonista-timeline-summary-title">Eventos marcantes</h4>
      {isFallback && (
        <p className="plantonista-timeline-summary-fallback">
          Sem eventos relevantes nas últimas 24h; exibindo os mais recentes.
        </p>
      )}
      <div className="plantonista-timeline-events-list">
        {events.map((event) => {
          const Icon = eventIcons[event.type];
          const severity = event.severity || 'normal';
          const badgeClass = severityBadgeClasses[severity];
          const badgeLabel = severityLabels[severity];
          const isClickable = !!event.relatedExamId;

          return (
            <div
              key={event.id}
              className={`plantonista-timeline-event-card ${isClickable ? 'plantonista-timeline-event-clickable' : ''}`}
              onClick={isClickable ? () => handleEventClick(event) : undefined}
            >
              <div className="plantonista-timeline-event-icon">
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="plantonista-timeline-event-content">
                <div className="plantonista-timeline-event-header">
                  <div className="plantonista-timeline-event-text">
                    <p className="plantonista-timeline-event-title">{event.title}</p>
                    {event.description && (
                      <p className="plantonista-timeline-event-description">{event.description}</p>
                    )}
                    <p className="plantonista-timeline-event-time">{formatRelativeTime(event.timestamp)}</p>
                  </div>
                  <span className={`plantonista-timeline-event-badge ${badgeClass}`}>
                    {badgeLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

