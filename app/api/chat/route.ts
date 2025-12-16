import { NextResponse } from "next/server";
import {
  mockPatients,
  mockUnitProfile,
  calculateRiskScore,
  getTopPatients,
  getSortedByMortalityRisk24h,
  riskLevelFromScore,
  type Patient
} from "@/lib/mockData";
import type { Patient as PatientType } from "@/types";
import {
  calculateDrugDose,
  calculateMaintenanceFluids,
  calculateSchwartzClCr,
  calculateBSA,
  calculateDoseByBSA
} from "@/lib/clinicalCalculators";
import { enhanceTextWithLLM } from "@/lib/llmClient";
import { logClinicalInteraction } from "@/lib/auditLogger";
import {
  getOrCreateMemory,
  updateActivePatient,
  addIntentionToHistory,
  resolveAmbiguity
} from "@/lib/clinicalMemory";
import { detectAgent, getAgent, getClinicalAgent, buildAgentOpinion, type ClinicalAgentType, type ClinicalAgentId } from "@/lib/clinicalAgents";
import { specialistOpinions, type SpecialistKey } from "@/lib/specialistOpinions";
import { buildSpecialistOpinion } from "@/lib/specialistOpinionBuilder";
import type { SpecialistOpinion } from "@/types/SpecialistOpinion";
import { buildRadiologyOpinion } from "@/lib/radiologyOpinionBuilder";
import type { RadiologyOpinion } from "@/types/RadiologyOpinion";
import { storeResearchEntry, desidentifyText } from "@/lib/researchStore";

interface RequestBody {
  message: string;
  focusedPatientId?: string | null;
  sessionId?: string;
  userId?: string;
  role?: "plantonista" | "diarista" | "coordenador" | "outro";
  unidade?: string;
  turno?: string;
  currentAgent?: ClinicalAgentType;
  agentId?: ClinicalAgentId;
  patientId?: string;
}

const VERSION = "1.0.0";
const MODEL_VERSION = "llama-3.1-70b-versatile";

const DISCLAIMER =
  "\n\n⚠️ **Lembrete importante**: Este é um protótipo com dados completamente fictícios e serve apenas como apoio à decisão, nunca substituindo a avaliação clínica.";

/**
 * Tipos de intenção detectáveis
 */
type Intent = 
  | "PRIORITIZACAO"
  | "PACIENTE_ESPECIFICO"
  | "SINAIS_VITAIS"
  | "BALANCO_HIDRICO"
  | "PERFIL_UNIDADE"
  | "CALCULO_CLINICO"
  | "RADIOLOGISTA_VIRTUAL"
  | "FALLBACK";

/**
 * Handler para Radiologista Virtual
 */
function handleRadiologyIntent(patientId: string): {
  reply: string;
  showIcuPanel: boolean;
  focusedPatient?: PatientType;
  radiologyOpinion?: RadiologyOpinion;
  intent?: string;
} {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) {
    return {
      reply: "Paciente não encontrado. Selecione um paciente para solicitar parecer radiológico." + DISCLAIMER,
      showIcuPanel: false,
    };
  }

  // Gerar parecer radiológico determinístico (sempre chest-xray como padrão)
  const radiologyOpinion = buildRadiologyOpinion(patient, 'chest-xray');

  return {
    reply: `Parecer radiológico para ${patient.leito} • ${patient.nome}: ${radiologyOpinion.examTypeLabel}`,
    showIcuPanel: false,
    focusedPatient: patient,
    radiologyOpinion,
    intent: 'RADIOLOGISTA_VIRTUAL',
  };
}

function handleAgentOpinionIntent(patientId: string, agentId: ClinicalAgentId): { 
  reply: string; 
  showIcuPanel: boolean;
  agentId: ClinicalAgentId;
  focusedPatient?: PatientType;
  showPatientOverview?: boolean;
  showVitalsPanel?: boolean;
  showLabsPanel?: boolean;
  showTherapiesPanel?: boolean;
  specialistOpinion?: SpecialistOpinion;
} {
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) {
    return { 
      reply: "Paciente não encontrado. Tente selecionar novamente." + DISCLAIMER,
      showIcuPanel: false,
      agentId 
    };
  }

  // Tentar construir parecer estruturado primeiro
  const structuredOpinion = buildSpecialistOpinion(patient, agentId);
  
  if (structuredOpinion) {
    // Retornar parecer estruturado (o frontend deve renderizar como SpecialistOpinionMessage)
    return {
      reply: structuredOpinion.summary, // Texto de fallback
      showIcuPanel: false,
      agentId,
      focusedPatient: patient,
      showPatientOverview: true,
      showVitalsPanel: true,
      showLabsPanel: true,
      showTherapiesPanel: true,
      specialistOpinion: structuredOpinion, // Dados estruturados
    };
  }
  
  // Fallback: buscar parecer textual mockado
  const specialistKey = agentId as SpecialistKey;
  const mockOpinion = specialistOpinions[specialistKey]?.[patientId];

  if (mockOpinion) {
    // Usar parecer mockado textual
    const footer = '\n\n---\n*Health Copilot+ v1.0.0* | Dados: Simulados | Parecer de agente de subespecialidade. Este conteúdo é apenas apoio à decisão e não substitui avaliação médica presencial.';
    
    return {
      reply: mockOpinion + footer,
      showIcuPanel: false,
      agentId,
      focusedPatient: patient,
      showPatientOverview: true,
      showVitalsPanel: true,
      showLabsPanel: true,
      showTherapiesPanel: true
    };
  }

  // Fallback para buildAgentOpinion se não houver mock
  const opinion = buildAgentOpinion(patient, agentId);
  const agent = getClinicalAgent(agentId);

  const lines: string[] = [];
  lines.push(opinion.title);
  lines.push("");
  lines.push("**Resumo do caso**");
  lines.push(opinion.summary);
  lines.push("");
  lines.push("**Impressão diagnóstica**");
  lines.push(opinion.diagnosticImpression);
  lines.push("");
  
  if (opinion.suggestedExams.length > 0) {
    lines.push("**Exames recomendados**");
    opinion.suggestedExams.forEach(exam => {
      lines.push(`- ${exam}`);
    });
    lines.push("");
  }
  
  if (opinion.treatmentSuggestions.length > 0) {
    lines.push("**Sugestões terapêuticas**");
    opinion.treatmentSuggestions.forEach(suggestion => {
      lines.push(`- ${suggestion}`);
    });
    lines.push("");
  }
  
  lines.push("⚠️ *Este é um parecer automatizado com dados simulados. Sempre confirme condutas com a equipe médica e protocolos locais.*");

  return {
    reply: lines.join("\n"),
    showIcuPanel: false,
    agentId,
    focusedPatient: patient,
    showPatientOverview: true,
    showVitalsPanel: true,
    showLabsPanel: true,
    showTherapiesPanel: true
  };
}

/**
 * Parser simples de intenção por palavras-chave
 */
function detectIntent(
  message: string, 
  focusedPatientId: string | null, 
  agentId?: ClinicalAgentId,
  requestPatientId?: string
): Intent {
  const msg = message.toLowerCase().trim();
  
  // Detectar Radiologista Virtual primeiro (tem prioridade)
  if (
    (agentId as string) === 'radiology' ||
    msg.includes("radiologista") || 
    msg.includes("raio") || 
    msg.includes("imagem") ||
    msg.includes("rx") ||
    msg.includes("tomografia") ||
    msg.includes("tc ")
  ) {
    if (requestPatientId || focusedPatientId) {
      return "RADIOLOGISTA_VIRTUAL";
    }
  }
  
  // Removido: AGENTE_PARECER não existe mais - apenas Plantonista (general) e Radiologista Virtual

  // PRIORITIZACAO
  if (
    msg.includes("prioridade") ||
    msg.includes("priorizar") ||
    msg.includes("quem eu vejo primeiro") ||
    msg.includes("maior risco") ||
    msg.includes("pior paciente") ||
    msg.includes("mais grave") ||
    msg.includes("quem precisa") ||
    msg.includes("urgente") ||
    msg.includes("top") ||
    (msg.includes("maior") && msg.includes("risco")) ||
    msg.includes("pacientes mais críticos") ||
    msg.includes("quais pacientes")
  ) {
    return "PRIORITIZACAO";
  }

  // PACIENTE_ESPECIFICO
  if (
    focusedPatientId ||
    msg.match(/(?:UTI|leito)\s*\d+/i) ||
    mockPatients.some(p => msg.toLowerCase().includes(p.nome.toLowerCase())) ||
    (msg.includes("resumo") && (msg.includes("paciente") || msg.match(/(?:UTI|leito)/i))) ||
    msg.includes("dados do paciente") ||
    msg.includes("informações do paciente") ||
    (msg.includes("esse paciente") || msg.includes("este paciente") || msg.includes("desse paciente") || msg.includes("deste paciente")) ||
    (msg.includes("quadro") && msg.includes("paciente")) ||
    (msg.includes("situação") && msg.includes("paciente")) ||
    (msg.includes("como está") && msg.includes("paciente"))
  ) {
    return "PACIENTE_ESPECIFICO";
  }

  // SINAIS_VITAIS
  if (
    msg.includes("sinais vitais") ||
    msg.includes("sinal vital") ||
    msg.includes("pressão") ||
    msg.includes("temperatura") ||
    msg.includes("frequência cardíaca") ||
    msg.includes("frequência respiratória") ||
    msg.includes("saturação") ||
    msg.includes("pao2") ||
    msg.includes("pao2/fio2") ||
    msg.includes("hemodinâmica") ||
    msg.includes("hemodinamica")
  ) {
    return "SINAIS_VITAIS";
  }

  // BALANCO_HIDRICO
  if (
    msg.includes("balanço hídrico") ||
    msg.includes("balanco hidrico") ||
    msg.includes("balanço") ||
    msg.includes("balanco") ||
    msg.includes("diurese") ||
    msg.includes("diurese") ||
    msg.includes("entrada") ||
    msg.includes("saída") ||
    msg.includes("saida") ||
    msg.includes("líquidos") ||
    msg.includes("liquidos") ||
    msg.includes("volume") ||
    msg.includes("hidratação") ||
    msg.includes("hidratacao")
  ) {
    return "BALANCO_HIDRICO";
  }

  // PERFIL_UNIDADE
  if (
    msg.includes("perfil da unidade") ||
    msg.includes("perfil unidade") ||
    msg.includes("principais doenças") ||
    msg.includes("tipos de doenças") ||
    msg.includes("casuística") ||
    msg.includes("casuistica") ||
    msg.includes("epidemiologia") ||
    msg.includes("germes") ||
    msg.includes("resistência") ||
    msg.includes("resistencia") ||
    msg.includes("antibióticos") ||
    msg.includes("antibioticos") ||
    (msg.includes("últimos") && (msg.includes("meses") || msg.includes("dias"))) ||
    (msg.includes("ultimos") && (msg.includes("meses") || msg.includes("dias")))
  ) {
    return "PERFIL_UNIDADE";
  }

  // CALCULO_CLINICO
  if (
    msg.includes("calcule") ||
    msg.includes("cálculo") ||
    msg.includes("calculo") ||
    msg.includes("dose") ||
    msg.includes("manutenção hídrica") ||
    msg.includes("manutencao hidrica") ||
    msg.includes("função renal") ||
    msg.includes("funcao renal") ||
    msg.includes("clearance") ||
    msg.includes("schwartz") ||
    msg.includes("holliday") ||
    msg.includes("segar") ||
    msg.includes("quantos ml") ||
    msg.includes("quanto de")
  ) {
    return "CALCULO_CLINICO";
  }

  // FALLBACK
  return "FALLBACK";
}

/**
 * Handler para intenção de PRIORITIZACAO
 */
function handlePrioritizationIntent(message: string): { reply: string; topN: number; topPatients: PatientType[] } {
  // Extrair número da mensagem (padrão: 3)
  let topN = 3;
  const match = message.toLowerCase().match(/(\d+)/);
  if (match) {
    const parsed = parseInt(match[1], 10);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 10) {
      topN = parsed;
    }
  }

  const topPatients = getTopPatients(topN);

  const templates = [
    () => {
      return `Após análise dos prontuários eletrônicos e cálculo de risco baseado em instabilidade hemodinâmica, uso de vasopressores, ventilação mecânica, lactato elevado e tendências negativas, identifiquei os ${topN} pacientes mais críticos. Veja os detalhes no painel abaixo.`;
    },
    () => {
      return `Com base na análise de risco de mortalidade em 24h, instabilidade hemodinâmica, uso de drogas vasoativas, ventilação mecânica e parâmetros laboratoriais críticos, selecionei os ${topN} pacientes que requerem atenção imediata. Os detalhes estão no painel de priorização.`;
    },
    () => {
      return `Consulta aos prontuários eletrônicos concluída. ${topN} ${topN === 1 ? "paciente requer" : "pacientes requerem"} atenção imediata baseado em critérios de instabilidade, uso de suporte avançado e parâmetros laboratoriais. Consulte o painel abaixo para detalhes completos.`;
    }
  ];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return { reply: template() + DISCLAIMER, topN, topPatients };
}

/**
 * Handler para intenção de PACIENTE_ESPECIFICO
 */
function handleFocusedPatientIntent(focusedPatientId: string): { reply: string; showIcuPanel: boolean; focusedPatient?: PatientType; selectedPatientId?: string } {
  const p = mockPatients.find((p) => p.id === focusedPatientId);
  if (!p) {
    return { reply: "Não encontrei o paciente selecionado. Tente selecionar novamente." + DISCLAIMER, showIcuPanel: false };
  }

  const risco24 = (p.riscoMortality24h * 100).toFixed(0);
  const risco7 = (p.riscoMortality7d * 100).toFixed(0);
  const riscoLevel = riskLevelFromScore(p.riscoMortality24h);

  const templates = [
    () => {
      return `Resumo clínico do paciente ${p.nome} (leito ${p.leito}): ${p.idade} ${p.idade === 1 ? "ano" : "anos"}, ${p.peso.toFixed(1)} kg, diagnóstico principal ${p.diagnosticoPrincipal}. Risco estimado de mortalidade: ${risco24}% em 24h (${riscoLevel}) e ${risco7}% em 7 dias. ${p.diasDeUTI} ${p.diasDeUTI === 1 ? "dia" : "dias"} de internação na UTI. Consulte o painel abaixo para detalhes completos de sinais vitais, exames laboratoriais, medicações e parâmetros de ventilação.`;
    },
    () => {
      const temVaso = p.medications.some(m => m.tipo === "vasopressor" && m.ativo);
      const temVM = p.ventilationParams !== undefined;
      return `Paciente ${p.nome} (${p.leito}): ${p.idade} ${p.idade === 1 ? "ano" : "anos"}, ${p.diagnosticoPrincipal}. Risco de mortalidade em 24h: ${risco24}% (${riscoLevel}). ${temVM ? "Em ventilação mecânica." : ""} ${temVaso ? "Em uso de droga vasoativa." : ""} Veja o painel abaixo para informações detalhadas sobre sinais vitais, balanço hídrico, medicações e exames.`;
    },
    () => {
      return `Análise clínica do paciente ${p.nome}, leito ${p.leito}: ${p.idade} ${p.idade === 1 ? "ano" : "anos"} de idade, ${p.peso.toFixed(1)} kg, com diagnóstico de ${p.diagnosticoPrincipal}. Risco estimado de ${risco24}% em 24h. ${p.diasDeUTI} ${p.diasDeUTI === 1 ? "dia" : "dias"} de internação. Os detalhes completos estão disponíveis no painel individual abaixo.`;
    }
  ];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return { reply: template() + DISCLAIMER, showIcuPanel: false, focusedPatient: p, selectedPatientId: p.id };
}

/**
 * Handler para intenção de SINAIS_VITAIS
 */
function handleVitalSignsIntent(): { reply: string; showIcuPanel: boolean; showLabPanel?: boolean; topPatients?: PatientType[] } {
  const templates = [
    () => {
      const lines: string[] = [];
      lines.push("Consultando sinais vitais de todos os pacientes no prontuário eletrônico...");
      lines.push("");
      lines.push("**Resumo de sinais vitais críticos:**");
      lines.push("");
      const hipotensos = mockPatients.filter(p => p.vitalSigns.pressaoArterialMedia < 65);
      const taquicardicos = mockPatients.filter(p => p.vitalSigns.frequenciaCardiaca > 150);
      const hipoxemicos = mockPatients.filter(p => p.vitalSigns.saturacaoO2 < 92);
      const febris = mockPatients.filter(p => p.vitalSigns.temperatura >= 38.5);
      lines.push(`• **Hipotensão (MAP < 65 mmHg):** ${hipotensos.length} ${hipotensos.length === 1 ? "paciente" : "pacientes"}`);
      if (hipotensos.length > 0) {
        hipotensos.forEach(p => {
          lines.push(`  - ${p.leito} (${p.nome}): MAP ${p.vitalSigns.pressaoArterialMedia} mmHg`);
        });
      }
      lines.push("");
      lines.push(`• **Taquicardia (> 150 bpm):** ${taquicardicos.length} ${taquicardicos.length === 1 ? "paciente" : "pacientes"}`);
      lines.push(`• **Hipoxemia (SpO2 < 92%):** ${hipoxemicos.length} ${hipoxemicos.length === 1 ? "paciente" : "pacientes"}`);
      lines.push(`• **Febre (≥ 38.5°C):** ${febris.length} ${febris.length === 1 ? "paciente" : "pacientes"}`);
      lines.push("");
      lines.push("Dados obtidos do monitoramento contínuo. Sempre confirme com a avaliação clínica direta.");
      return { text: lines.join("\n"), showLab: false };
    },
    () => {
      const lines: string[] = [];
      lines.push("Analisando sinais vitais dos pacientes em tempo real...");
      lines.push("");
      const top3 = getTopPatients(3);
      lines.push("**Sinais vitais dos 3 pacientes mais críticos:**");
      lines.push("");
      top3.forEach((p, idx) => {
        lines.push(`${idx + 1}. **${p.leito} — ${p.nome}**`);
        lines.push(`   Temp: ${p.vitalSigns.temperatura.toFixed(1)}°C | FC: ${p.vitalSigns.frequenciaCardiaca} bpm | FR: ${p.vitalSigns.frequenciaRespiratoria} rpm`);
        lines.push(`   MAP: ${p.vitalSigns.pressaoArterialMedia} mmHg | SpO2: ${p.vitalSigns.saturacaoO2}%`);
        if (p.ventilationParams) {
          lines.push(`   VM: ${p.ventilationParams.modo}, FiO2 ${p.ventilationParams.fiO2}%, PEEP ${p.ventilationParams.peep} cmH2O`);
        }
        lines.push("");
      });
      return { text: lines.join("\n"), showLab: true, topPatients: top3 };
    },
    () => {
      const lines: string[] = [];
      lines.push("Acessando dados de monitoramento hemodinâmico e respiratório...");
      lines.push("");
      lines.push("**Parâmetros hemodinâmicos e respiratórios:**");
      lines.push("");
      mockPatients.forEach(p => {
        const temVaso = p.medications.some(m => m.tipo === "vasopressor" && m.ativo);
        if (temVaso || p.vitalSigns.pressaoArterialMedia < 65 || p.ventilationParams) {
          lines.push(`**${p.leito} — ${p.nome}:**`);
          lines.push(`• MAP: ${p.vitalSigns.pressaoArterialMedia} mmHg | FC: ${p.vitalSigns.frequenciaCardiaca} bpm`);
          lines.push(`• SpO2: ${p.vitalSigns.saturacaoO2}% | FR: ${p.vitalSigns.frequenciaRespiratoria} rpm`);
          if (p.ventilationParams) {
            lines.push(`• VM: FiO2 ${p.ventilationParams.fiO2}%, PEEP ${p.ventilationParams.peep} cmH2O`);
          }
          lines.push("");
        }
      });
      return { text: lines.join("\n"), showLab: false };
    }
  ];
  const templateIndex = Math.floor(Math.random() * templates.length);
  const templateResult = templateIndex === 1 ? { text: templates[1](), showLab: true, topPatients: getTopPatients(3) } : { text: templates[templateIndex](), showLab: false };
  return { 
    reply: templateResult.text + DISCLAIMER, 
    showIcuPanel: false,
    showLabPanel: templateResult.showLab,
    topPatients: templateResult.topPatients
  };
}

/**
 * Handler para intenção de BALANCO_HIDRICO
 */
function handleFluidBalanceIntent(): { reply: string; showIcuPanel: boolean } {
  const templates = [
    () => {
      const lines: string[] = [];
      lines.push("Consultando balanço hídrico dos pacientes no prontuário eletrônico...");
      lines.push("");
      lines.push("**Resumo de balanço hídrico (últimas 24h):**");
      lines.push("");
      const positivos = mockPatients.filter(p => p.fluidBalance.balanco24h > 3);
      const negativos = mockPatients.filter(p => p.fluidBalance.balanco24h < -1);
      const oliguricos = mockPatients.filter(p => p.fluidBalance.diurese < 1);
      lines.push(`• **Balanço positivo excessivo (> 3 ml/kg/h):** ${positivos.length} ${positivos.length === 1 ? "paciente" : "pacientes"}`);
      if (positivos.length > 0) {
        positivos.forEach(p => {
          lines.push(`  - ${p.leito} (${p.nome}): ${p.fluidBalance.balanco24h.toFixed(1)} ml/kg/h`);
        });
      }
      lines.push("");
      lines.push(`• **Balanço negativo (< -1 ml/kg/h):** ${negativos.length} ${negativos.length === 1 ? "paciente" : "pacientes"}`);
      lines.push(`• **Oligúria (diurese < 1 ml/kg/h):** ${oliguricos.length} ${oliguricos.length === 1 ? "paciente" : "pacientes"}`);
      lines.push("");
      lines.push("**Importante:** Em pediatria, o balanço hídrico deve ser avaliado considerando peso, idade e estado clínico. Valores em ml/kg/h facilitam a comparação entre pacientes de diferentes tamanhos.");
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Analisando balanço hídrico e diurese dos pacientes...");
      lines.push("");
      const top3 = getTopPatients(3);
      lines.push("**Balanço hídrico dos 3 pacientes mais críticos:**");
      lines.push("");
      top3.forEach((p, idx) => {
        lines.push(`${idx + 1}. **${p.leito} — ${p.nome}** (${p.peso.toFixed(1)} kg)`);
        lines.push(`   Entrada 24h: ${p.fluidBalance.entrada24h.toFixed(1)} ml/kg/h (${p.fluidBalance.entradaTotal} ml total)`);
        lines.push(`   Saída 24h: ${p.fluidBalance.saida24h.toFixed(1)} ml/kg/h (${p.fluidBalance.saidaTotal} ml total)`);
        lines.push(`   Balanço: ${p.fluidBalance.balanco24h.toFixed(1)} ml/kg/h (${p.fluidBalance.balancoTotal > 0 ? "+" : ""}${p.fluidBalance.balancoTotal} ml)`);
        lines.push(`   Diurese: ${p.fluidBalance.diurese.toFixed(1)} ml/kg/h`);
        lines.push("");
      });
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Consultando registros de balanço hídrico...");
      lines.push("");
      lines.push("**Balanço hídrico detalhado:**");
      lines.push("");
      mockPatients.forEach(p => {
        if (p.fluidBalance.balanco24h > 2 || p.fluidBalance.diurese < 1.5) {
          lines.push(`**${p.leito} — ${p.nome}:**`);
          lines.push(`• Entrada: ${p.fluidBalance.entrada24h.toFixed(1)} ml/kg/h | Saída: ${p.fluidBalance.saida24h.toFixed(1)} ml/kg/h`);
          lines.push(`• Balanço: ${p.fluidBalance.balanco24h.toFixed(1)} ml/kg/h`);
          lines.push(`• Diurese: ${p.fluidBalance.diurese.toFixed(1)} ml/kg/h`);
          if (p.fluidBalance.balanco24h > 3) {
            lines.push(`  ⚠️ Balanço positivo excessivo — considerar restrição hídrica`);
          }
          if (p.fluidBalance.diurese < 1) {
            lines.push(`  ⚠️ Oligúria — avaliar função renal e estado volêmico`);
          }
          lines.push("");
        }
      });
      return lines.join("\n");
    }
  ];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return { reply: template() + DISCLAIMER, showIcuPanel: false };
}

/**
 * Handler para intenção de PERFIL_UNIDADE
 */
function handleUnitProfileIntent(): { reply: string; showIcuPanel: boolean; showUnitProfilePanel?: boolean } {
  const templates = [
    () => {
      const lines: string[] = [];
      lines.push("Analisando perfil epidemiológico da UTI pediátrica (últimos 30 dias)...");
      lines.push("");
      lines.push("**Casuística da unidade:**");
      lines.push("");
      const total = mockUnitProfile.totalPacientes;
      lines.push(`• **Casos respiratórios (bronquiolite, pneumonia):** ${mockUnitProfile.casuistica.respiratorios}/${total} (${((mockUnitProfile.casuistica.respiratorios/total)*100).toFixed(0)}%)`);
      lines.push(`• **Sepse (diversos focos):** ${mockUnitProfile.casuistica.sepse}/${total} (${((mockUnitProfile.casuistica.sepse/total)*100).toFixed(0)}%)`);
      lines.push(`• **Cardiopatias congênitas:** ${mockUnitProfile.casuistica.cardiopatias}/${total} (${((mockUnitProfile.casuistica.cardiopatias/total)*100).toFixed(0)}%)`);
      lines.push(`• **Trauma:** ${mockUnitProfile.casuistica.trauma}/${total} (${((mockUnitProfile.casuistica.trauma/total)*100).toFixed(0)}%)`);
      lines.push("");
      lines.push("**Sazonalidade:** Observa-se maior incidência de casos respiratórios, compatível com sazonalidade de infecções virais na faixa etária pediátrica.");
      lines.push("");
      lines.push("**Germes mais frequentes:**");
      mockUnitProfile.germesMaisFrequentes.forEach(g => {
        lines.push(`• ${g.nome}: ${g.frequencia} ${g.frequencia === 1 ? "caso" : "casos"}`);
        if (g.resistencia && g.resistencia.length > 0) {
          lines.push(`  Resistência: ${g.resistencia.join(", ")}`);
        }
      });
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Gerando relatório de perfil da unidade baseado em dados dos últimos 30 dias...");
      lines.push("");
      lines.push("**Distribuição por tipo de caso:**");
      lines.push("");
      Object.entries(mockUnitProfile.casuistica).forEach(([cat, count]) => {
        if (count > 0) {
          const categoria = cat.charAt(0).toUpperCase() + cat.slice(1);
          lines.push(`• ${categoria}: ${count} ${count === 1 ? "caso" : "casos"}`);
        }
      });
      lines.push("");
      lines.push("**Perfil de resistência antimicrobiana:**");
      lines.push("");
      mockUnitProfile.perfilResistencia.forEach(p => {
        lines.push(`• ${p.antibiotico}: ${(p.taxaResistencia * 100).toFixed(0)}% de resistência`);
        lines.push(`  Germes: ${p.germes.join(", ")}`);
      });
      lines.push("");
      lines.push("**Observação:** Perfil típico de UTI pediátrica com predominância de casos respiratórios e infecciosos, seguidos de cardiopatias e trauma.");
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Consultando banco de dados epidemiológico da UTI pediátrica...");
      lines.push("");
      lines.push("**Perfil da casuística (últimos 30 dias):**");
      lines.push("");
      lines.push(`Total de pacientes: ${mockUnitProfile.totalPacientes}`);
      lines.push(`Taxa de ocupação: ${(mockUnitProfile.taxaOcupacao * 100).toFixed(0)}%`);
      lines.push("");
      lines.push("**Principais diagnósticos:**");
      mockPatients.forEach((p, idx) => {
        lines.push(`${idx + 1}. ${p.diagnosticoPrincipal} — ${p.idade} ${p.idade === 1 ? "ano" : "anos"}`);
      });
      lines.push("");
      lines.push("**Padrão sazonal:** Maior concentração de casos respiratórios e infecciosos, característico da faixa etária pediátrica e sazonalidade de infecções virais.");
      return lines.join("\n");
    }
  ];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return { reply: template() + DISCLAIMER, showIcuPanel: false, showUnitProfilePanel: true };
}

/**
 * Handler para intenção de CALCULO_CLINICO
 */
function handleClinicalCalculationIntent(message: string, focusedPatientId: string | null): { reply: string; showIcuPanel: boolean; calculationData?: any } {
  const msg = message.toLowerCase();
  const patient = focusedPatientId ? mockPatients.find(p => p.id === focusedPatientId) : null;

  // Detectar tipo de cálculo solicitado
  if (msg.includes("manutenção hídrica") || msg.includes("manutencao hidrica") || msg.includes("holliday") || msg.includes("segar")) {
    // Cálculo de manutenção hídrica
    if (!patient) {
      return {
        reply: "Para calcular a manutenção hídrica, preciso do peso do paciente. Selecione um paciente ou informe o peso." + DISCLAIMER,
        showIcuPanel: false
      };
    }

    try {
      const result = calculateMaintenanceFluids(patient.peso);
      const lines: string[] = [];
      lines.push("**Cálculo de manutenção hídrica pediátrica (regra de Holliday-Segar):**");
      lines.push("");
      lines.push(`**Paciente:** ${patient.nome} (${patient.peso.toFixed(1)} kg)`);
      lines.push("");
      lines.push("**Fórmula:**");
      lines.push("- Primeiros 10 kg: 100 ml/kg/dia");
      lines.push("- 10-20 kg: 1000 ml + 50 ml/kg para cada kg acima de 10");
      lines.push("- > 20 kg: 1500 ml + 20 ml/kg para cada kg acima de 20");
      lines.push("");
      lines.push("**Resultado:**");
      lines.push(`• Manutenção hídrica: **${result.mlPerDay} ml/dia**`);
      lines.push(`• Infusão contínua: **${result.mlPerHour} ml/hora**`);
      lines.push("");
      lines.push("⚠️ **Importante:** Este é um exemplo de cálculo baseado em dados sintéticos. Sempre confirme dose e conduta em protocolo local e com a equipe médica.");

      return {
        reply: lines.join("\n") + DISCLAIMER,
        showIcuPanel: false,
        calculationData: { type: "maintenance_fluids", ...result }
      };
    } catch (error) {
      return {
        reply: "Erro ao calcular manutenção hídrica. Verifique se o peso do paciente está disponível." + DISCLAIMER,
        showIcuPanel: false
      };
    }
  }

  if (msg.includes("função renal") || msg.includes("funcao renal") || msg.includes("clearance") || msg.includes("schwartz") || msg.includes("creatinina")) {
    // Cálculo de Schwartz (clearance de creatinina)
    if (!patient) {
      return {
        reply: "Para calcular o clearance de creatinina (Schwartz), preciso de dados do paciente. Selecione um paciente." + DISCLAIMER,
        showIcuPanel: false
      };
    }

    // Buscar creatinina nos exames laboratoriais
    const creatinina = patient.labResults.find(l => l.tipo === "funcao_renal" || l.nome.toLowerCase().includes("creatinina"));
    const creatininaValue = creatinina && typeof creatinina.valor === "number" ? creatinina.valor : null;

    if (!creatininaValue) {
      return {
        reply: "Não encontrei creatinina sérica nos exames laboratoriais deste paciente. O cálculo de Schwartz requer creatinina sérica (mg/dL)." + DISCLAIMER,
        showIcuPanel: false
      };
    }

    // Estimar altura baseada na idade (aproximação pediátrica)
    // Para cálculo real, precisaríamos da altura real do paciente
    const estimatedHeight = patient.idade < 2 ? 75 + (patient.idade * 10) : 75 + (patient.idade * 6);
    const k = patient.idade >= 13 ? 0.7 : 0.55; // Constante K: 0.55 para crianças, 0.7 para adolescentes

    try {
      const result = calculateSchwartzClCr(estimatedHeight, creatininaValue, k);
      const lines: string[] = [];
      lines.push("**Cálculo de clearance de creatinina (fórmula de Schwartz):**");
      lines.push("");
      lines.push(`**Paciente:** ${patient.nome} (${patient.idade} ${patient.idade === 1 ? "ano" : "anos"})`);
      lines.push(`**Altura estimada:** ${estimatedHeight} cm`);
      lines.push(`**Creatinina sérica:** ${creatininaValue} mg/dL`);
      lines.push(`**Constante K:** ${k} (${patient.idade >= 13 ? "adolescente" : "criança"})`);
      lines.push("");
      lines.push("**Fórmula:** ClCr = (K × altura em cm) / creatinina sérica");
      lines.push("");
      lines.push("**Resultado:**");
      lines.push(`• Clearance de creatinina: **${result.clCrMlMin1_73} ml/min/1.73m²**`);
      lines.push("");
      lines.push("⚠️ **Importante:** Este é um exemplo de cálculo baseado em dados sintéticos. A altura foi estimada. Sempre confirme com dados reais e protocolo local.");

      return {
        reply: lines.join("\n") + DISCLAIMER,
        showIcuPanel: false,
        calculationData: { type: "schwartz", ...result }
      };
    } catch (error) {
      return {
        reply: "Erro ao calcular clearance de creatinina." + DISCLAIMER,
        showIcuPanel: false
      };
    }
  }

  if (msg.includes("dose") && (msg.includes("noradrenalina") || msg.includes("dopamina") || msg.includes("vasopressor") || msg.includes("droga"))) {
    // Cálculo de dose de droga
    if (!patient) {
      return {
        reply: "Para calcular a dose de droga, preciso do peso do paciente e da concentração da solução. Selecione um paciente." + DISCLAIMER,
        showIcuPanel: false
      };
    }

    // Exemplo: calcular dose de noradrenalina
    const doseMcgPerKgPerMin = 0.5; // Exemplo: 0.5 mcg/kg/min
    const concentrationMgPerMl = 0.08; // Exemplo: 0.08 mg/ml (8 mg em 100 ml)

    try {
      const result = calculateDrugDose(patient.peso, doseMcgPerKgPerMin, concentrationMgPerMl);
      const lines: string[] = [];
      lines.push("**Cálculo de dose de droga baseada em peso:**");
      lines.push("");
      lines.push(`**Paciente:** ${patient.nome} (${patient.peso.toFixed(1)} kg)`);
      lines.push(`**Dose prescrita:** ${doseMcgPerKgPerMin} mcg/kg/min`);
      lines.push(`**Concentração da solução:** ${concentrationMgPerMl} mg/ml`);
      lines.push("");
      lines.push("**Fórmula:**");
      lines.push("1. Dose total (mcg/min) = peso (kg) × dose (mcg/kg/min)");
      lines.push("2. Concentração (mcg/ml) = concentração (mg/ml) × 1000");
      lines.push("3. Volume (ml/hora) = (dose total / concentração) × 60");
      lines.push("");
      lines.push("**Resultado:**");
      lines.push(`• Dose total: **${result.doseMcgMin} mcg/min**`);
      lines.push(`• Infusão: **${result.mlPerHour} ml/hora**`);
      lines.push("");
      lines.push("⚠️ **Importante:** Este é um exemplo de cálculo baseado em dados sintéticos. Sempre confirme dose e conduta em protocolo local e com a equipe médica.");

      return {
        reply: lines.join("\n") + DISCLAIMER,
        showIcuPanel: false,
        calculationData: { type: "drug_dose", ...result }
      };
    } catch (error) {
      return {
        reply: "Erro ao calcular dose de droga." + DISCLAIMER,
        showIcuPanel: false
      };
    }
  }

  // Resposta genérica para cálculos
  return {
    reply: (
      "Posso ajudar com cálculos clínicos pediátricos:\n\n" +
      "1. **Manutenção hídrica** (regra de Holliday-Segar)\n" +
      "2. **Clearance de creatinina** (fórmula de Schwartz)\n" +
      "3. **Cálculo de dose de droga** baseada em peso\n\n" +
      "Para calcular, selecione um paciente e pergunte, por exemplo:\n" +
      "• 'Calcule a manutenção hídrica deste paciente'\n" +
      "• 'Qual o clearance de creatinina?'\n" +
      "• 'Calcule a dose de noradrenalina para este peso'" +
      DISCLAIMER
    ),
    showIcuPanel: false
  };
}

/**
 * Handler fallback.
 */
function handleFallbackIntent(): { reply: string; showIcuPanel: boolean } {
  return {
    reply: (
      "Olá! Sou o **Health Copilot +**, um assistente de apoio à decisão para UTI pediátrica.\n\n" +
      "Posso ajudar com:\n\n" +
      "1. **Priorização de pacientes** por risco de mortalidade e instabilidade\n" +
      "2. **Análise de sinais vitais** e parâmetros hemodinâmicos\n" +
      "3. **Balanço hídrico** e diurese (ml/kg/h)\n" +
      "4. **Perfil epidemiológico da unidade** (casuística, germes, resistência)\n" +
      "5. **Resumo completo de um paciente específico**\n" +
      "6. **Cálculos clínicos pediátricos** (manutenção hídrica, Schwartz, doses)\n\n" +
      "Tente perguntas como:\n" +
      "• 'Quais são os 3 pacientes com maior risco?'\n" +
      "• 'Me mostre os sinais vitais críticos'\n" +
      "• 'Qual o balanço hídrico dos pacientes?'\n" +
      "• 'Qual o perfil da unidade?'\n" +
      "• 'Calcule a manutenção hídrica deste paciente'\n" +
      "• 'Resumo do paciente selecionado'" +
      DISCLAIMER
    ),
    showIcuPanel: false
  };
}

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
  const body = (await req.json()) as RequestBody;
    const message = (body.message || "").trim();
  const focusedId = body.focusedPatientId ?? null;

    // Contexto de sessão clínica
    const sessionId = body.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userId = body.userId || "user-mock";
    const role = body.role || "plantonista";
    const unidade = body.unidade || "UTI Pediátrica A";
    const turno = body.turno || "manhã";
    
    // Memória clínica
    const memory = getOrCreateMemory(sessionId);
    if (focusedId !== memory.pacienteAtivo) {
      updateActivePatient(sessionId, focusedId);
    }
    
    // Detectar agente de subespecialidade
    const currentAgent = body.currentAgent || "default";
    const selectedAgent = detectAgent(message, currentAgent);
    const agent = getAgent(selectedAgent);

    if (!message) {
      return NextResponse.json({
        reply: "Por favor, envie uma mensagem." + DISCLAIMER,
        showIcuPanel: false
      });
    }

    // Detectar intenção e usar memória para resolver ambiguidades
    const agentIdFromBody = body.agentId as ClinicalAgentId | undefined;
    const requestPatientId = body.patientId as string | undefined;
    
    let intent = detectIntent(message, focusedId, agentIdFromBody, requestPatientId);
    intent = resolveAmbiguity(sessionId, intent, message) as Intent;
    
    // Adicionar à memória
    addIntentionToHistory(sessionId, intent, focusedId);
    let result: { 
      reply: string; 
      showIcuPanel: boolean; 
      topN?: number; 
      topPatients?: PatientType[]; 
      focusedPatient?: PatientType; 
      calculationData?: any; 
      showLabPanel?: boolean; 
      showUnitProfilePanel?: boolean;
      agentId?: ClinicalAgentId;
      showPatientOverview?: boolean;
      showVitalsPanel?: boolean;
      showLabsPanel?: boolean;
      showTherapiesPanel?: boolean;
      specialistOpinion?: SpecialistOpinion;
    };

    switch (intent) {
      case "PRIORITIZACAO": {
        const prioritizationResult = handlePrioritizationIntent(message);
        result = { ...prioritizationResult, showIcuPanel: true };
        break;
      }
      case "PACIENTE_ESPECIFICO": {
        // Tentar identificar paciente por leito ou nome na mensagem
        let patientId = focusedId;
        if (!patientId) {
          // Buscar por leito (ex: "UTI 03", "leito 03")
          const leitoMatch = message.match(/(?:UTI|leito)\s*(\d+)/i);
          if (leitoMatch) {
            const leitoNum = leitoMatch[1].padStart(2, '0');
            const leitoStr = `UTI ${leitoNum}`;
            const patient = mockPatients.find(p => p.leito === leitoStr);
            if (patient) patientId = patient.id;
          }
          // Se não encontrou por leito, tentar por nome
          if (!patientId) {
            const patient = mockPatients.find(p => 
              message.toLowerCase().includes(p.nome.toLowerCase())
            );
            if (patient) patientId = patient.id;
          }
        }
        
        if (!patientId) {
          result = { reply: "Para obter um resumo de um paciente específico, mencione o leito (ex: 'UTI 03') ou o nome do paciente, ou selecione-o primeiro." + DISCLAIMER, showIcuPanel: false };
  } else {
          const patientResult = handleFocusedPatientIntent(patientId);
          result = { ...patientResult, showIcuPanel: false };
        }
        break;
      }
      case "SINAIS_VITAIS":
        result = handleVitalSignsIntent();
        break;
      case "BALANCO_HIDRICO":
        result = handleFluidBalanceIntent();
        break;
      case "PERFIL_UNIDADE":
        result = handleUnitProfileIntent();
        break;
      case "CALCULO_CLINICO":
        result = handleClinicalCalculationIntent(message, focusedId);
        break;
      case "RADIOLOGISTA_VIRTUAL": {
        const patientIdToUse = requestPatientId || focusedId;
        if (!patientIdToUse) {
          result = { 
            reply: "Para solicitar um parecer radiológico, é necessário selecionar um paciente primeiro." + DISCLAIMER, 
            showIcuPanel: false 
          };
        } else {
          result = handleRadiologyIntent(patientIdToUse);
        }
        break;
      }
      // Removido: case "AGENTE_PARECER" - não existe mais, apenas Plantonista e Radiologista Virtual
      default:
        result = handleFallbackIntent();
    }

    // Opcionalmente melhorar redação com LLM (apenas se GROQ_API_KEY estiver configurada)
    let finalReply = result.reply;
    let llmUtilizado = false;
    
    if (process.env.GROQ_API_KEY && result.reply.length > 100) {
      try {
        const enhanced = await enhanceTextWithLLM({
          systemPrompt: agent.systemPrompt,
          context: `Intenção detectada: ${intent}. Dados do paciente: ${focusedId ? "Paciente focado" : "Consulta geral"}. Agente: ${agent.name}`,
          draftText: result.reply
        });
        finalReply = enhanced;
        llmUtilizado = true;
      } catch (error) {
        // Em caso de erro, usar texto original
        console.warn("LLM enhancement failed, using original text");
      }
    }
    
    // Adicionar transparência e disclaimers
    const transparencyFooter = `\n\n---\n**Health Copilot+ v${VERSION}** | Dados: Simulados | ${llmUtilizado ? `LLM: ${MODEL_VERSION}` : "Processamento determinístico"}`;
    finalReply = finalReply + transparencyFooter;

    // Determinar tipo de resposta
    let tipoResposta: "texto" | "painel" | "calculo" | "misto" = "texto";
    if (result.showIcuPanel || result.showLabPanel || result.showUnitProfilePanel) {
      tipoResposta = result.calculationData ? "misto" : "painel";
    } else if (result.calculationData) {
      tipoResposta = "calculo";
    }

    const duracaoProcessamento = Date.now() - startTime;

    // Log de auditoria
    logClinicalInteraction({
      timestamp: new Date().toISOString(),
      sessionId,
      userId,
      role,
      unidade,
      pacienteFocado: focusedId,
      intencaoDetectada: intent,
      tipoResposta,
      versaoModelo: VERSION,
      llmUtilizado,
      mensagemUsuario: message.substring(0, 100),
      duracaoProcessamento
    });

    // Store de pesquisa
    const dadosExibidos = {
      tipo: result.calculationData ? "calculo" as const :
            result.showIcuPanel ? "paciente" as const :
            result.showLabPanel ? "exames" as const :
            result.showUnitProfilePanel ? "perfil" as const :
            "outro" as const,
      ids: result.topPatients?.map(p => p.id) || (result.focusedPatient ? [result.focusedPatient.id] : undefined),
      quantidade: result.topPatients?.length || (result.focusedPatient ? 1 : undefined)
    };

    storeResearchEntry({
      timestamp: new Date().toISOString(),
      sessionId,
      pergunta: desidentifyText(message),
      intencao: intent,
      dadosExibidos,
      duracaoProcessamento,
      llmUtilizado
    });

    return NextResponse.json({ 
      reply: finalReply, 
      showIcuPanel: result.showIcuPanel, 
      topN: result.topN,
      topPatients: result.topPatients,
      focusedPatient: result.focusedPatient,
      showLabPanel: result.showLabPanel,
      showUnitProfilePanel: result.showUnitProfilePanel,
      intent: intent,
      agent: selectedAgent,
      agentName: agent.name,
      agentId: result.agentId,
      showPatientOverview: result.showPatientOverview,
      showVitalsPanel: result.showVitalsPanel,
      showLabsPanel: result.showLabsPanel,
      showTherapiesPanel: result.showTherapiesPanel,
      specialistOpinion: result.specialistOpinion
    });
  } catch (error) {
    return NextResponse.json(
      {
        reply: "Tive um problema temporário ao processar sua pergunta. Tente novamente em instantes." + DISCLAIMER,
        showIcuPanel: false
      },
      { status: 500 }
    );
  }
}
