"use client";

import type { Patient } from "@/lib/mockData";
import { PatientHeaderCard } from "./ui/PatientHeaderCard";

interface MiniPatientSummaryProps {
  patient: Patient;
  onExpand?: (patientId: string) => void;
}

export function MiniPatientSummary({ 
  patient,
  onExpand 
}: MiniPatientSummaryProps) {
  return (
    <PatientHeaderCard
      patient={patient}
      onExpand={onExpand}
    />
  );
}

