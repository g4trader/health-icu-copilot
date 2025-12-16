import type { Patient } from '@/types/Patient';
import type { ClinicalAgentId } from '@/lib/clinicalAgents';
import { clinicalAgents } from '@/lib/clinicalAgents';
import { specialistOpinions } from './specialistOpinions';
import type { SpecialistOpinion, SpecialistOpinionDashboards } from '@/types/SpecialistOpinion';

/**
 * Constrói um parecer estruturado a partir do paciente e agente
 */
export function buildSpecialistOpinion(
  patient: Patient,
  agentId: ClinicalAgentId
): SpecialistOpinion | null {
  const agent = clinicalAgents[agentId];
  const textOpinion = specialistOpinions[agentId]?.[patient.id];
  
  if (!textOpinion) {
    return null;
  }

  // Extrair dados dos dashboards do paciente
  const vitals = patient.vitalSigns;
  const hasVM = !!patient.ventilationParams;
  const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  const antibiotics = patient.medications
    .filter(m => m.tipo === "antibiotico" && m.ativo)
    .map(m => m.nome);
  
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  const pcr = patient.labResults.find(l => l.tipo === "pcr");
  
  // Calcular tendência do lactato (mock simples baseado em valor)
  const lactatoValue = typeof lactato?.valor === "number" ? lactato.valor : undefined;
  const lactatoTrend: 'up' | 'down' | 'stable' = lactato?.tendencia === "subindo" ? 'up' 
    : lactato?.tendencia === "caindo" ? 'down' 
    : 'stable';
  const previousLactate = lactatoValue ? (lactatoValue * 0.85) : undefined;
  
  const pcrValue = typeof pcr?.valor === "number" ? pcr.valor : undefined;
  const pcrTrend: 'up' | 'down' | 'stable' = 'stable'; // Mock
  const previousPcr = pcrValue ? (pcrValue * 0.9) : undefined;

  // Extrair resumo, riscos, exames sugeridos e terapias do texto
  const lines = textOpinion.split('\n').filter(l => l.trim());
  const titleLine = lines[0] || '';
  const summaryLines = lines.slice(1).filter(l => !l.startsWith('**') && !l.startsWith('-'));
  const summary = summaryLines.join(' ').trim();
  
  // Extrair riscos (linhas que mencionam "risco", "piora", "atenção", etc.)
  const riskKeywords = ['risco', 'atenção', 'piora', 'deterioração', 'instabilidade', 'vigilância'];
  const risks = lines
    .filter(l => riskKeywords.some(k => l.toLowerCase().includes(k)))
    .slice(0, 3)
    .map(l => l.replace(/^\*\*.*?\*\*/, '').trim())
    .filter(l => l.length > 0);
  
  // Extrair exames sugeridos (linhas com "ecocardiograma", "exame", "troponina", etc.)
  const examKeywords = ['ecocardiograma', 'exame', 'troponina', 'radiografia', 'rx', 'tc', 'eeg', 'neuroimagem'];
  const suggestedOrders = lines
    .filter(l => examKeywords.some(k => l.toLowerCase().includes(k)))
    .map(l => {
      // Extrair nome do exame mencionado
      const match = l.match(new RegExp(`(${examKeywords.join('|')})`, 'i'));
      return match ? match[1] : null;
    })
    .filter((e): e is string => e !== null)
    .slice(0, 5);
  
  // Extrair terapias sugeridas (linhas com "ajustar", "titular", "revisar", etc.)
  const therapyKeywords = ['ajustar', 'titular', 'revisar', 'manter', 'reduzir', 'aumentar'];
  const suggestedTherapies = lines
    .filter(l => therapyKeywords.some(k => l.toLowerCase().includes(k)))
    .slice(0, 3)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // Criar alerts baseados em valores críticos
  const alerts: string[] = [];
  if (vitals.pressaoArterialMedia < 65) {
    alerts.push('Hipotensão (MAP < 65 mmHg)');
  }
  if (vitals.saturacaoO2 < 92) {
    alerts.push(`Hipoxemia (SpO₂ ${vitals.saturacaoO2}%)`);
  }
  if (lactatoValue && lactatoValue >= 3) {
    alerts.push(`Lactato elevado (${lactatoValue.toFixed(1)} mmol/L)`);
  }
  if (vitals.frequenciaCardiaca > 150) {
    alerts.push('Taquicardia');
  }

  const dashboards: SpecialistOpinionDashboards = {
    vitals: {
      map: vitals.pressaoArterialMedia,
      hr: vitals.frequenciaCardiaca,
      rr: vitals.frequenciaRespiratoria,
      spo2: vitals.saturacaoO2,
      temperature: vitals.temperatura,
    },
    labs: {
      ...(lactatoValue && {
        lactate: {
          value: lactatoValue,
          unit: 'mmol/L',
          trend: lactatoTrend,
          previousValue: previousLactate,
        },
      }),
      ...(pcrValue && {
        pcr: {
          value: pcrValue,
          unit: 'mg/L',
          trend: pcrTrend,
          previousValue: previousPcr,
        },
      }),
    },
    therapies: {
      ventilation: hasVM,
      vasopressor: hasVaso,
      antibiotics,
    },
    alerts,
  };

  return {
    agentId,
    agentName: agent.name,
    agentEmoji: agent.emoji,
    patientId: patient.id,
    patientName: patient.nome,
    patientBed: patient.leito,
    title: titleLine,
    summary: summary || textOpinion, // Fallback para texto completo se não conseguir extrair
    risks: risks.length > 0 ? risks : ['Monitorização contínua necessária'],
    suggestedOrders: suggestedOrders.length > 0 ? suggestedOrders : [],
    suggestedTherapies: suggestedTherapies.length > 0 ? suggestedTherapies : [],
    dashboards,
    timestamp: new Date().toISOString(),
  };
}

