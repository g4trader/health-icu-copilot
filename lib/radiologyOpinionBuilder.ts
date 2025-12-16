import type { Patient } from '@/types/Patient';
import type { ExamType, RadiologyReport, RadiologyReportSummary, RadiologyReportFull } from '@/types/RadiologyOpinion';

/**
 * Detecta automaticamente o tipo de exame mais apropriado baseado no diagnóstico do paciente
 * Retorna apenas exames de imagem (RX/US/TC/RM/ECO), nunca ECG/laboratório
 */
function detectAppropriateExamType(patient: Patient): ExamType {
  const diag = patient.diagnosticoPrincipal.toLowerCase();
  
  // Diagnósticos respiratórios → Radiografia/Tomografia de Tórax
  if (
    diag.includes('bronquiolite') ||
    diag.includes('pneumonia') ||
    diag.includes('insuficiência respiratória') ||
    diag.includes('insuficiencia respiratoria') ||
    diag.includes('respiratório') ||
    diag.includes('respiratorio')
  ) {
    return 'chest-xray';
  }
  
  // Diagnósticos neurológicos → TC de Crânio
  if (
    diag.includes('convulsão') ||
    diag.includes('convulsao') ||
    diag.includes('encefalopatia') ||
    diag.includes('trauma craniano') ||
    diag.includes('neurológico') ||
    diag.includes('neurologico') ||
    diag.includes('hemorragia cerebral')
  ) {
    return 'head-ct';
  }
  
  // Diagnósticos cardíacos → ECO (Ecocardiograma) - nunca ECG
  if (
    diag.includes('cardiopatia') ||
    diag.includes('insuficiência cardíaca') ||
    diag.includes('insuficiencia cardiaca') ||
    diag.includes('cardíaco') ||
    diag.includes('cardiaco') ||
    diag.includes('arritmia')
  ) {
    return 'echo';
  }
  
  // Diagnósticos abdominais → TC de Abdome
  if (
    diag.includes('abdomen') ||
    diag.includes('abdominal') ||
    diag.includes('peritonite') ||
    diag.includes('apendicite')
  ) {
    return 'abdominal-ct';
  }
  
  // Padrão: Radiografia de Tórax (mais comum em UTI pediátrica)
  return 'chest-xray';
}

/**
 * Retorna apenas sugestões de exames de imagem (RX/US/TC/RM/ECO)
 * Remove qualquer sugestão que não seja de exame de imagem
 */
function filterImageOnlySuggestions(suggestions: string[]): string[] {
  return suggestions.filter(suggestion => {
    const s = suggestion.toLowerCase();
    return (
      s.includes('radiológico') ||
      s.includes('radiologico') ||
      s.includes('raio') ||
      s.includes('rx') ||
      s.includes('tomografia') ||
      s.includes('tc') ||
      s.includes('ultrassom') ||
      s.includes('us') ||
      s.includes('ecocardiograma') ||
      s.includes('eco') ||
      s.includes('ressonância') ||
      s.includes('ressonancia') ||
      s.includes('rm') ||
      s.includes('imagem') ||
      s.includes('controle radiológico') ||
      s.includes('controle radiologico') ||
      s.includes('evolução tomográfica') ||
      s.includes('evolucao tomografica')
    );
  });
}

/**
 * Gera parecer radiológico determinístico baseado no paciente
 * Retorna estrutura split: summary (para chat) e full (para preview)
 * Mesmo paciente sempre retorna o mesmo parecer
 */
export function buildRadiologyReport(
  patient: Patient,
  examType?: ExamType
): RadiologyReport {
  // Se não especificado, detectar automaticamente o tipo de exame mais apropriado
  const selectedExamType = examType || detectAppropriateExamType(patient);
  const examTypeLabels: Record<ExamType, string> = {
    'chest-xray': 'Radiografia de Tórax',
    'head-ct': 'Tomografia Computadorizada de Crânio',
    'chest-ct': 'Tomografia Computadorizada de Tórax',
    'abdominal-ct': 'Tomografia Computadorizada de Abdome',
    'echo': 'Ecocardiograma',
  };

  const techniques: Record<ExamType, string> = {
    'chest-xray': 'Radiografia de tórax realizada em incidência anteroposterior (AP) e perfil, quando disponível. Técnica adequada para avaliação de campos pulmonares, silhueta cardíaca e estruturas mediastinais.',
    'head-ct': 'Tomografia computadorizada de crânio realizada em cortes axiais de 5mm, sem e com contraste endovenoso. Reconstruções multiplanares quando indicadas.',
    'chest-ct': 'Tomografia computadorizada de tórax realizada em cortes finos de alta resolução, com protocolo para avaliação de parênquima pulmonar e estruturas mediastinais.',
    'abdominal-ct': 'Tomografia computadorizada de abdome realizada com contraste endovenoso e oral, em cortes de 5mm, com reconstruções coronal e sagital.',
    'echo': 'Ecocardiograma transtorácico realizado com transdutores de alta frequência adequados para pediatria. Avaliação de estruturas cardíacas, função sistólica e diastólica, e fluxos valvares.',
  };

  // Data mock determinística baseada no paciente (mesmo paciente = mesma data)
  const dateSeed = patient.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const daysAgo = dateSeed % 7; // 0-6 dias atrás (determinístico)
  const dateMock = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
  const timestamp = new Date().toISOString();

  // Dados mock determinísticos por paciente e tipo de exame
  // Usar seed baseado em patientId + examType para garantir determinismo
  const seed = `${patient.id}-${selectedExamType}`;
  
  // Dados mock simplificados - gerar baseado no seed
  const mockData = generateMockReportData(patient, selectedExamType, seed);

  // Filtrar sugestões para garantir que sejam apenas de imagem
  const imageOnlySuggestions = filterImageOnlySuggestions(mockData.suggestions);

  // Criar reportFull
  const reportFull: RadiologyReportFull = {
    examType: selectedExamType,
    examTypeLabel: examTypeLabels[selectedExamType],
    dateMock,
    technique: techniques[selectedExamType],
    findings: mockData.findings,
    impression: mockData.diagnosticImpression,
    correlation: mockData.clinicalCorrelation,
    suggestions: imageOnlySuggestions,
    disclaimer: 'Parecer radiológico automatizado com dados simulados. Sempre confirme achados com avaliação radiológica formal e equipe médica.',
    patientId: patient.id,
    patientName: patient.nome,
    patientBed: patient.leito,
    timestamp,
  };

  // Criar reportSummary (resumo para chat)
  const reportSummary: RadiologyReportSummary = {
    examType: selectedExamType,
    examTypeLabel: examTypeLabels[selectedExamType],
    dateMock,
    keyFindings: mockData.findings.slice(0, 3), // Primeiros 3 achados
    impressionShort: mockData.diagnosticImpression.split('.').slice(0, 2).join('.') + '.', // Primeiras 1-2 frases
    correlationShort: mockData.clinicalCorrelation.split('.').slice(0, 2).join('.') + '.', // Primeiras 1-2 frases
    patientId: patient.id,
    patientName: patient.nome,
    patientBed: patient.leito,
    timestamp,
  };

  return {
    summary: reportSummary,
    full: reportFull,
  };
}

/**
 * Gera dados mock determinísticos baseados no paciente e tipo de exame
 */
function generateMockReportData(
  patient: Patient,
  examType: ExamType,
  seed: string
): {
  findings: string[];
  diagnosticImpression: string;
  clinicalCorrelation: string;
  suggestions: string[];
} {
  // Hash simples para garantir determinismo
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const diag = patient.diagnosticoPrincipal.toLowerCase();

  // Dados específicos para cada tipo de exame e contexto clínico
  if (examType === 'chest-xray') {
    if (diag.includes('bronquiolite') || diag.includes('respiratório') || diag.includes('respiratorio')) {
      return {
        findings: [
          'Consolidações bilaterais, principalmente em campos inferiores e médios',
          'Padrão intersticial peribroncovascular espessado',
          'Aumento discreto de transparência pulmonar em campos superiores (hiperinsuflação)',
          'Silhueta cardíaca com dimensões dentro dos limites da normalidade para a idade',
          'Derrame pleural bilateral mínimo'
        ],
        diagnosticImpression: 'Padrão radiológico compatível com bronquiolite viral aguda, com consolidações periféricas e componente de hiperinsuflação. Presença de derrame pleural bilateral mínimo, provavelmente reativo.',
        clinicalCorrelation: 'Achados radiológicos são coerentes com o quadro clínico de bronquiolite viral aguda com insuficiência respiratória grave. As consolidações podem representar atelectasias ou sobreposição de processo inflamatório. Recomenda-se correlação com exame físico e parâmetros ventilatórios.',
        suggestions: [
          'Considerar controle radiológico em 24-48h para avaliar evolução',
          'Avaliar necessidade de tomografia de tórax de alta resolução se houver piora',
          'Monitorar evolução radiológica conforme resposta ao tratamento'
        ]
      };
    } else if (diag.includes('pneumonia') || diag.includes('sepse')) {
      return {
        findings: [
          'Consolidações bilaterais, predominantemente em campos inferiores',
          'Infiltrados intersticiais difusos',
          'Pequeno derrame pleural bilateral',
          'Silhueta cardíaca com leve aumento',
          'Atelectasias basais bilaterais'
        ],
        diagnosticImpression: 'Padrão radiológico compatível com pneumonia com componente intersticial. Presença de derrame pleural e atelectasias basais, possivelmente relacionadas ao processo infeccioso e posicionamento.',
        clinicalCorrelation: 'Achados radiológicos são coerentes com diagnóstico de sepse de origem respiratória. O aumento discreto da silhueta cardíaca pode representar sobrecarga volêmica ou processo inflamatório. Correlacionar com parâmetros hemodinâmicos.',
        suggestions: [
          'Considerar controle radiológico para monitorar evolução das consolidações',
          'Avaliar necessidade de tomografia de tórax se houver dúvida diagnóstica',
          'Monitorar derrame pleural e considerar avaliação ultrassonográfica se houver progressão'
        ]
      };
    } else {
      return {
        findings: [
          'Campos pulmonares sem consolidações significativas',
          'Padrão intersticial sutil',
          'Silhueta cardíaca com dimensões adequadas',
          'Vasos pulmonares com calibre normal',
          'Ausência de derrame pleural'
        ],
        diagnosticImpression: 'Radiografia de tórax sem alterações significativas. Estruturas pulmonares e cardíacas dentro dos limites da normalidade para a idade.',
        clinicalCorrelation: 'Achados radiológicos dentro da normalidade. Manter correlação com quadro clínico e parâmetros laboratoriais.',
        suggestions: [
          'Considerar exames adicionais conforme indicação clínica',
          'Monitorar evolução radiológica se necessário'
        ]
      };
    }
  }

  if (examType === 'head-ct') {
    return {
      findings: [
        'Parênquima encefálico sem alterações significativas',
        'Ventrículos com dimensões adequadas para a idade',
        'Sulcos e cisternas basais preservados',
        'Ausência de efeito de massa ou lesões expansivas',
        'Calcificações e densidades dentro dos limites da normalidade'
      ],
      diagnosticImpression: 'Tomografia computadorizada de crânio sem alterações significativas. Não há sinais de lesão expansiva, hemorragia ou edema cerebral significativo.',
      clinicalCorrelation: 'Achados tomográficos normais. Alterações neurológicas, se presentes, podem estar relacionadas a hipoxemia, sedação ou processo sistêmico. Considerar avaliação neurológica e monitorização contínua.',
      suggestions: [
        'Considerar ressonância magnética de crânio se houver necessidade de melhor definição de estruturas',
        'Reavaliar com novo exame se houver mudança no quadro neurológico'
      ]
    };
  }

  if (examType === 'chest-ct') {
    return {
      findings: [
        'Consolidações bilaterais em vidro fosco e padrão retículo-nodular',
        'Espessamento de septos interlobulares',
        'Aumento da densidade peribroncovascular',
        'Pequenos derrames pleurais bilaterais',
        'Áreas de hiperinsuflação em lobos superiores'
      ],
      diagnosticImpression: 'Padrão tomográfico sugestivo de processo inflamatório difuso, compatível com bronquiolite viral. Presença de componente de hiperinsuflação e derrames pleurais bilaterais mínimos.',
      clinicalCorrelation: 'Os achados tomográficos detalhados corroboram o diagnóstico de bronquiolite viral com comprometimento pulmonar difuso. O padrão em vidro fosco sugere comprometimento alveolar além do intersticial.',
      suggestions: [
        'Considerar controle tomográfico em 48-72h para avaliar evolução',
        'Correlacionar com parâmetros de ventilação mecânica e oxigenação'
      ]
    };
  }

  if (examType === 'abdominal-ct') {
    return {
      findings: [
        'Órgãos abdominais com dimensões e densidades dentro dos limites da normalidade',
        'Fígado, baço e rins sem alterações significativas',
        'Parede abdominal sem espessamentos ou coleções',
        'Vasos abdominais com calibre preservado'
      ],
      diagnosticImpression: 'Tomografia computadorizada de abdome sem alterações significativas. Não há sinais de processo inflamatório intra-abdominal ou outras alterações estruturais.',
      clinicalCorrelation: 'Achados abdominais normais. Considerar que alterações sistêmicas podem não estar relacionadas ao abdome. Manter correlação com quadro clínico.',
      suggestions: [
        'Considerar ultrassonografia abdominal se houver necessidade de avaliação adicional',
        'Reavaliar com novo exame se houver mudança no quadro clínico'
      ]
    };
  }

  if (examType === 'echo') {
    return {
      findings: [
        'Câmaras cardíacas com dimensões adequadas para a idade',
        'Função sistólica global preservada (FEVE estimada: 60-65%)',
        'Função diastólica dentro dos limites da normalidade',
        'Valvas cardíacas sem alterações estruturais significativas',
        'Fluxos valvares dentro da normalidade'
      ],
      diagnosticImpression: 'Ecocardiograma transtorácico sem alterações estruturais significativas. Função cardíaca preservada. Não há sinais de cardiopatia congênita complexa ou disfunção cardíaca significativa.',
      clinicalCorrelation: 'Achados ecocardiográficos dentro da normalidade. Alterações hemodinâmicas, se presentes, podem estar relacionadas a causas extracardíacas como hipoxemia, sepse ou desequilíbrio volêmico.',
      suggestions: [
        'Considerar ecocardiograma seriado se houver instabilidade hemodinâmica',
        'Avaliar necessidade de ecocardiograma transesofágico se indicado clinicamente'
      ]
    };
  }

  // Fallback
  return {
    findings: [
      'Exame realizado com técnica adequada',
      'Achados dentro dos limites da normalidade para a idade',
      'Sem alterações significativas'
    ],
    diagnosticImpression: 'Exame sem alterações significativas. Recomenda-se correlação com quadro clínico.',
    clinicalCorrelation: 'Achados devem ser correlacionados com o contexto clínico do paciente.',
    suggestions: [
      'Manter correlação com quadro clínico',
      'Considerar exames adicionais conforme indicação'
    ]
  };
}

// Função de compatibilidade (deprecated - usar buildRadiologyReport)
export function buildRadiologyOpinion(
  patient: Patient,
  examType?: ExamType
): import('@/types/RadiologyOpinion').RadiologyOpinion {
  const report = buildRadiologyReport(patient, examType);
  return {
    examType: report.full.examType,
    examTypeLabel: report.full.examTypeLabel,
    patientId: report.full.patientId,
    patientName: report.full.patientName,
    patientBed: report.full.patientBed,
    findings: report.full.findings,
    diagnosticImpression: report.full.impression,
    clinicalCorrelation: report.full.correlation,
    suggestions: report.full.suggestions,
    timestamp: report.full.timestamp,
  };
}