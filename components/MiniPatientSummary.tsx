"use client";

import type { Patient } from "@/lib/mockData";
import { PatientHeaderCard } from "./ui/PatientHeaderCard";
import type { ClinicalAgentId } from "@/lib/clinicalAgents";

interface MiniPatientSummaryProps {
  patient: Patient;
  onRequestOpinion?: (patientId: string, agentId: ClinicalAgentId) => void;
}

export function MiniPatientSummary({ patient, onRequestOpinion }: MiniPatientSummaryProps) {
  return (
    <PatientHeaderCard
      patient={patient}
      onRequestOpinion={onRequestOpinion}
    />
  );
}

