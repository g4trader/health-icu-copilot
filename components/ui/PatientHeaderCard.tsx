"use client";

import type { Patient } from "@/types/Patient";
import { PatientPinButton } from "@/components/PatientPinButton";
import { PatientOpinionBadges } from "@/components/PatientOpinionBadges";
import { riskLevelFromScore } from "@/lib/mockData";
import { BaseCard } from "./BaseCard";
import { SectionHeader } from "./SectionHeader";
import { Maximize2 } from "lucide-react";

interface PatientHeaderCardProps {
  patient: Patient;
  onExpand?: (patientId: string) => void;
  className?: string;
}

export function PatientHeaderCard({
      patient,
      onExpand,
      className = "",
    }: PatientHeaderCardProps) {
  const riskLevel = riskLevelFromScore(patient.riscoMortality24h);
  const riskPercent = Math.round(patient.riscoMortality24h * 100);

  const hasVM = !!patient.ventilationParams;
  const hasVaso = patient.medications.some(
    (m) => m.tipo === "vasopressor" && m.ativo
  );

  return (
    <BaseCard className={className} padding="md">
      <SectionHeader
        title={`${patient.leito} • ${patient.nome}`}
        subtitle={`${patient.idade} anos • ${patient.diagnosticoPrincipal}`}
            action={
              <div className="flex items-center gap-2">
                {onExpand && (
                  <button
                    type="button"
                    onClick={() => onExpand(patient.id)}
                    className="inline-flex items-center justify-center w-7 h-7 border border-slate-300 rounded-lg bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                    aria-label="Expandir perfil"
                    title="Expandir perfil"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <PatientPinButton patient={patient} />
              </div>
            }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div
          className={`
            px-3 py-1.5
            rounded-lg
            border
            text-xs font-semibold tabular-nums
            ${
              riskLevel === "alto"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : riskLevel === "moderado"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }
          `}
        >
          Risco 24h: {riskPercent}%
        </div>

        {hasVM && (
          <div className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium uppercase tracking-wide">
            VM
          </div>
        )}

        {hasVaso && (
          <div className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium uppercase tracking-wide">
            Vasopressor
          </div>
        )}

        <PatientOpinionBadges patientId={patient.id} maxVisible={2} />
      </div>
    </BaseCard>
  );
}

