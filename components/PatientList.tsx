"use client";

import { getSortedByMortalityRisk24h } from "@/lib/mockData";
import type { Patient } from "@/lib/mockData";
import { PatientCard } from "./patients/PatientCard";
import type { ClinicalAgentId } from "@/lib/clinicalAgents";

interface Props {
  onSelectPatient?: (patient: Patient) => void;
  selectedPatientId?: string | null;
  onExpandPatient?: (patientId: string) => void;
}

export function PatientList({ 
  onSelectPatient, 
  selectedPatientId,
  onExpandPatient
}: Props) {
  const sorted = getSortedByMortalityRisk24h();

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {sorted.map((p) => (
        <PatientCard
          key={p.id}
          patient={p as Patient}
          selected={selectedPatientId === p.id}
          onSelect={(patientId) => {
            const patient = sorted.find(pat => pat.id === patientId);
            if (patient) onSelectPatient?.(patient as Patient);
          }}
          showPin={true}
        />
      ))}
    </div>
  );
}
