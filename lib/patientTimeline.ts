export type TimelineEventType =
  | 'admission'
  | 'vitals'
  | 'lab'
  | 'imaging'
  | 'therapy'
  | 'note';

export interface TimelineEvent {
  id: string;
  patientId: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: Date;
  severity?: 'normal' | 'warning' | 'critical';
  relatedExamId?: string; // Para linkar com Radiologista Virtual
}

/**
 * Gera timeline clínica determinística para um paciente
 * Mesmo paciente sempre retorna os mesmos eventos
 */
export function getPatientTimeline(patientId: string): TimelineEvent[] {
  // Seed determinístico baseado no patientId
  const seed = patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Data base (hoje)
  const now = new Date();
  
  // Gerar eventos baseados no seed (determinístico)
  const events: TimelineEvent[] = [];
  
  // Admissão na UTI (há X dias, baseado no seed)
  const daysAgo = (seed % 10) + 1; // 1-10 dias atrás
  const admissionDate = new Date(now);
  admissionDate.setDate(admissionDate.getDate() - daysAgo);
  admissionDate.setHours(8, 0, 0, 0);
  
  events.push({
    id: `${patientId}-admission`,
    patientId,
    type: 'admission',
    title: 'Admissão na UTI',
    description: 'Paciente admitido na unidade de terapia intensiva',
    timestamp: admissionDate,
    severity: 'normal',
  });
  
  // Eventos baseados no tipo de paciente (simulado via seed)
  const patientType = seed % 3; // 0, 1 ou 2
  
  if (patientType === 0) {
    // Paciente respiratório (bronquiolite, pneumonia)
    const vmDate = new Date(admissionDate);
    vmDate.setHours(vmDate.getHours() + 2);
    events.push({
      id: `${patientId}-vm-start`,
      patientId,
      type: 'therapy',
      title: 'Início de Ventilação Mecânica',
      description: 'Modo: PSV, FiO₂: 70%',
      timestamp: vmDate,
      severity: 'critical',
    });
    
    // RX de tórax
    const xrayDate = new Date(admissionDate);
    xrayDate.setHours(xrayDate.getHours() + 4);
    events.push({
      id: `${patientId}-xray`,
      patientId,
      type: 'imaging',
      title: 'Radiografia de Tórax',
      description: 'Exame realizado para avaliação pulmonar',
      timestamp: xrayDate,
      severity: 'warning',
      relatedExamId: `${patientId}-chest-xray`, // Para abrir no Radiologista Virtual
    });
    
    // Lactato elevado
    const lactatoDate = new Date(admissionDate);
    lactatoDate.setHours(lactatoDate.getHours() + 6);
    events.push({
      id: `${patientId}-lactato-high`,
      patientId,
      type: 'lab',
      title: 'Lactato: 3.8 mmol/L',
      description: 'Lactato elevado (referência: < 2.0)',
      timestamp: lactatoDate,
      severity: 'critical',
    });
    
    // Início de vasopressor
    const vasoDate = new Date(admissionDate);
    vasoDate.setHours(vasoDate.getHours() + 8);
    events.push({
      id: `${patientId}-vaso-start`,
      patientId,
      type: 'therapy',
      title: 'Início de Noradrenalina',
      description: 'Dose: 0.5 mcg/kg/min',
      timestamp: vasoDate,
      severity: 'critical',
    });
    
    // Controle de lactato (24h depois)
    const lactatoControl = new Date(admissionDate);
    lactatoControl.setDate(lactatoControl.getDate() + 1);
    lactatoControl.setHours(10, 0, 0, 0);
    events.push({
      id: `${patientId}-lactato-control`,
      patientId,
      type: 'lab',
      title: 'Lactato: 2.5 mmol/L',
      description: 'Redução do lactato após suporte hemodinâmico',
      timestamp: lactatoControl,
      severity: 'warning',
    });
    
  } else if (patientType === 1) {
    // Paciente séptico
    const sepsisDate = new Date(admissionDate);
    sepsisDate.setHours(sepsisDate.getHours() + 1);
    events.push({
      id: `${patientId}-sepsis`,
      patientId,
      type: 'note',
      title: 'Suspeita de Sepse',
      description: 'Início de antibioticoterapia empírica',
      timestamp: sepsisDate,
      severity: 'critical',
    });
    
    // Início de antibiótico
    const abxDate = new Date(admissionDate);
    abxDate.setHours(abxDate.getHours() + 2);
    events.push({
      id: `${patientId}-abx-start`,
      patientId,
      type: 'therapy',
      title: 'Início de Antibioticoterapia',
      description: 'Ceftriaxona + Vancomicina',
      timestamp: abxDate,
      severity: 'warning',
    });
    
    // TC de tórax
    const ctDate = new Date(admissionDate);
    ctDate.setHours(ctDate.getHours() + 6);
    events.push({
      id: `${patientId}-ct`,
      patientId,
      type: 'imaging',
      title: 'Tomografia de Tórax',
      description: 'TC realizada para avaliação de pneumonia',
      timestamp: ctDate,
      severity: 'warning',
      relatedExamId: `${patientId}-chest-ct`,
    });
    
    // PCR elevado
    const pcrDate = new Date(admissionDate);
    pcrDate.setHours(pcrDate.getHours() + 8);
    events.push({
      id: `${patientId}-pcr-high`,
      patientId,
      type: 'lab',
      title: 'PCR: 180 mg/L',
      description: 'Proteína C reativa elevada',
      timestamp: pcrDate,
      severity: 'warning',
    });
    
  } else {
    // Paciente cardíaco
    const cardiacDate = new Date(admissionDate);
    cardiacDate.setHours(cardiacDate.getHours() + 1);
    events.push({
      id: `${patientId}-cardiac`,
      patientId,
      type: 'note',
      title: 'Insuficiência Cardíaca',
      description: 'Avaliação cardiológica inicial',
      timestamp: cardiacDate,
      severity: 'warning',
    });
    
    // Ecocardiograma
    const echoDate = new Date(admissionDate);
    echoDate.setHours(echoDate.getHours() + 3);
    events.push({
      id: `${patientId}-echo`,
      patientId,
      type: 'imaging',
      title: 'Ecocardiograma',
      description: 'Avaliação de função cardíaca',
      timestamp: echoDate,
      severity: 'normal',
      relatedExamId: `${patientId}-echo`,
    });
    
    // Início de vasopressor
    const vasoDate = new Date(admissionDate);
    vasoDate.setHours(vasoDate.getHours() + 5);
    events.push({
      id: `${patientId}-vaso-cardiac`,
      patientId,
      type: 'therapy',
      title: 'Início de Dobutamina',
      description: 'Dose: 5 mcg/kg/min',
      timestamp: vasoDate,
      severity: 'warning',
    });
  }
  
  // Ordenar por timestamp DESC (mais recente primeiro)
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Formata timestamp relativo (ex: "Há 6h", "D-1", "Hoje 08:40")
 */
export function formatRelativeTime(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  // Mesmo dia
  if (diffDays === 0) {
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Agora';
      return `Há ${diffMins}min`;
    }
    if (diffHours === 1) return 'Há 1h';
    return `Há ${diffHours}h`;
  }
  
  // Ontem
  if (diffDays === 1) {
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    return `Ontem ${hours}:${minutes}`;
  }
  
  // Dias anteriores
  if (diffDays <= 7) {
    return `D-${diffDays}`;
  }
  
  // Mais de uma semana: mostrar data completa
  return timestamp.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

