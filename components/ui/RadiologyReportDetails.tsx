"use client";

import type { RadiologyReportFull } from "@/types/RadiologyOpinion";
import { Scan, Clock } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

interface RadiologyReportDetailsProps {
  report: RadiologyReportFull;
}

export function RadiologyReportDetails({ report }: RadiologyReportDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-slate-100 rounded-xl">
            <Scan className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-slate-900 font-semibold text-lg mb-1">
              Parecer do Radiologista Virtual
            </h2>
            <p className="text-slate-600 text-sm mb-2">
              {report.examTypeLabel} • {report.patientBed} • {report.patientName}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{report.dateMock}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Realizado em: {new Date(report.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Técnica */}
      <section>
        <SectionHeader title="Técnica" />
        <p className="text-slate-700 text-sm leading-relaxed mt-3">
          {report.technique}
        </p>
      </section>

      {/* Achados completos */}
      <section>
        <SectionHeader title="Achados" />
        <ul className="mt-3 space-y-2">
          {report.findings.map((finding, idx) => (
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
          {report.impression}
        </p>
      </section>

      {/* Correlação Clínica */}
      <section>
        <SectionHeader title="Correlação Clínica" />
        <p className="text-slate-700 text-sm leading-relaxed mt-3">
          {report.correlation}
        </p>
      </section>

      {/* Sugestões (apenas exames de imagem) */}
      {report.suggestions.length > 0 && (
        <section>
          <SectionHeader title="Sugestões" />
          <ul className="mt-3 space-y-2">
            {report.suggestions.map((suggestion, idx) => (
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

      {/* Disclaimer */}
      <div className="pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          {report.disclaimer}
        </p>
      </div>
    </div>
  );
}

