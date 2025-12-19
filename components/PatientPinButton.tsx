"use client";

import { PiPushPinSimpleFill, PiPushPinSimpleLight } from "react-icons/pi";
import { useClinicalSession } from "@/lib/ClinicalSessionContext";
import type { Patient } from "@/types";

interface PatientPinButtonProps {
  patient: Patient;
  className?: string;
}

export function PatientPinButton({ patient, className = "" }: PatientPinButtonProps) {
  const { pinnedPatients, togglePinnedPatient } = useClinicalSession();
  
  const isPinned = pinnedPatients.some((p) => p.id === patient.id);

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que o click propague para o card
    togglePinnedPatient({
      id: patient.id,
      name: patient.nome,
      bedId: patient.leito,
      risk24h: Math.round(patient.riscoMortality24h * 100),
    });
  };

  return (
    <button
      type="button"
      onClick={handleTogglePin}
      className={`patient-pin-button ${isPinned ? "pinned" : ""} ${className}`}
      title={isPinned ? "Remover de Meus pacientes" : "Fixar em Meus pacientes"}
    >
      {isPinned ? (
        <PiPushPinSimpleFill />
      ) : (
        <PiPushPinSimpleLight />
      )}
    </button>
  );
}





