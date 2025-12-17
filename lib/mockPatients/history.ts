import type { MockPatientHistory, TimeSeries, TimelineEvent } from "@/types/MockPatientHistory";

/**
 * Gera série temporal determinística baseada no patientId
 */
function generateTimeSeries24h(
  patientId: string,
  key: string,
  currentValue: number,
  unit: string,
  trend: 'up' | 'down' | 'stable' = 'stable'
): TimeSeries {
  // Hash simples baseado no patientId para determinismo
  const hash = patientId.charCodeAt(patientId.length - 1);
  const variation = (hash % 20) / 100; // 0-20% de variação
  
  const points = [
    { t: "-24h", v: 0 },
    { t: "-18h", v: 0 },
    { t: "-12h", v: 0 },
    { t: "-6h", v: 0 },
    { t: "-3h", v: 0 },
    { t: "agora", v: currentValue }
  ];
  
  // Preencher valores intermediários com tendência
  for (let i = 0; i < points.length - 1; i++) {
    const progress = i / (points.length - 1);
    let value = currentValue;
    
    if (trend === 'up') {
      value = currentValue * (1 - (1 - progress) * (0.15 + variation));
    } else if (trend === 'down') {
      value = currentValue * (1 + (1 - progress) * (0.15 + variation));
    } else {
      value = currentValue * (0.95 + variation + Math.random() * 0.1);
    }
    
    points[i].v = Math.round(value * 10) / 10;
  }
  
  return { key, unit, points };
}

/**
 * Gera série temporal de 72h para laboratórios
 */
function generateTimeSeries72h(
  patientId: string,
  key: string,
  currentValue: number,
  unit: string,
  trend: 'up' | 'down' | 'stable' = 'stable'
): TimeSeries {
  const hash = patientId.charCodeAt(patientId.length - 1);
  const variation = (hash % 20) / 100;
  
  const points = [
    { t: "-72h", v: 0 },
    { t: "-48h", v: 0 },
    { t: "-24h", v: 0 },
    { t: "-12h", v: 0 },
    { t: "-6h", v: 0 },
    { t: "agora", v: currentValue }
  ];
  
  for (let i = 0; i < points.length - 1; i++) {
    const progress = i / (points.length - 1);
    let value = currentValue;
    
    if (trend === 'up') {
      value = currentValue * (1 - (1 - progress) * (0.25 + variation));
    } else if (trend === 'down') {
      value = currentValue * (1 + (1 - progress) * (0.25 + variation));
    } else {
      value = currentValue * (0.9 + variation + Math.random() * 0.15);
    }
    
    points[i].v = Math.round(value * 10) / 10;
  }
  
  return { key, unit, points };
}

/**
 * Gera timeline de eventos determinística
 */
function generateTimelineEvents(patientId: string, snapshot: any): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const baseTime = new Date(snapshot.ultimaAtualizacao);
  
  // Evento de admissão
  const admissionDaysAgo = snapshot.diasDeUTI;
  events.push({
    id: `${patientId}-admission`,
    type: 'admission',
    title: 'Admissão na UTI',
    description: `Paciente admitido com ${snapshot.diagnosticoPrincipal.substring(0, 60)}`,
    timestamp: new Date(baseTime.getTime() - admissionDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
    severity: 'normal'
  });
  
  // Eventos de terapia (medicações)
  snapshot.medications?.forEach((med: any, idx: number) => {
    if (med.ativo) {
      const daysAgo = med.diasDeUso || 1;
      events.push({
        id: `${patientId}-therapy-${med.id}`,
        type: 'therapy',
        title: `Início de ${med.nome}`,
        description: `${med.dose} ${med.unidade} | D${daysAgo}`,
        timestamp: new Date(baseTime.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        severity: med.tipo === 'vasopressor' ? 'critical' : 'warning',
        medicationId: med.id,
        medicationName: med.nome
      });
    }
  });
  
  // Eventos de laboratório
  snapshot.labResults?.forEach((lab: any, idx: number) => {
    if (lab.critico) {
      events.push({
        id: `${patientId}-lab-${lab.id}`,
        type: 'lab',
        title: `${lab.nome} alterado`,
        description: `${lab.valor} ${lab.unidade} ${lab.tendencia === 'subindo' ? '(↑)' : lab.tendencia === 'caindo' ? '(↓)' : ''}`,
        timestamp: lab.data || baseTime.toISOString(),
        severity: 'critical',
        labResultId: lab.id,
        labResultType: lab.tipo
      });
    }
  });
  
  // Eventos de imagem (determinístico baseado no diagnóstico)
  if (snapshot.diagnosticoPrincipal.toLowerCase().includes('pneumonia') || 
      snapshot.diagnosticoPrincipal.toLowerCase().includes('bronquiolite')) {
    events.push({
      id: `${patientId}-imaging-1`,
      type: 'imaging',
      title: 'Radiografia de Tórax',
      description: 'RX tórax realizado para avaliação pulmonar',
      timestamp: new Date(baseTime.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      severity: 'warning',
      examId: `${patientId}-rx-1`,
      examType: 'chest-xray'
    });
  }
  
  if (snapshot.diagnosticoPrincipal.toLowerCase().includes('trauma') ||
      snapshot.diagnosticoPrincipal.toLowerCase().includes('encefalopatia')) {
    events.push({
      id: `${patientId}-imaging-2`,
      type: 'imaging',
      title: 'Tomografia de Crânio',
      description: 'TC crânio realizada para avaliação neurológica',
      timestamp: new Date(baseTime.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      severity: 'critical',
      examId: `${patientId}-tc-1`,
      examType: 'head-ct'
    });
  }
  
  // Ordenar por timestamp (mais recente primeiro)
  return events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 12); // Máximo 12 eventos
}

/**
 * Histórico completo de todos os pacientes
 * Map: { [patientId]: MockPatientHistory }
 */
export const patientsHistory: Record<string, MockPatientHistory> = {};

// Inicializar históricos para cada paciente (será preenchido dinamicamente)
import { patientsSnapshots } from "./snapshots";

Object.keys(patientsSnapshots).forEach(patientId => {
  const snapshot = patientsSnapshots[patientId];
  
  // Séries de 24h (vitais e suporte)
  const series_24h: TimeSeries[] = [
    generateTimeSeries24h(patientId, 'fc', snapshot.vitalSigns.frequenciaCardiaca, 'bpm', 
      snapshot.vitalSigns.frequenciaCardiaca > 150 ? 'up' : 'stable'),
    generateTimeSeries24h(patientId, 'fr', snapshot.vitalSigns.frequenciaRespiratoria, 'irpm', 'stable'),
    generateTimeSeries24h(patientId, 'pam', snapshot.vitalSigns.pressaoArterialMedia, 'mmHg',
      snapshot.vitalSigns.pressaoArterialMedia < 55 ? 'down' : 'stable'),
    generateTimeSeries24h(patientId, 'spo2', snapshot.vitalSigns.saturacaoO2, '%',
      snapshot.vitalSigns.saturacaoO2 < 92 ? 'down' : 'stable')
  ];
  
  if (snapshot.ventilationParams) {
    series_24h.push(
      generateTimeSeries24h(patientId, 'fio2', snapshot.ventilationParams.fiO2, '%', 'stable'),
      generateTimeSeries24h(patientId, 'peep', snapshot.ventilationParams.peep, 'cmH2O', 'stable')
    );
  }
  
  // Séries de 72h (laboratórios)
  const series_72h: TimeSeries[] = [];
  
  const lactato = snapshot.labResults.find(l => l.tipo === 'lactato');
  if (lactato && typeof lactato.valor === 'number') {
    series_72h.push(
      generateTimeSeries72h(patientId, 'lactato', lactato.valor, lactato.unidade || 'mmol/L',
        lactato.tendencia === 'subindo' ? 'up' : lactato.tendencia === 'caindo' ? 'down' : 'stable')
    );
  }
  
  const pcr = snapshot.labResults.find(l => l.tipo === 'pcr');
  if (pcr && typeof pcr.valor === 'number') {
    series_72h.push(
      generateTimeSeries72h(patientId, 'pcr', pcr.valor, pcr.unidade || 'mg/L',
        pcr.tendencia === 'subindo' ? 'up' : pcr.tendencia === 'caindo' ? 'down' : 'stable')
    );
  }
  
  const creatinina = snapshot.labResults.find(l => l.tipo === 'funcao_renal' || l.nome.toLowerCase().includes('creatinina'));
  if (creatinina && typeof creatinina.valor === 'number') {
    series_72h.push(
      generateTimeSeries72h(patientId, 'creatinina', creatinina.valor, creatinina.unidade || 'mg/dL', 'stable')
    );
  }
  
  // Timeline de eventos
  const timelineEvents = generateTimelineEvents(patientId, snapshot);
  
  patientsHistory[patientId] = {
    patientId,
    series_24h,
    series_72h,
    timelineEvents,
    lastUpdated: snapshot.ultimaAtualizacao
  };
});

/**
 * Helper para buscar histórico por ID
 */
export function getPatientHistoryById(id: string): MockPatientHistory | undefined {
  return patientsHistory[id];
}

