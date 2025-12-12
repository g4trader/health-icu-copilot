"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type PreviewType = 
  | 'icu-overview' 
  | 'ventilated' 
  | 'vasopressors' 
  | 'high-risk' 
  | 'patient' 
  | 'lab-results'
  | 'unit-profile'
  | null;

export interface PreviewPayload {
  [key: string]: any;
}

interface PreviewContextType {
  previewType: PreviewType;
  previewPayload: PreviewPayload | null;
  setPreview: (type: PreviewType, payload?: PreviewPayload) => void;
  clearPreview: () => void;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [previewType, setPreviewType] = useState<PreviewType>(null);
  const [previewPayload, setPreviewPayload] = useState<PreviewPayload | null>(null);

  const setPreview = (type: PreviewType, payload?: PreviewPayload) => {
    setPreviewType(type);
    setPreviewPayload(payload || null);
  };

  const clearPreview = () => {
    setPreviewType(null);
    setPreviewPayload(null);
  };

  return (
    <PreviewContext.Provider value={{ previewType, previewPayload, setPreview, clearPreview }}>
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

