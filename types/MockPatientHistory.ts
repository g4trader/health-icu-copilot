/**
 * Série temporal de um ponto de dados
 */
export interface TimeSeriesPoint {
  t: string; // "-72h", "-48h", "-24h", "-12h", "-6h", "-3h", "agora"
  v: number;
}

/**
 * Série temporal completa
 */
export interface TimeSeries {
  key: string; // 'fc', 'fr', 'pam', 'spo2', 'fio2', 'peep', 'lactato', 'pcr', etc.
  unit: string; // 'bpm', 'irpm', 'mmHg', '%', 'cmH2O', 'mmol/L', 'mg/L', etc.
  points: TimeSeriesPoint[];
}

/**
 * Evento da timeline clínica
 */
export type TimelineEventType = 'admission' | 'therapy' | 'lab' | 'imaging' | 'note';

export type TimelineEventSeverity = 'normal' | 'warning' | 'critical';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string; // max 90 chars
  timestamp: string; // ISO string (relativo mock)
  severity: TimelineEventSeverity;
  
  // Para imaging events
  examId?: string;
  examType?: 'chest-xray' | 'head-ct' | 'chest-ct' | 'abdominal-ct' | 'echo';
  
  // Para therapy events
  medicationId?: string;
  medicationName?: string;
  
  // Para lab events
  labResultId?: string;
  labResultType?: string;
  
  // Para eventos de imagem (compatibilidade com componentes existentes)
  relatedExamId?: string;
}

/**
 * Histórico completo do paciente (24-72h)
 * Usado para gráficos, timeline e análises temporais
 */
export interface MockPatientHistory {
  patientId: string;
  
  // Séries temporais de 24h (vitais e suporte)
  series_24h: TimeSeries[]; // FC, FR, PAM, SpO2, FiO2, PEEP
  
  // Séries temporais de 72h (laboratórios)
  series_72h: TimeSeries[]; // Lactato, PCR, Creatinina, Hb
  
  // Timeline de eventos clínicos
  timelineEvents: TimelineEvent[];
  
  // Evolução de 30 dias (opcional, carregada sob demanda)
  dailyEvolution?: import("@/types/DailyPatientStatus").DailyPatientStatus[];
  
  // Timestamp da última atualização
  lastUpdated: string; // ISO string
}

