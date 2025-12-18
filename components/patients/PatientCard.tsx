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
  onSendPatientMessage?: (patientId: string, message: string) => void; // Nova prop para enviar mensagem
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
  onSendPatientMessage,
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

  const handleVerPacienteClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[PatientCard] Botão Ver paciente clicado', {
      patientId: patient.id,
      patientName: patient.nome,
      leito: patient.leito,
      hasOnSendPatientMessage: !!onSendPatientMessage,
      hasOnSelect: !!onSelect,
      hasOnSendMessage: !!onSendMessage,
      hasOnSelectPatient: !!onSelectPatient
    });
    
    // Mensagem que garante detecção de intent PACIENTE_ESPECIFICO e mostra overview completo
    const message = `Me dê um overview clínico completo do paciente da UTI ${patient.leito} (${patient.nome}).`;
    
    try {
      // Prioridade 1: usar onSendPatientMessage se fornecido (mais direto)
      if (onSendPatientMessage) {
        console.log('[PatientCard] Usando onSendPatientMessage', { patientId: patient.id, message });
        onSendPatientMessage(patient.id, message);
        return;
      }
      
      // Prioridade 2: usar onSelect customizado se fornecido (ex: HighRiskPreview)
      if (onSelect) {
        console.log('[PatientCard] Usando onSelect', { patientId: patient.id });
        onSelect(patient.id);
        // Mas ainda tentar enviar mensagem se possível
        if (onSendMessage) {
          console.log('[PatientCard] Também enviando mensagem via onSendMessage', { patientId: patient.id, message });
          onSendMessage(message, patient.id);
        }
        return;
      }
      
      // Prioridade 3: usar onSendMessage do contexto Preview
      if (onSendMessage) {
        console.log('[PatientCard] Usando onSendMessage do contexto', { patientId: patient.id, message });
        onSendMessage(message, patient.id);
        onSelectPatient?.(patient.id);
        return;
      }
      
      // Fallback: fazer chamada direta à API se nenhum handler disponível
      console.warn('[PatientCard] Nenhum handler disponível, fazendo chamada direta à API', {
        patientId: patient.id,
        message
      });
      
      // Chamada direta à API como último recurso
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          focusedPatientId: patient.id,
          patientId: patient.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem');
      }
      
      console.log('[PatientCard] Mensagem enviada diretamente à API com sucesso');
    } catch (error) {
      console.error('[PatientCard] Erro ao enviar mensagem:', error);
    }
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
      onClick={(e) => {
        // Prevenir que cliques no card inteiro disparem ações indesejadas
        // Apenas permitir cliques diretos no botão
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('button')) {
          return;
        }
        e.stopPropagation();
      }}
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
          type="button"
          onClick={handleVerPacienteClick}
          onMouseDown={(e) => {
            console.log('[PatientCard] Botão mouseDown', { patientId: patient.id });
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            console.log('[PatientCard] Botão mouseUp', { patientId: patient.id });
            e.stopPropagation();
          }}
          className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors text-sm cursor-pointer relative z-10"
          style={{ pointerEvents: 'auto' }}
        >
          Ver paciente
        </button>
      </div>
    </div>
  );
}
