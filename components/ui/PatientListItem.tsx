"use client";

import type { Patient } from "@/types/Patient";
import { PatientPinButton } from "@/components/PatientPinButton";

interface PatientListItemProps {
  patient: Patient;
  selected?: boolean;
  onSelect?: (patient: Patient) => void;
  onExpand?: (patientId: string) => void;
  showActions?: boolean;
  className?: string;
}

/**
 * Componente master para cards de paciente
 * UI idêntica ao print: card alto, respirado, rounded-2xl, border-slate-200, shadow-sm
 * Pin no canto superior direito
 */
export function PatientListItem({
  patient,
  selected = false,
  onSelect,
  showActions = true,
  className = "",
}: PatientListItemProps) {
  const riskPercent = Math.round(patient.riscoMortality24h * 100);
  
  const hasVM = !!patient.ventilationParams;
  const hasVaso = patient.medications.some(
    (m) => m.tipo === "vasopressor" && m.ativo
  );

  const handleCardClick = () => {
    onSelect?.(patient);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
        w-full
        p-5
        bg-white
        border rounded-2xl
        border-slate-200
        shadow-sm
        text-left
        transition-all
        hover:shadow-md hover:border-slate-300
        cursor-pointer
        relative
        ${selected ? "border-emerald-500 shadow-md ring-2 ring-emerald-100" : ""}
        ${className}
      `}
    >
      {/* PIN no canto superior direito */}
      {showActions && (
        <div className="absolute top-4 right-4">
          <PatientPinButton patient={patient} />
        </div>
      )}

      <div className={showActions ? "pr-12" : ""}>
        <div className="space-y-3">
          {/* Linha 1: UTI 01 • Sophia */}
          <div>
            <span className="text-slate-900 font-semibold text-lg">
              {patient.leito} • {patient.nome}
            </span>
          </div>

          {/* Linha 2: Idade • Diagnóstico */}
          <div className="text-sm text-slate-600 leading-relaxed">
            {patient.idade} {patient.idade === 1 ? "ano" : "anos"} • {patient.diagnosticoPrincipal}
          </div>

          {/* Linha 3: Risco 24h */}
          <div className="text-sm text-slate-600">
            Risco 24h: {riskPercent}%
          </div>

          {/* Linha 4: VM e Vasopressor */}
          <div className="text-sm text-slate-600">
            VM: {hasVM ? "Sim" : "Não"} • Vasopressor: {hasVaso ? "Sim" : "Não"}
          </div>
        </div>
      </div>
    </div>
  );
}