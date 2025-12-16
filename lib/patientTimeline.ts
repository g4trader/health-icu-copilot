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

/**
 * Calcula score de relevância de um evento para o resumo
 */
function calculateEventScore(event: TimelineEvent): number {
  let score = 0;
  
  // Severidade
  if (event.severity === 'critical') score += 100;
  else if (event.severity === 'warning') score += 50;
  else if (event.severity === 'normal') score += 10;
  
  // Tipo (pesos diferentes)
  const typeWeights: Record<TimelineEventType, number> = {
    'therapy': 30, // Ventilação, vasopressor têm alta relevância
    'imaging': 25,
    'lab': 25,
    'vitals': 20,
    'note': 15,
    'admission': 5, // Admissão é menos relevante em 24h
  };
  
  score += typeWeights[event.type] || 0;
  
  // Eventos relacionados a exames/imagens têm peso extra
  if (event.relatedExamId) {
    score += 10;
  }
  
  return score;
}

/**
 * Remove duplicatas semânticas simples (ex: dois labs seguidos do mesmo tipo)
 */
function deduplicateEvents(events: TimelineEvent[]): TimelineEvent[] {
  const seen = new Set<string>();
  const deduplicated: TimelineEvent[] = [];
  
  for (const event of events) {
    // Criar chave semântica baseada no tipo e título simplificado
    const semanticKey = `${event.type}-${event.title.toLowerCase().substring(0, 20)}`;
    
    if (!seen.has(semanticKey)) {
      seen.add(semanticKey);
      deduplicated.push(event);
    } else {
      // Se já existe, substituir pelo mais recente ou mais crítico
      const existingIndex = deduplicated.findIndex(
        e => `${e.type}-${e.title.toLowerCase().substring(0, 20)}` === semanticKey
      );
      
      if (existingIndex >= 0) {
        const existing = deduplicated[existingIndex];
        // Manter o mais crítico ou mais recente
        if (
          (event.severity === 'critical' && existing.severity !== 'critical') ||
          (event.timestamp > existing.timestamp && event.severity === existing.severity)
        ) {
          deduplicated[existingIndex] = event;
        }
      }
    }
  }
  
  return deduplicated;
}

/**
 * Labels de tipo para exibição
 */
export const eventTypeLabels: Record<TimelineEventType, string> = {
  admission: 'Admissão',
  vitals: 'Sinais Vitais',
  lab: 'Laboratório',
  imaging: 'Imagem',
  therapy: 'Terapia',
  note: 'Nota',
};

/**
 * Retorna os 3 eventos mais relevantes das últimas 24h para o resumo
 */
export function getPatientTimelineSummary(patientId: string): { events: TimelineEvent[]; isFallback: boolean } {
  // Obter timeline completa
  const allEvents = getPatientTimeline(patientId);
  
  // Determinar "agora" de forma determinística (usar seed para normalizar)
  const seed = patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const now = new Date();
  // Normalizar para determinismo: usar horário fixo baseado no seed
  now.setHours(9 + (seed % 8), 0, 0, 0); // Entre 9h e 16h
  
  // Filtrar eventos das últimas 24h
  const twentyFourHoursAgo = new Date(now);
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  
  const recentEvents = allEvents.filter(event => event.timestamp >= twentyFourHoursAgo);
  const isFallback = recentEvents.length < 3;
  
  // Se não houver eventos suficientes em 24h, usar os mais recentes disponíveis
  const eventsToProcess = isFallback ? allEvents.slice(0, 10) : recentEvents;
  
  // Deduplicar eventos semânticos
  const deduplicated = deduplicateEvents(eventsToProcess);
  
  // Calcular score e ordenar
  const scored = deduplicated.map(event => ({
    event,
    score: calculateEventScore(event),
  }));
  
  scored.sort((a, b) => {
    // Ordenar por score (maior primeiro)
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Em empate, preferir mais recente
    return b.event.timestamp.getTime() - a.event.timestamp.getTime();
  });
  
  // Selecionar top 3
  const topEvents = scored.slice(0, 3).map(item => item.event);
  
  // Ordenação final: por severidade (critical > warning > normal) e depois timestamp desc
  const severityOrder: Record<NonNullable<TimelineEvent['severity']>, number> = {
    critical: 3,
    warning: 2,
    normal: 1,
  };
  
  topEvents.sort((a, b) => {
    const aSeverity = a.severity || 'normal';
    const bSeverity = b.severity || 'normal';
    
    // Primeiro por severidade
    if (severityOrder[aSeverity] !== severityOrder[bSeverity]) {
      return severityOrder[bSeverity] - severityOrder[aSeverity];
    }
    
    // Depois por timestamp desc (mais recente primeiro)
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
  
  return {
    events: topEvents,
    isFallback,
  };
}

