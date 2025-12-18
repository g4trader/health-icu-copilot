"use client";

import type { Patient } from "@/types/Patient";
import { PatientPinButton } from "@/components/PatientPinButton";
import { usePreview } from "@/components/PreviewProvider";

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
  const { onSendMessage, onSelectPatient } = usePreview();
  
  const hasVM = !!patient.ventilationParams;
  const hasVaso = patient.medications.some(
    (m) => m.tipo === "vasopressor" && m.ativo
  );

  const handleCardClick = () => {
    // Se houver onSelect customizado, usar ele (ex: HighRiskPreview)
    if (onSelect) {
      onSelect(patient.id);
      return;
    }
    
    // Caso contrário, usar comportamento padrão: enviar mensagem no chat
    const message = `Me dê um resumo do paciente da UTI ${patient.leito}`;
    onSendMessage?.(message, patient.id);
    onSelectPatient?.(patient.id);
  };

  return (
    <div
      className={`
        detail-card
        w-full
        text-left
        relative
        ${selected ? "border-emerald-500 shadow-md ring-2 ring-emerald-100" : ""}
        ${className}
      `}
    >
      {/* Header row: UTI • Nome + PIN */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[17px] md:text-[18px] font-semibold text-slate-900 leading-tight tracking-[-0.01em] flex-1">
          {patient.leito} • {patient.nome}
        </h3>
        {showPin && (
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            <PatientPinButton patient={patient} />
          </div>
        )}
      </div>

      {/* Body content: 3 linhas abaixo */}
      <div className="mt-2 space-y-1.5">
        {/* Linha 2: idade • diagnóstico completo */}
        <p className="text-[14px] md:text-[15px] text-slate-600 leading-snug">
          {patient.idade} {patient.idade === 1 ? "ano" : "anos"} • {patient.diagnosticoPrincipal}
        </p>

        {/* Linha 3: Risco 24h */}
        <p className="text-[14px] md:text-[15px] text-slate-700 leading-snug">
          Risco 24h: <span className="font-semibold text-slate-900">{riskPercent}%</span>
        </p>

        {/* Linha 4: VM • Vasopressor */}
        <p className="text-[14px] md:text-[15px] text-slate-600 leading-snug">
          VM: {hasVM ? "Sim" : "Não"} <span className="text-slate-400">•</span> Vasopressor: {hasVaso ? "Sim" : "Não"}
        </p>
      </div>

      {/* Botão Ver paciente */}
      <div className="mt-3 pt-3 border-t border-slate-200">
        <button
          onClick={handleCardClick}
          className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors text-sm"
        >
          Ver paciente
        </button>
      </div>
    </div>
  );
}
