"use client";

import type { Patient } from "@/types/Patient";
import { PatientPinButton } from "@/components/PatientPinButton";
import { PatientOpinionBadges } from "@/components/PatientOpinionBadges";
import { riskLevelFromScore } from "@/lib/mockData";
import { Maximize2 } from "lucide-react";

interface PatientListItemProps {
  patient: Patient;
  selected?: boolean;
  onSelect?: (patient: Patient) => void;
  onExpand?: (patientId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function PatientListItem({
  patient,
  selected = false,
  onSelect,
  onExpand,
  showActions = true,
  className = "",
}: PatientListItemProps) {
  const riskLevel = riskLevelFromScore(patient.riscoMortality24h);
  const riskPercent = Math.round(patient.riscoMortality24h * 100);
  
  const hasVM = !!patient.ventilationParams;
  const hasVaso = patient.medications.some(
    (m) => m.tipo === "vasopressor" && m.ativo
  );
  const hasAntibiotic = patient.medications.some(
    (m) => m.tipo === "antibiotico" && m.ativo
  );

  const riskVariant =
    riskLevel === "alto"
      ? "danger"
      : riskLevel === "moderado"
      ? "warning"
      : "default";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(patient)}
      className={`
        w-full
        p-4
        bg-white
        border rounded-2xl
        shadow-sm
        text-left
        transition-all
        hover:shadow-md hover:border-slate-300
        ${selected ? "border-emerald-500 shadow-md ring-2 ring-emerald-100" : "border-slate-200"}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-900 font-semibold text-sm">
              {patient.leito}
            </span>
            <span className="text-slate-600 font-medium text-sm">
              {patient.nome}
            </span>
          </div>
          <div className="text-slate-600 text-xs">
            {patient.idade} anos • {patient.diagnosticoPrincipal}
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onExpand && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand(patient.id);
                }}
                className="inline-flex items-center justify-center w-7 h-7 border border-slate-300 rounded-lg bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                aria-label="Expandir perfil"
                title="Expandir perfil"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
            <PatientPinButton patient={patient} />
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div
          className={`
            px-2.5 py-1
            rounded-lg
            border
            text-xs font-semibold tabular-nums
            ${
              riskVariant === "danger"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : riskVariant === "warning"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }
          `}
        >
          Risco {riskPercent}%
        </div>
        
        {hasVM && (
          <div className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium uppercase tracking-wide">
            VM
          </div>
        )}
        
        {hasVaso && (
          <div className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium uppercase tracking-wide">
            Vasopressor
          </div>
        )}
        
        {hasAntibiotic && (
          <div className="px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-xs font-medium uppercase tracking-wide">
            ATB
          </div>
        )}
      </div>

      {/* Opinion Badges */}
      <PatientOpinionBadges patientId={patient.id} maxVisible={2} />

      {/* Footer Info */}
      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          {patient.labResults.find((l) => l.tipo === "lactato") && (
            <span>
              Lactato{" "}
              {typeof patient.labResults.find((l) => l.tipo === "lactato")
                ?.valor === "number"
                ? (
                    patient.labResults.find((l) => l.tipo === "lactato")
                      ?.valor as number
                  ).toFixed(1)
                : "N/A"}{" "}
              mmol/L
            </span>
          )}
          <span>{patient.diasDeUTI} dias UTI</span>
        </div>
      </div>
    </button>
  );
}
