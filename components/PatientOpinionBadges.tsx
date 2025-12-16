"use client";

import { useClinicalSession, type PatientOpinion } from "@/lib/ClinicalSessionContext";
import { clinicalAgents } from "@/lib/clinicalAgents";
import type { ClinicalAgentId } from "@/lib/clinicalAgents";

interface PatientOpinionBadgesProps {
  patientId: string;
  maxVisible?: number;
}

export function PatientOpinionBadges({ patientId, maxVisible = 2 }: PatientOpinionBadgesProps) {
  const { opinionsByPatientId } = useClinicalSession();
  const opinions = opinionsByPatientId[patientId] || [];

  if (opinions.length === 0) {
    return null;
  }

  const visible = opinions.slice(0, maxVisible);
  const remaining = opinions.length - maxVisible;

  const getAgentLabel = (agentId: ClinicalAgentId): string => {
    const agent = clinicalAgents[agentId];
    if (!agent) return agentId;
    // Retornar nome curto para badge
    return 'Plantonista';
  };

  return (
    <div className="patient-opinion-badges">
      {visible.map((opinion, idx) => (
        <span key={idx} className="patient-opinion-badge" title={`Parecer de ${clinicalAgents[opinion.agentId]?.name || opinion.agentId}`}>
          Parecer: {getAgentLabel(opinion.agentId)}
        </span>
      ))}
      {remaining > 0 && (
        <span className="patient-opinion-badge patient-opinion-badge-more">
          +{remaining}
        </span>
      )}
    </div>
  );
}


