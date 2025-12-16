import type { Patient } from './Patient';
import type { ClinicalAgentId } from '@/lib/clinicalAgents';

export interface SpecialistOpinionDashboards {
  vitals: {
    map: number;
    hr: number;
    rr: number;
    spo2: number;
    temperature: number;
  };
  labs: {
    lactate?: {
      value: number;
      unit: string;
      trend: 'up' | 'down' | 'stable';
      previousValue?: number;
    };
    pcr?: {
      value: number;
      unit: string;
      trend: 'up' | 'down' | 'stable';
      previousValue?: number;
    };
  };
  therapies: {
    ventilation: boolean;
    vasopressor: boolean;
    antibiotics: string[];
  };
  alerts: string[];
}

export interface SpecialistOpinion {
  agentId: ClinicalAgentId;
  agentName: string;
  agentEmoji: string;
  patientId: string;
  patientName: string;
  patientBed: string;
  title: string;
  summary: string;
  risks: string[];
  suggestedOrders: string[];
  suggestedTherapies: string[];
  dashboards: SpecialistOpinionDashboards;
  timestamp: string;
}

