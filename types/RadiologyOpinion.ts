import type { Patient } from './Patient';

export type ExamType = 'chest-xray' | 'head-ct' | 'chest-ct' | 'abdominal-ct' | 'echo';

// Resumo para exibir no chat
export interface RadiologyReportSummary {
  examType: ExamType;
  examTypeLabel: string;
  dateMock: string;
  keyFindings: string[]; // Máximo 3
  impressionShort: string; // 1-2 linhas
  correlationShort: string; // 1-2 linhas
  patientId: string;
  patientName: string;
  patientBed: string;
  timestamp: string;
}

// Laudo completo para exibir no preview
export interface RadiologyReportFull {
  examType: ExamType;
  examTypeLabel: string;
  dateMock: string;
  technique: string;
  findings: string[]; // Todos os achados
  impression: string; // Impressão diagnóstica completa
  correlation: string; // Correlação clínica completa
  suggestions: string[]; // Apenas exames de imagem (RX/US/TC/RM/ECO)
  disclaimer: string;
  patientId: string;
  patientName: string;
  patientBed: string;
  timestamp: string;
}

// Tipo combinado para resposta do backend
export interface RadiologyReport {
  summary: RadiologyReportSummary;
  full: RadiologyReportFull;
}

// Mantido para compatibilidade (deprecated, usar RadiologyReport)
export interface RadiologyOpinion {
  examType: ExamType;
  examTypeLabel: string;
  patientId: string;
  patientName: string;
  patientBed: string;
  findings: string[];
  diagnosticImpression: string;
  clinicalCorrelation: string;
  suggestions: string[];
  timestamp: string;
}


