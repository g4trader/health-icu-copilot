import type { Patient } from './Patient';

export type ExamType = 'chest-xray' | 'head-ct' | 'chest-ct' | 'abdominal-ct' | 'ecg';

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

