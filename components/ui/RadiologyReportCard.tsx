"use client";

import type { RadiologyReportSummary } from "@/types/RadiologyOpinion";
import { Scan, ExternalLink } from "lucide-react";
import { BaseCard } from "./BaseCard";
import { usePreview } from "../PreviewProvider";

interface RadiologyReportCardProps {
  summary: RadiologyReportSummary;
  fullReport: import("@/types/RadiologyOpinion").RadiologyReportFull;
}

export function RadiologyReportCard({ summary, fullReport }: RadiologyReportCardProps) {
  const { setPreview } = usePreview();

  const handleViewDetails = () => {
    setPreview('radiology-report', { report: fullReport });
  };

  return (
    <BaseCard className="mt-4 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-slate-100 rounded-xl">
            <Scan className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-900 font-semibold text-sm mb-1">
              Parecer do Radiologista Virtual
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
              <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-medium">
                {summary.examTypeLabel}
              </span>
              <span>{summary.patientBed} • {summary.patientName}</span>
              <span className="text-xs text-slate-500">{summary.dateMock}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Findings (3 bullets) */}
      <div className="mb-3">
        <ul className="space-y-1.5">
          {summary.keyFindings.map((finding, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-slate-700 text-xs"
            >
              <span className="text-slate-400 mt-1 flex-shrink-0">•</span>
              <span className="leading-relaxed">{finding}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Impression Short (1-2 lines) */}
      <div className="mb-3">
        <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
          {summary.impressionShort}
        </p>
      </div>

      {/* Button to view details */}
      <button
        type="button"
        onClick={handleViewDetails}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>Ver detalhes do exame</span>
      </button>
    </BaseCard>
  );
}

