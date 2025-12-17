"use client";

import type { RadiologyReportFull } from "@/types/RadiologyOpinion";
import { Clock } from "lucide-react";

interface RadiologyReportDetailsProps {
  report: RadiologyReportFull;
}

export function RadiologyReportDetails({ report }: RadiologyReportDetailsProps) {
  return (
    <>
      {/* Informações do exame */}
      <div className="detail-card">
        <h4 className="detail-card-title">Informações do Exame</h4>
        <div className="detail-summary-grid">
          <div className="detail-key-value">
            <span className="detail-key">Tipo de Exame</span>
            <span className="detail-value">{report.examTypeLabel}</span>
          </div>
          <div className="detail-key-value">
            <span className="detail-key">Data</span>
            <span className="detail-value">{report.dateMock}</span>
          </div>
        </div>
      </div>

      {/* Técnica */}
      <div className="detail-card">
        <h4 className="detail-card-title">Técnica</h4>
        <p className="text-slate-700 text-sm leading-relaxed">
          {report.technique}
        </p>
      </div>

      {/* Achados completos */}
      <div className="detail-card">
        <h4 className="detail-card-title">Achados</h4>
        <ul className="space-y-2 mt-3">
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
      </div>

      {/* Impressão Diagnóstica */}
      <div className="detail-card">
        <h4 className="detail-card-title">Impressão Diagnóstica</h4>
        <p className="text-slate-700 text-sm leading-relaxed">
          {report.impression}
        </p>
      </div>

      {/* Correlação Clínica */}
      <div className="detail-card">
        <h4 className="detail-card-title">Correlação Clínica</h4>
        <p className="text-slate-700 text-sm leading-relaxed">
          {report.correlation}
        </p>
      </div>

      {/* Sugestões (apenas exames de imagem) */}
      {report.suggestions.length > 0 && (
        <div className="detail-card">
          <h4 className="detail-card-title">Sugestões</h4>
          <ul className="space-y-2 mt-3">
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
        </div>
      )}

      {/* Disclaimer */}
      <div className="detail-card">
        <p className="text-xs text-slate-500 leading-relaxed">
          {report.disclaimer}
        </p>
      </div>
    </>
  );
}

