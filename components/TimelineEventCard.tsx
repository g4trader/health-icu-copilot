"use client";

import type { TimelineEvent } from "@/lib/patientTimeline";
import { formatRelativeTime } from "@/lib/patientTimeline";
import { UserPlus, Beaker, Scan, Syringe, FileText, Activity } from "lucide-react";
import { usePreview } from "./PreviewProvider";
import type { RadiologyReportFull } from "@/types/RadiologyOpinion";
import { buildRadiologyReport } from "@/lib/radiologyOpinionBuilder";
import type { Patient } from "@/types/Patient";
import { mockPatients } from "@/lib/mockData";

interface TimelineEventCardProps {
  event: TimelineEvent;
  patient?: Patient;
}

const eventIcons: Record<TimelineEvent['type'], typeof UserPlus> = {
  admission: UserPlus,
  vitals: Activity,
  lab: Beaker,
  imaging: Scan,
  therapy: Syringe,
  note: FileText,
};

const severityColors: Record<NonNullable<TimelineEvent['severity']>, string> = {
  normal: 'border-slate-200 bg-slate-50',
  warning: 'border-amber-200 bg-amber-50',
  critical: 'border-rose-200 bg-rose-50',
};

export function TimelineEventCard({ event, patient }: TimelineEventCardProps) {
  const { setPreview } = usePreview();
  const Icon = eventIcons[event.type];
  
  const handleViewExam = () => {
    if (event.relatedExamId && patient) {
      // Gerar o report completo do Radiologista Virtual
      const report = buildRadiologyReport(patient);
      setPreview('radiology-report', { report: report.full });
    }
  };

  const severityClass = event.severity ? severityColors[event.severity] : severityColors.normal;

  return (
    <div className="relative pl-8 pb-4">
      {/* Ponto na linha */}
      <div className={`absolute left-[-6px] top-1 w-3 h-3 rounded-full border-2 border-white ${event.severity === 'critical' ? 'bg-rose-500' : event.severity === 'warning' ? 'bg-amber-500' : 'bg-slate-400'}`} />
      
      {/* Conteúdo do card */}
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${severityClass}`}>
        <div className="p-1.5 bg-white border border-slate-200 rounded-lg flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-slate-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-900">
              {event.title}
            </h4>
            <span className="text-xs text-slate-500 flex-shrink-0">
              {formatRelativeTime(event.timestamp)}
            </span>
          </div>
          
          {event.description && (
            <p className="text-xs text-slate-600 mb-2">
              {event.description}
            </p>
          )}
          
          {event.relatedExamId && patient && (
            <button
              type="button"
              onClick={handleViewExam}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 underline"
            >
              Ver exame
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

