import type { Patient } from '@/types/Patient';
import type { RadiologyOpinion, ExamType } from '@/types/RadiologyOpinion';

/**
 * Gera parecer radiológico determinístico baseado no paciente
 * Mesmo paciente sempre retorna o mesmo parecer
 */
export function buildRadiologyOpinion(
  patient: Patient,
  examType: ExamType = 'chest-xray'
): RadiologyOpinion {
  const examTypeLabels: Record<ExamType, string> = {
    'chest-xray': 'Radiografia de Tórax',
    'head-ct': 'Tomografia Computadorizada de Crânio',
    'chest-ct': 'Tomografia Computadorizada de Tórax',
    'abdominal-ct': 'Tomografia Computadorizada de Abdome',
    'ecg': 'Eletrocardiograma',
  };

  // Parecer determinístico baseado no ID do paciente e tipo de exame
  const seed = `${patient.id}-${examType}`;
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Pareceres específicos por paciente (determinísticos)
  const opinions: Record<string, Record<ExamType, Omit<RadiologyOpinion, 'examType' | 'examTypeLabel' | 'patientId' | 'patientName' | 'patientBed' | 'timestamp'>>> = {
    'p1': {
      'chest-xray': {
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
          'Avaliar necessidade de manobras de recrutamento pulmonar caso haja piora da oxigenação',
          'Monitorar volume pulmonar e possibilidade de desenvolvimento de pneumotórax'
        ]
      },
      'head-ct': {
        findings: [
          'Parênquima encefálico sem alterações significativas',
          'Ventrículos com dimensões adequadas para a idade',
          'Sulcos e cisternas basais preservados',
          'Ausência de efeito de massa ou lesões expansivas',
          'Calcificações e densidades dentro dos limites da normalidade'
        ],
        diagnosticImpression: 'Tomografia computadorizada de crânio sem alterações significativas. Não há sinais de lesão expansiva, hemorragia ou edema cerebral significativo.',
        clinicalCorrelation: 'Achados tomográficos não explicam o quadro respiratório. A depressão do nível de consciência (GCS 12) pode estar relacionada a hipoxemia, sedação ou processo sistêmico. Considerar avaliação neurológica e monitorização contínua.',
        suggestions: [
          'Revisar escalas de sedação e parâmetros de oxigenação',
          'Considerar avaliação neurológica seriada',
          'Manter monitorização de pressão intracraniana se indicado clinicamente'
        ]
      },
      'chest-ct': {
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
          'Correlacionar com parâmetros de ventilação mecânica e oxigenação',
          'Considerar estratégias de ventilação protetora',
          'Avaliar resposta ao tratamento e necessidade de ajustes terapêuticos'
        ]
      },
      'abdominal-ct': {
        findings: [
          'Órgãos abdominais com dimensões e densidades dentro dos limites da normalidade',
          'Fígado, baço e rins sem alterações significativas',
          'Parede abdominal sem espessamentos ou coleções',
          'Vasos abdominais com calibre preservado'
        ],
        diagnosticImpression: 'Tomografia computadorizada de abdome sem alterações significativas. Não há sinais de processo inflamatório intra-abdominal ou outras alterações estruturais.',
        clinicalCorrelation: 'Achados abdominais não explicam o quadro respiratório principal. Considerar que alterações hemodinâmicas podem estar relacionadas ao comprometimento respiratório e hipoxemia.',
        suggestions: [
          'Manter correlação com exames laboratoriais',
          'Monitorar função hepática e renal relacionada a medicações em uso',
          'Avaliar necessidade de exames adicionais conforme evolução clínica'
        ]
      },
      'ecg': {
        findings: [
          'Ritmo sinusal',
          'FC: 165 bpm (taquicardia sinusal)',
          'Eixo cardíaco desviado para direita para a idade',
          'Ondas P presentes e regulares',
          'Complexos QRS de duração normal para a idade',
          'Segmento ST sem alterações significativas'
        ],
        diagnosticImpression: 'Eletrocardiograma com ritmo sinusal e taquicardia sinusal. Eixo desviado para direita pode ser secundário a sobrecarga de câmaras direitas relacionada ao processo pulmonar.',
        clinicalCorrelation: 'A taquicardia sinusal é provavelmente compensatória ao quadro de insuficiência respiratória e hipoxemia. O desvio de eixo pode estar relacionado à sobrecarga de câmaras direitas secundária ao processo pulmonar e possível hipertensão pulmonar.',
        suggestions: [
          'Monitorar evolução eletrocardiográfica conforme melhora do quadro respiratório',
          'Avaliar necessidade de ecocardiograma para descartar hipertensão pulmonar',
          'Correlacionar com parâmetros hemodinâmicos e resposta ao tratamento'
        ]
      }
    },
    'p2': {
      'chest-xray': {
        findings: [
          'Consolidações bilaterais, predominantemente em campos inferiores',
          'Infiltrados intersticiais difusos',
          'Pequeno derrame pleural bilateral',
          'Silhueta cardíaca com leve aumento',
          'Atelectasias basais bilaterais'
        ],
        diagnosticImpression: 'Padrão radiológico compatível com pneumonia com componente intersticial. Presença de derrame pleural e atelectasias basais, possivelmente relacionadas ao processo infeccioso e posicionamento.',
        clinicalCorrelation: 'Achados radiológicos são coerentes com diagnóstico de sepse de origem respiratória. O aumento discreto da silhueta cardíaca pode representar sobrecarga volêmica ou processo inflamatório. Correlacionar com parâmetros hemodinâmicos e laboratoriais.',
        suggestions: [
          'Considerar controle radiológico para monitorar evolução das consolidações',
          'Avaliar necessidade de manobras fisioterápicas para atelectasias',
          'Monitorar derrame pleural e considerar drenagem se houver progressão'
        ]
      },
      'head-ct': {
        findings: [
          'Parênquima encefálico sem alterações focais',
          'Ventrículos com dimensões normais',
          'Sulcos preservados',
          'Ausência de sinais de hemorragia ou lesão isquêmica',
          'Fossa posterior sem alterações'
        ],
        diagnosticImpression: 'Tomografia computadorizada de crânio sem alterações significativas.',
        clinicalCorrelation: 'Achados normais. A alteração do nível de consciência pode estar relacionada à sepse, sedação ou hipoxemia. Manter monitorização neurológica e revisar escalas de sedação.',
        suggestions: [
          'Revisar escalas de sedação',
          'Monitorar parâmetros de oxigenação e perfusão',
          'Considerar avaliação neurológica seriada'
        ]
      },
      'chest-ct': {
        findings: [
          'Consolidações bilaterais, principalmente em bases pulmonares',
          'Padrão em vidro fosco difuso',
          'Espessamento de septos interlobulares',
          'Derrame pleural bilateral, mais proeminente à direita',
          'Atelectasias em bases'
        ],
        diagnosticImpression: 'Padrão tomográfico compatível com pneumonia bilateral com componente de lesão pulmonar aguda. Presença de derrame pleural bilateral e atelectasias.',
        clinicalCorrelation: 'Achados corroboram o diagnóstico de sepse de origem respiratória com lesão pulmonar aguda. O padrão em vidro fosco sugere comprometimento alveolar difuso.',
        suggestions: [
          'Considerar estratégias de ventilação protetora',
          'Avaliar necessidade de drenagem de derrame pleural',
          'Monitorar evolução tomográfica conforme resposta ao tratamento'
        ]
      },
      'abdominal-ct': {
        findings: [
          'Fígado com dimensões aumentadas, bordas preservadas',
          'Baço com dimensões dentro dos limites da normalidade',
          'Rins sem alterações significativas',
          'Parede abdominal sem espessamentos',
          'Coleções ou abscessos não identificados'
        ],
        diagnosticImpression: 'Tomografia computadorizada de abdome com hepatoesplenomegalia discreta, possivelmente relacionada ao processo infeccioso sistêmico. Demais estruturas sem alterações significativas.',
        clinicalCorrelation: 'A hepatoesplenomegalia pode estar relacionada à sepse e processo inflamatório sistêmico. Correlacionar com exames laboratoriais de função hepática.',
        suggestions: [
          'Monitorar função hepática através de exames laboratoriais',
          'Avaliar necessidade de exames adicionais conforme evolução',
          'Manter correlação com parâmetros hemodinâmicos'
        ]
      },
      'ecg': {
        findings: [
          'Ritmo sinusal',
          'FC: 152 bpm (taquicardia sinusal)',
          'Eixo cardíaco normal para a idade',
          'Complexos QRS normais',
          'Segmento ST sem alterações',
          'Ondas T dentro dos limites da normalidade'
        ],
        diagnosticImpression: 'Eletrocardiograma com ritmo sinusal e taquicardia sinusal, provavelmente relacionada ao processo séptico.',
        clinicalCorrelation: 'A taquicardia sinusal é um achado esperado em processos sépticos. Não há sinais de isquemia ou arritmias significativas.',
        suggestions: [
          'Monitorar evolução eletrocardiográfica',
          'Avaliar necessidade de estudos adicionais conforme resposta ao tratamento',
          'Correlacionar com parâmetros hemodinâmicos'
        ]
      }
    },
    'p3': {
      'chest-xray': {
        findings: [
          'Campos pulmonares sem consolidações significativas',
          'Padrão intersticial sutil',
          'Silhueta cardíaca com aumento moderado',
          'Vasos pulmonares proeminentes',
          'Ausência de derrame pleural'
        ],
        diagnosticImpression: 'Radiografia de tórax com aumento da silhueta cardíaca e vasos pulmonares proeminentes, sugestivo de cardiomegalia e possível aumento do fluxo pulmonar.',
        clinicalCorrelation: 'Achados radiológicos são coerentes com cardiopatia congênita. O aumento cardíaco e vasos proeminentes sugerem sobrecarga de volume ou aumento do fluxo pulmonar. Correlacionar com ecocardiograma.',
        suggestions: [
          'Ecocardiograma para avaliação detalhada da função cardíaca e anatomia',
          'Monitorar sinais de insuficiência cardíaca',
          'Avaliar necessidade de ajustes terapêuticos cardiológicos'
        ]
      },
      'head-ct': {
        findings: [
          'Parênquima encefálico sem alterações significativas',
          'Ventrículos com dimensões adequadas',
          'Sulcos preservados',
          'Ausência de lesões expansivas',
          'Calcificações normais para a idade'
        ],
        diagnosticImpression: 'Tomografia computadorizada de crânio sem alterações significativas.',
        clinicalCorrelation: 'Achados normais. Considerar que alterações neurológicas podem estar relacionadas a comprometimento hemodinâmico ou hipóxia cerebral.',
        suggestions: [
          'Correlacionar com avaliação neurológica',
          'Monitorar perfusão cerebral e parâmetros hemodinâmicos',
          'Avaliar necessidade de exames adicionais conforme evolução'
        ]
      },
      'chest-ct': {
        findings: [
          'Campos pulmonares sem consolidações significativas',
          'Aumento da silhueta cardíaca',
          'Vasos pulmonares proeminentes',
          'Pequenas atelectasias em bases',
          'Sem derrame pleural'
        ],
        diagnosticImpression: 'Tomografia computadorizada de tórax evidenciando cardiomegalia e vasos pulmonares proeminentes, compatível com cardiopatia congênita. Pequenas atelectasias em bases, possivelmente relacionadas ao posicionamento.',
        clinicalCorrelation: 'Achados corroboram o diagnóstico de cardiopatia congênita. Os vasos proeminentes sugerem aumento do fluxo pulmonar. Correlacionar com avaliação cardiológica detalhada.',
        suggestions: [
          'Ecocardiograma para avaliação anatômica e funcional',
          'Monitorar parâmetros hemodinâmicos',
          'Avaliar estratégias de manejo de insuficiência cardíaca'
        ]
      },
      'abdominal-ct': {
        findings: [
          'Órgãos abdominais com dimensões adequadas',
          'Fígado com leve aumento, possivelmente relacionado a congestão',
          'Baço e rins sem alterações',
          'Parede abdominal preservada'
        ],
        diagnosticImpression: 'Tomografia computadorizada de abdome com discreto aumento hepático, possivelmente relacionado a congestão hepática secundária a insuficiência cardíaca.',
        clinicalCorrelation: 'O aumento hepático pode estar relacionado à congestão passiva secundária à insuficiência cardíaca. Correlacionar com exames laboratoriais e parâmetros hemodinâmicos.',
        suggestions: [
          'Monitorar função hepática',
          'Avaliar resposta ao tratamento da insuficiência cardíaca',
          'Considerar avaliação cardiológica para otimização do manejo'
        ]
      },
      'ecg': {
        findings: [
          'Ritmo sinusal',
          'FC: 142 bpm',
          'Eixo desviado para esquerda',
          'Ondas P presentes',
          'Complexos QRS com alargamento discreto',
          'Repolarização com alterações sutis'
        ],
        diagnosticImpression: 'Eletrocardiograma com ritmo sinusal, eixo desviado para esquerda e alargamento discreto de QRS, possivelmente relacionado à cardiopatia congênita.',
        clinicalCorrelation: 'As alterações eletrocardiográficas são coerentes com cardiopatia congênita. O eixo desviado e alargamento de QRS podem representar alterações estruturais ou sobrecarga de câmaras.',
        suggestions: [
          'Ecocardiograma para avaliação detalhada',
          'Monitorar evolução eletrocardiográfica',
          'Avaliar necessidade de estudos eletrofisiológicos adicionais'
        ]
      }
    }
  };

  // Fallback para pacientes não mapeados
  const defaultOpinion = {
    findings: [
      'Exame realizado com técnica adequada',
      'Achados dentro dos limites da normalidade para a idade',
      'Sem alterações significativas'
    ],
    diagnosticImpression: 'Exame sem alterações significativas. Recomenda-se correlação com quadro clínico.',
    clinicalCorrelation: 'Achados devem ser correlacionados com o contexto clínico do paciente.',
    suggestions: [
      'Manter correlação com quadro clínico',
      'Considerar exames adicionais conforme indicação',
      'Monitorar evolução conforme necessário'
    ]
  };

  const patientOpinions = opinions[patient.id] || {};
  const examOpinion = patientOpinions[examType] || defaultOpinion;

  return {
    examType,
    examTypeLabel: examTypeLabels[examType],
    patientId: patient.id,
    patientName: patient.nome,
    patientBed: patient.leito,
    ...examOpinion,
    timestamp: new Date().toISOString(),
  };
}

