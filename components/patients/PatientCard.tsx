"use client";

import type { Patient } from "@/types/Patient";
import { PatientPinButton } from "@/components/PatientPinButton";

interface PatientCardProps {
  patient: Patient;
  showPin?: boolean;
  isPinned?: boolean;
  onTogglePin?: (patientId: string) => void;
  onSelect?: (patientId: string) => void;
  variant?: 'default';
  selected?: boolean;
  className?: string;
}

/**
 * Componente único master para cards de paciente
 * UI idêntica ao print: rounded-2xl, border-slate-200, shadow-sm, bg-white
 * Pin no canto superior direito, texto alinhado à esquerda, boa respiração
 */
export function PatientCard({
  patient,
  showPin = true,
  onSelect,
  selected = false,
  variant = 'default',
  className = "",
}: PatientCardProps) {
  const riskPercent = Math.round(patient.riscoMortality24h * 100);
  
  const hasVM = !!patient.ventilationParams;
  const hasVaso = patient.medications.some(
    (m) => m.tipo === "vasopressor" && m.ativo
  );

  const handleCardClick = () => {
    onSelect?.(patient.id);
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
      {showPin && (
        <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
          <PatientPinButton patient={patient} />
        </div>
      )}

      <div className={showPin ? "pr-12" : ""}>
        <div className="space-y-3">
          {/* Linha 1 (header): UTI XX • Nome */}
          <div>
            <span className="text-slate-900 font-semibold text-lg">
              {patient.leito} • {patient.nome}
            </span>
          </div>

          {/* Linha 2: idade • diagnóstico completo */}
          <div className="text-sm text-slate-600 leading-relaxed">
            {patient.idade} {patient.idade === 1 ? "ano" : "anos"} • {patient.diagnosticoPrincipal}
          </div>

          {/* Linha 3: Risco 24h */}
          <div className="text-sm text-slate-600">
            Risco 24h: {riskPercent}%
          </div>

          {/* Linha 4: VM • Vasopressor */}
          <div className="text-sm text-slate-600">
            VM: {hasVM ? "Sim" : "Não"} • Vasopressor: {hasVaso ? "Sim" : "Não"}
          </div>
        </div>
      </div>
    </div>
  );
}
