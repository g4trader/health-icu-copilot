"use client";

import { getPatientTimelineSummary, formatRelativeTime, eventTypeLabels } from "@/lib/patientTimeline";
import type { TimelineEvent } from "@/lib/patientTimeline";
import { UserPlus, Beaker, Scan, Syringe, FileText, Activity } from "lucide-react";
import { BaseCard } from "./ui/BaseCard";
import { SectionHeader } from "./ui/SectionHeader";
import { usePreview } from "./PreviewProvider";
import { buildRadiologyReport } from "@/lib/radiologyOpinionBuilder";
import { mockPatients } from "@/lib/mockData";

interface PatientTimelineSummaryProps {
  patientId: string;
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

export function PatientTimelineSummary({ patientId }: PatientTimelineSummaryProps) {
  const { setPreview } = usePreview();
  const { events, isFallback } = getPatientTimelineSummary(patientId);

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
    <BaseCard className="mb-6" padding="md">
      <SectionHeader title="Resumo das últimas 24h" />
      {isFallback && (
        <p className="mt-2 text-xs text-slate-500">
          Sem eventos relevantes nas últimas 24h; exibindo os mais recentes.
        </p>
      )}
      <div className="mt-3 space-y-2.5">
        {events.map((event) => {
          const Icon = eventIcons[event.type];
          const severity = event.severity || 'normal';
          const badgeClass = severityBadgeClasses[severity];
          const badgeLabel = severityLabels[severity];
          const typeLabel = eventTypeLabels[event.type];
          const isClickable = !!event.relatedExamId;

          return (
            <div
              key={event.id}
              className={`flex items-start gap-3 py-2 ${isClickable ? 'cursor-pointer hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors' : ''}`}
              onClick={isClickable ? () => handleEventClick(event) : undefined}
            >
              <div className="p-1.5 bg-white border border-slate-200 rounded-lg flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-slate-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 leading-tight line-clamp-1">
                  <span className="text-xs font-medium text-slate-600 tabular-nums">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                  <span className="text-slate-400 mx-1">•</span>
                  <span className="text-slate-600">{typeLabel}</span>
                  <span className="text-slate-400 mx-1">—</span>
                  <span>{event.title}</span>
                </p>
                <div className="mt-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold border ${badgeClass}`}
                  >
                    {badgeLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </BaseCard>
  );
}

