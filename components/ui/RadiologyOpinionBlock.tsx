"use client";

import type { RadiologyOpinion } from "@/types/RadiologyOpinion";
import { Scan, Clock } from "lucide-react";
import { BaseCard } from "./BaseCard";
import { SectionHeader } from "./SectionHeader";

interface RadiologyOpinionBlockProps {
  opinion: RadiologyOpinion;
}

export function RadiologyOpinionBlock({ opinion }: RadiologyOpinionBlockProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <BaseCard className="mt-4 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-slate-100 rounded-xl">
            <Scan className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-900 font-semibold text-base mb-1">
              Radiologista Virtual
            </h3>
            <p className="text-slate-600 text-sm">
              {opinion.examTypeLabel} • {opinion.patientBed} • {opinion.patientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-xs flex-shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(opinion.timestamp)}</span>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Achados */}
        <section>
          <SectionHeader title="Achados" />
          <ul className="mt-3 space-y-2">
            {opinion.findings.map((finding, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-slate-700 text-sm"
              >
                <span className="text-slate-400 mt-1.5 flex-shrink-0">•</span>
                <span className="leading-relaxed">{finding}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Impressão Diagnóstica */}
        <section>
          <SectionHeader title="Impressão Diagnóstica" />
          <p className="text-slate-700 text-sm leading-relaxed mt-3">
            {opinion.diagnosticImpression}
          </p>
        </section>

        {/* Correlação Clínica */}
        <section>
          <SectionHeader title="Correlação Clínica" />
          <p className="text-slate-700 text-sm leading-relaxed mt-3">
            {opinion.clinicalCorrelation}
          </p>
        </section>

        {/* Sugestões */}
        {opinion.suggestions.length > 0 && (
          <section>
            <SectionHeader title="Sugestões" />
            <ul className="mt-3 space-y-2">
              {opinion.suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-slate-700 text-sm"
                >
                  <span className="text-slate-400 mt-1.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{suggestion}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Parecer radiológico automatizado com dados simulados. Sempre confirme achados com avaliação radiológica formal e equipe médica.
        </p>
      </div>
    </BaseCard>
  );
}

