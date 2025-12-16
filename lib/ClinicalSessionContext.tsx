"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Patient } from "@/types";

export interface PatientSummary {
  id: string;
  name: string;
  bedId?: string;
  risk24h?: number;
}

interface ClinicalSessionContextValue {
  pinnedPatients: PatientSummary[];
  togglePinnedPatient: (patient: PatientSummary) => void;
  activePatientId?: string;
  setActivePatient: (patientId: string | undefined) => void;
}

const ClinicalSessionContext = createContext<ClinicalSessionContextValue | undefined>(undefined);

export function ClinicalSessionProvider({ children }: { children: ReactNode }) {
  const [pinnedPatients, setPinnedPatients] = useState<PatientSummary[]>([]);
  const [activePatientId, setActivePatientId] = useState<string | undefined>(undefined);

  const togglePinnedPatient = (patient: PatientSummary) => {
    setPinnedPatients((current) => {
      const exists = current.some((p) => p.id === patient.id);
      if (exists) {
        return current.filter((p) => p.id !== patient.id);
      }
      // Limitar a 6 pacientes fixados
      if (current.length >= 6) {
        return [...current.slice(1), patient];
      }
      return [...current, patient];
    });
  };

  const setActivePatient = (patientId: string | undefined) => {
    setActivePatientId(patientId);
  };

  return (
    <ClinicalSessionContext.Provider
      value={{
        pinnedPatients,
        togglePinnedPatient,
        activePatientId,
        setActivePatient,
      }}
    >
      {children}
    </ClinicalSessionContext.Provider>
  );
}

export function useClinicalSession() {
  const context = useContext(ClinicalSessionContext);
  if (context === undefined) {
    throw new Error("useClinicalSession must be used within a ClinicalSessionProvider");
  }
  return context;
}


