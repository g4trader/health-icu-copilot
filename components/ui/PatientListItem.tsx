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

  const lactato = patient.labResults.find((l) => l.tipo === "lactato");
  const lactatoValue = lactato && typeof lactato.valor === "number" ? lactato.valor : null;
  const lactatoTrend = lactato?.tendencia === "subindo" ? "↑" : lactato?.tendencia === "caindo" ? "↓" : "";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(patient)}
      className={`
        w-full
        p-3
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
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Linha 1: Nome • Idade • Leito */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-slate-900 font-semibold text-sm">
              {patient.nome}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 text-sm">{patient.idade}a</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 text-sm font-medium">{patient.leito}</span>
          </div>

          {/* Linha 2: Risco (dominante) + Badges + Info */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Risco - visualmente dominante */}
            <div
              className={`
                px-2.5 py-1
                rounded-lg
                border
                text-xs font-bold tabular-nums
                ${
                  riskVariant === "danger"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : riskVariant === "warning"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }
              `}
            >
              ⚠️ Risco {riskPercent}%
            </div>
            
            {hasVM && (
              <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium uppercase">
                VM
              </span>
            )}
            
            {hasVaso && (
              <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium uppercase">
                Vaso
              </span>
            )}
            
            {/* Lactato e dias UTI */}
            {lactatoValue && (
              <>
                <span className="text-slate-600 text-xs font-medium tabular-nums">
                  Lactato {lactatoTrend} {lactatoValue.toFixed(1)}
                </span>
                <span className="text-slate-400">|</span>
              </>
            )}
            <span className="text-slate-600 text-xs">
              D{patient.diasDeUTI} UTI
            </span>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-1 flex-shrink-0">
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
            <div onClick={(e) => e.stopPropagation()}>
              <PatientPinButton patient={patient} />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
