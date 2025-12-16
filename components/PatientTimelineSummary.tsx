"use client";

import { getPatientTimelineSummary } from "@/lib/patientTimeline";
import { formatRelativeTime } from "@/lib/patientTimeline";
import type { TimelineEvent } from "@/lib/patientTimeline";
import { UserPlus, Beaker, Scan, Syringe, FileText, Activity } from "lucide-react";
import { BaseCard } from "./ui/BaseCard";
import { SectionHeader } from "./ui/SectionHeader";

interface PatientTimelineSummaryProps {
  patientId: string;
}

const eventIcons: Record<TimelineEvent['type'], typeof UserPlus> = {
  admission: UserPlus,
  vitals: Activity,
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
  const summaryEvents = getPatientTimelineSummary(patientId);

  if (summaryEvents.length === 0) {
    return null;
  }

  return (
    <BaseCard className="mb-6" padding="md">
      <SectionHeader title="Resumo das últimas 24h" />
      <div className="mt-3 space-y-2.5">
        {summaryEvents.map((event) => {
          const Icon = eventIcons[event.type];
          const severity = event.severity || 'normal';
          const badgeClass = severityBadgeClasses[severity];
          const badgeLabel = severityLabels[severity];

          return (
            <div
              key={event.id}
              className="flex items-start gap-3 py-2"
            >
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-slate-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-600 tabular-nums">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold border ${badgeClass}`}
                  >
                    {badgeLabel}
                  </span>
                </div>
                <p className="text-sm text-slate-900 leading-tight line-clamp-1">
                  {event.title}
                  {event.description && ` • ${event.description}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </BaseCard>
  );
}

