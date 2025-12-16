"use client";

import { getSortedByMortalityRisk24h } from "@/lib/mockData";
import type { Patient } from "@/lib/mockData";
import { PatientListItem } from "./ui/PatientListItem";
import type { ClinicalAgentId } from "@/lib/clinicalAgents";

interface Props {
  onSelectPatient?: (patient: Patient) => void;
  selectedPatientId?: string | null;
  onRequestOpinion?: (patientId: string, agentId: ClinicalAgentId) => void;
}

export function PatientList({ 
  onSelectPatient, 
  selectedPatientId,
  onRequestOpinion 
}: Props) {
  const sorted = getSortedByMortalityRisk24h();

  return (
    <div className="space-y-3">
      {sorted.map((p) => (
        <PatientListItem
          key={p.id}
          patient={p as Patient}
          selected={selectedPatientId === p.id}
          onSelect={(patient) => onSelectPatient?.(patient as Patient)}
          onRequestOpinion={onRequestOpinion}
          showActions={true}
        />
      ))}
    </div>
  );
}
