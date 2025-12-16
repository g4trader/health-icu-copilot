"use client";

import type { Patient } from "@/types/Patient";
import { PatientPinButton } from "@/components/PatientPinButton";
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
        border rounded-lg
        border-slate-300
        text-left
        transition-all
        hover:border-slate-400
        ${selected ? "border-emerald-500 shadow-md ring-2 ring-emerald-100" : ""}
        ${className}
      `}
    >
      <div className="space-y-1.5">
        {/* Linha 1: UTI 01•Sophia */}
        <div className="flex items-center gap-0.5">
          <span className="text-slate-700 text-sm font-medium">{patient.leito}</span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-900 font-semibold text-sm">
            {patient.nome}
          </span>
        </div>

        {/* Linha 2: Idade */}
        <div className="text-sm text-slate-700">
          {patient.idade} {patient.idade === 1 ? "ano" : "anos"}
        </div>

        {/* Linha 3: Diagnóstico */}
        <div className="text-sm text-slate-700">
          {patient.diagnosticoPrincipal}
        </div>

        {/* Linha 4: Risco 24h */}
        <div className="text-sm text-slate-700">
          Risco 24h: {riskPercent}%
        </div>

        {/* Linha 5: VM e Vasopressor */}
        <div className="text-sm text-slate-700">
          VM: {hasVM ? "Sim" : "Não"} • Vasopressor: {hasVaso ? "Sim" : "Não"}
        </div>
      </div>
      
      {/* PIN no centro inferior */}
      {showActions && (
        <div className="flex justify-center items-center gap-2 mt-3 pt-2 border-t border-slate-200">
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
    </button>
  );
}
