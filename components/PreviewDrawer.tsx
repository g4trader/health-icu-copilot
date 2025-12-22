"use client";

import { usePreview, type PreviewPayload } from "./PreviewProvider";
import { mockPatients, getTopPatients, riskLevelFromScore } from "@/lib/mockData";
import { getPatientsOnVentilation, getPatientsOnVasopressors, getHighRiskPatients, getHighRiskPatientsList } from "@/lib/icuSummary";
import type { Patient } from "@/lib/mockData";
import { PatientDetailPanel } from "./PatientDetailPanel";
import { PatientPinButton } from "./PatientPinButton";
import { PatientCard } from "./patients/PatientCard";
import { useClinicalSession } from "@/lib/ClinicalSessionContext";
import { RadiologyReportDetails } from "./ui/RadiologyReportDetails";

// Helper para obter paciente de qualquer preview
function getPatientFromPreview(previewType: string | null, payload: PreviewPayload | null): Patient | null {
  if (!previewType || !payload) return null;

  // Preview direto de paciente
  if (previewType === 'patient' && payload.patient) {
    return payload.patient as Patient;
  }

  // Radiology report tem patientId - SEMPRE mostrar header do paciente
  if (previewType === 'radiology-report' && payload.report) {
    const report = payload.report as any;
    if (report.patientId) {
      const patient = mockPatients.find(p => p.id === report.patientId);
      if (patient) return patient;
    }
  }

  // Para listas de pacientes, não há paciente específico
  // Retornar null para esses casos - eles usam ListDrawerHeader
  return null;
}

function PatientDrawerHeader({ patient }: { patient: Patient }) {
  const { clearPreview } = usePreview();
  const risk24h = Math.round(patient.riscoMortality24h * 100);
  const riskLevel = riskLevelFromScore(patient.riscoMortality24h);
  
  const getRiskBadgeColor = () => {
    if (riskLevel === "alto") return "bg-rose-50 text-rose-700 border-rose-200";
    if (riskLevel === "moderado") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="drawer-header-patient">
      <div className="drawer-header-patient-info">
        <div className="drawer-header-patient-main">
          <span className="drawer-header-patient-bed">{patient.leito}</span>
          <h3 className="drawer-header-patient-name">{patient.nome}</h3>
        </div>
        <div className="drawer-header-patient-badges">
          <span className={`drawer-header-risk-badge ${getRiskBadgeColor()}`}>
            Risco 24h: {risk24h}%
          </span>
        </div>
      </div>
      <div className="drawer-header-patient-actions">
        <PatientPinButton patient={patient} />
        <button
          type="button"
          className="drawer-close-btn"
          onClick={clearPreview}
          aria-label="Fechar preview"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="drawer-close-icon"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ListDrawerHeader({ title }: { title: string }) {
  const { clearPreview } = usePreview();

  return (
    <>
      <h3 className="drawer-title">{title}</h3>
      <button
        type="button"
        className="drawer-close-btn"
        onClick={clearPreview}
        aria-label="Fechar preview"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="drawer-close-icon"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </>
  );
}

export function PreviewDrawer() {
  const { previewType, previewPayload, clearPreview } = usePreview();

  if (!previewType) {
    return null;
  }

  // Obter paciente se disponível
  const patient = getPatientFromPreview(previewType, previewPayload);
  
  // Se for preview de paciente, buscar sempre do array mockPatients para ter versão mais recente
  const currentPatient = previewType === 'patient' && previewPayload?.patient 
    ? (() => {
        const patientId = (previewPayload.patient as Patient).id;
        const latestPatient = mockPatients.find(p => p.id === patientId);
        return latestPatient || (previewPayload.patient as Patient);
      })()
    : patient;

  return (
    <>
      <div className="drawer-overlay" onClick={clearPreview} />
      <aside className="preview-drawer">
        <div className="drawer-header">
          {currentPatient ? (
            <PatientDrawerHeader patient={currentPatient} />
          ) : (
            <ListDrawerHeader 
              title={
                previewType === 'icu-overview' ? 'Visão Geral da UTI' :
                previewType === 'allPatients' ? 'Todos os Pacientes da UTI' :
                previewType === 'ventilated' ? 'Pacientes em Ventilação Mecânica' :
                previewType === 'vasopressors' ? 'Pacientes em Droga Vasoativa' :
                previewType === 'high-risk' ? 'Pacientes em Alto Risco (24h)' :
                previewType === 'lab-results' ? 'Exames Laboratoriais Recentes' :
                previewType === 'unit-profile' ? 'Perfil Epidemiológico da Unidade' :
                previewType === 'radiology-report' ? 'Laudo Radiológico' :
                'Preview'
              }
            />
          )}
        </div>
        <div className="drawer-body" style={{ padding: 0 }}>
          {previewType === 'allPatients' && <AllPatientsPreview payload={previewPayload} />}
          {previewType === 'ventilated' && <VentilatedPreview />}
          {previewType === 'vasopressors' && <VasopressorsPreview />}
          {previewType === 'high-risk' && <HighRiskPreview />}
          {previewType === 'patient' && currentPatient && (() => {
            const summaryKey = currentPatient.voiceNoteSummary 
              ? currentPatient.voiceNoteSummary.substring(0, 30).replace(/\s/g, '-') 
              : 'default';
            return (
              <PatientDetailPanel 
                key={`patient-detail-${currentPatient.id}-${summaryKey}-${Date.now()}`}
                patient={currentPatient} 
              />
            );
          })()}
          {previewType === 'radiology-report' && previewPayload?.report && (
            <div className="px-4 pb-6 pt-4">
              <div className="patient-detail-refined">
                <RadiologyReportDetails report={previewPayload.report as import("@/types/RadiologyOpinion").RadiologyReportFull} />
              </div>
            </div>
          )}
          {previewType === 'icu-overview' && <IcuOverviewPreview />}
        </div>
      </aside>
    </>
  );
}

function IcuOverviewPreview() {
  const totalPatients = mockPatients.length;
  const onVentilation = getPatientsOnVentilation();
  const onVasopressors = getPatientsOnVasopressors();
  const highRisk = getHighRiskPatients();

  return (
    <div className="patient-detail-refined">
      <div className="preview-stats">
        <div className="preview-stat">
          <div className="preview-stat-label">Total de Pacientes</div>
          <div className="preview-stat-value">{totalPatients}</div>
        </div>
        <div className="preview-stat">
          <div className="preview-stat-label">Em Ventilação Mecânica</div>
          <div className="preview-stat-value">{onVentilation}</div>
        </div>
        <div className="preview-stat">
          <div className="preview-stat-label">Em Droga Vasoativa</div>
          <div className="preview-stat-value">{onVasopressors}</div>
        </div>
        <div className="preview-stat">
          <div className="preview-stat-label">Alto Risco (24h)</div>
          <div className="preview-stat-value preview-stat-highlight">{highRisk}</div>
        </div>
      </div>
    </div>
  );
}

function AllPatientsPreview({ payload }: { payload: PreviewPayload | null }) {
  const patients = (payload?.patients || mockPatients) as Patient[];
  const { onSelectPatient, onSendMessage } = usePreview();

  const handleCardClick = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    const message = patient 
      ? `Me dê um overview clínico completo do paciente da UTI ${patient.leito} (${patient.nome}).`
      : `Me dê um overview clínico completo do paciente ${patientId}.`;
    
    if (onSendMessage) {
      onSendMessage(message, patientId);
    } else {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, focusedPatientId: patientId, patientId })
        });
        if (response.ok) {
          const data = await response.json();
          console.log('[AllPatientsPreview] Mensagem enviada diretamente à API');
          window.dispatchEvent(new CustomEvent('chatMessageSent', {
            detail: { message, response: data, patientId }
          }));
        }
      } catch (error) {
        console.error('[AllPatientsPreview] Erro ao enviar mensagem:', error);
      }
    }
    // Verificar se patientId é válido antes de chamar onSelectPatient
    if (patientId && onSelectPatient) {
      onSelectPatient(patientId);
    } else if (!patientId) {
      console.warn('[AllPatientsPreview] patientId não válido, não chamando onSelectPatient');
    }
  };

  return (
    <div className="patient-detail-refined">
      {patients.map((p) => (
        <PatientCard
          key={p.id}
          patient={p}
          showPin={true}
          onSelect={handleCardClick}
        />
      ))}
    </div>
  );
}

function VentilatedPreview() {
  const ventilated = mockPatients.filter(p => p.ventilationParams !== undefined);
  const { onSelectPatient, onSendMessage } = usePreview();

  const handleCardClick = async (patientId: string) => {
    const patient = ventilated.find(p => p.id === patientId);
    const message = patient 
      ? `Me dê um overview clínico completo do paciente da UTI ${patient.leito} (${patient.nome}).`
      : `Me dê um overview clínico completo do paciente ${patientId}.`;
    
    if (onSendMessage) {
      onSendMessage(message, patientId);
    } else {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, focusedPatientId: patientId, patientId })
        });
        if (response.ok) {
          const data = await response.json();
          console.log('[VentilatedPreview] Mensagem enviada diretamente à API');
          window.dispatchEvent(new CustomEvent('chatMessageSent', {
            detail: { message, response: data, patientId }
          }));
        }
      } catch (error) {
        console.error('[VentilatedPreview] Erro ao enviar mensagem:', error);
      }
    }
    // Verificar se patientId é válido antes de chamar onSelectPatient
    if (patientId && onSelectPatient) {
      onSelectPatient(patientId);
    } else if (!patientId) {
      console.warn('[VentilatedPreview] patientId não válido, não chamando onSelectPatient');
    }
  };

  return (
    <div className="patient-detail-refined">
      {ventilated.map((p) => (
        <PatientCard
          key={p.id}
          patient={p}
          showPin={true}
          onSelect={handleCardClick}
        />
      ))}
    </div>
  );
}

function VasopressorsPreview() {
  const onVaso = mockPatients.filter(p => 
    p.medications.some(m => m.tipo === "vasopressor" && m.ativo)
  );
  const { onSelectPatient, onSendMessage } = usePreview();

  const handleCardClick = async (patientId: string) => {
    const patient = onVaso.find(p => p.id === patientId);
    const message = patient 
      ? `Me dê um overview clínico completo do paciente da UTI ${patient.leito} (${patient.nome}).`
      : `Me dê um overview clínico completo do paciente ${patientId}.`;
    
    if (onSendMessage) {
      onSendMessage(message, patientId);
    } else {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, focusedPatientId: patientId, patientId })
        });
        if (response.ok) {
          const data = await response.json();
          console.log('[VasopressorsPreview] Mensagem enviada diretamente à API');
          window.dispatchEvent(new CustomEvent('chatMessageSent', {
            detail: { message, response: data, patientId }
          }));
        }
      } catch (error) {
        console.error('[VasopressorsPreview] Erro ao enviar mensagem:', error);
      }
    }
    // Verificar se patientId é válido antes de chamar onSelectPatient
    if (patientId && onSelectPatient) {
      onSelectPatient(patientId);
    } else if (!patientId) {
      console.warn('[VasopressorsPreview] patientId não válido, não chamando onSelectPatient');
    }
  };

  return (
    <div className="patient-detail-refined">
      {onVaso.map((p) => (
        <PatientCard
          key={p.id}
          patient={p}
          showPin={true}
          onSelect={handleCardClick}
        />
      ))}
    </div>
  );
}

function HighRiskPreview() {
  // Usar mesma função de lib/icuSummary.ts para garantir consistência entre card e lista
  const highRisk = getHighRiskPatientsList();
  const { onSelectPatient, onSendMessage } = usePreview();

  const handleCardClick = async (patientId: string) => {
    console.log('[HighRiskPreview] handleCardClick chamado', { patientId, hasOnSendMessage: !!onSendMessage, hasOnSelectPatient: !!onSelectPatient });
    const patient = highRisk.find(p => p.id === patientId);
    if (!patient) {
      console.error('[HighRiskPreview] Paciente não encontrado', { patientId });
      return;
    }
    
    // Enviar mensagem no chat: "Me dê um overview clínico completo do paciente da UTI [número do leito]"
    const message = `Me dê um overview clínico completo do paciente da UTI ${patient.leito} (${patient.nome}).`;
    console.log('[HighRiskPreview] Tentando enviar mensagem', { message, patientId, hasOnSendMessage: !!onSendMessage });
    
    // Tentar enviar mensagem primeiro
    if (onSendMessage) {
      console.log('[HighRiskPreview] Chamando onSendMessage', { message, patientId });
      onSendMessage(message, patientId);
    } else {
      // Fallback: fazer chamada direta à API
      console.warn('[HighRiskPreview] onSendMessage não disponível - usando fallback direto à API', { message, patientId });
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            focusedPatientId: patientId,
            patientId: patientId
          })
        });
        
        if (!response.ok) {
          throw new Error('Falha ao enviar mensagem');
        }
        
        const data = await response.json();
        console.log('[HighRiskPreview] Mensagem enviada diretamente à API com sucesso');
        
        // Disparar evento customizado para atualizar o chat
        window.dispatchEvent(new CustomEvent('chatMessageSent', {
          detail: {
            message,
            response: data,
            patientId
          }
        }));
      } catch (error) {
        console.error('[HighRiskPreview] Erro ao enviar mensagem diretamente:', error);
      }
    }
    
    // Depois selecionar paciente (se disponível e se patientId válido)
    if (onSelectPatient && patientId) {
      console.log('[HighRiskPreview] Chamando onSelectPatient', { patientId });
      onSelectPatient(patientId);
    } else if (!patientId) {
      console.warn('[HighRiskPreview] patientId não válido, não chamando onSelectPatient');
    } else {
      console.warn('[HighRiskPreview] onSelectPatient não disponível');
    }
  };

  return (
    <div className="patient-detail-refined">
      {highRisk.map((p) => (
        <PatientCard
          key={p.id}
          patient={p}
          showPin={true}
          onSelect={handleCardClick}
        />
      ))}
    </div>
  );
}