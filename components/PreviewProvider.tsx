"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type PreviewType = 
  | 'patient'
  | 'lab-results'
  | 'icu-overview'
  | 'ventilated'
  | 'vasopressors'
  | 'high-risk'
  | 'unit-profile'
  | 'allPatients'
  | 'radiology-report'
  | null;

export interface PreviewPayload {
  [key: string]: any;
}

interface PreviewContextType {
  previewType: PreviewType;
  previewPayload: PreviewPayload | null;
  setPreview: (type: PreviewType, payload?: PreviewPayload) => void;
  clearPreview: () => void;
  onSelectPatient?: (patientId: string) => void;
  setOnSelectPatient: (handler: ((patientId: string) => void) | undefined) => void;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [previewType, setPreviewType] = useState<PreviewType>(null);
  const [previewPayload, setPreviewPayload] = useState<PreviewPayload | null>(null);
  const [onSelectPatient, setOnSelectPatient] = useState<((patientId: string) => void) | undefined>(undefined);

  const setPreview = (type: PreviewType, payload?: PreviewPayload) => {
    setPreviewType(type);
    setPreviewPayload(payload || null);
  };

  const clearPreview = () => {
    setPreviewType(null);
    setPreviewPayload(null);
  };

  return (
    <PreviewContext.Provider value={{ previewType, previewPayload, setPreview, clearPreview, onSelectPatient, setOnSelectPatient }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error("usePreview must be used within a PreviewProvider");
  }
  return context;
}

