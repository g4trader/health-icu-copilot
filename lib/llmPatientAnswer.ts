import type { Patient } from "@/types/Patient";
import type { UnitProfile } from "@/types/UnitProfile";
import type { DailyPatientStatus } from "@/types/DailyPatientStatus";
import type { LlmPatientAnswer, TimelineHighlight } from "@/types/LlmPatientAnswer";
import type { PatientFocusPayload } from "@/types/PatientFocusPayload";
import type { MicroDashboard } from "@/types/MicroDashboardV2";
import type { RadiologyReportSummary } from "@/types/RadiologyOpinion";
import { buildPatientFocusPayload } from "./mockData";
import { buildAllDashboards } from "./microDashboardBuildersV2";
import { getDailyStatus } from "./patientTimeline";
import { enhanceTextWithLLM } from "./llmClient";
import { buildPlantonistaMessages, PLANTONISTA_SYSTEM_PROMPT } from "./specialistOpinions";

/**
 * Constrói prompt do sistema para o LLM "plantonista"
 * Usa o prompt oficial do Plantonista UTI Pediátrica
 */
export function buildSystemPromptForPlantonista(): string {
  return PLANTONISTA_SYSTEM_PROMPT;
}

/**
 * Constrói mensagem do usuário com contexto do paciente
 * Agora usa buildPlantonistaMessages para consistência
 */
export function buildUserMessageForPatient(
  patient: Patient,
  dailyEvolution: DailyPatientStatus[],
  unitProfile: UnitProfile | null,
  userQuestion: string,
  radiologyReports?: RadiologyReportSummary[] | null
): string {
  const messages = buildPlantonistaMessages({
    question: userQuestion,
    patient,
    dailyStatus: dailyEvolution,
    unitProfile,
    radiologyReports
  });
  
  return messages[1].content; // Retorna apenas o conteúdo da mensagem do usuário
}

/**
 * Parseia resposta do LLM em LlmPatientAnswer
 * Se falhar, retorna resposta básica com plainTextAnswer
 */
export function parseLlmResponse(llmResponse: string, patient: Patient): LlmPatientAnswer {
  try {
    // Tentar extrair JSON da resposta
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validar estrutura básica
      if (parsed.plainTextAnswer) {
        return {
          focusSummary: parsed.focusSummary || buildPatientFocusPayload(patient),
          microDashboards: parsed.microDashboards || [],
          timelineHighlights: parsed.timelineHighlights || [],
          plainTextAnswer: parsed.plainTextAnswer
        };
      }
    }
  } catch (error) {
    console.warn("Error parsing LLM response:", error);
  }
  
  // Fallback: retornar resposta básica
  const focusPayload = buildPatientFocusPayload(patient);
  focusPayload.narrativaAgente = llmResponse;
  
  return {
    focusSummary: focusPayload,
    microDashboards: buildAllDashboards(patient).slice(0, 2), // 2 dashboards por padrão
    timelineHighlights: [],
    plainTextAnswer: llmResponse
  };
}

/**
 * Chama o agente Plantonista e retorna resposta estruturada
 */
export async function callPlantonistaAgent(args: {
  question: string;
  patient?: Patient | null;
  dailyStatus?: DailyPatientStatus[] | null;
  unitProfile?: UnitProfile | null;
  radiologyReports?: RadiologyReportSummary[] | null;
}): Promise<LlmPatientAnswer> {
  const { question, patient, dailyStatus, unitProfile, radiologyReports } = args;
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    // Sem API key: retornar resposta determinística
    if (!patient) {
      return {
        focusSummary: undefined,
        microDashboards: [],
        timelineHighlights: [],
        plainTextAnswer: "Para fornecer uma análise clínica, é necessário selecionar um paciente."
      };
    }
    
    const focusPayload = buildPatientFocusPayload(patient);
    const dashboards = buildAllDashboards(patient, radiologyReports || undefined);
    
    // Gerar narrativa básica
    const riskPercent = Math.round(patient.riscoMortality24h * 100);
    const hasVM = !!patient.ventilationParams;
    const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
    
    let narrativa = `Paciente ${patient.nome} (${patient.idade} anos, ${patient.peso.toFixed(1)} kg), leito ${patient.leito}, com diagnóstico principal de ${patient.diagnosticoPrincipal}. `;
    narrativa += `Risco de mortalidade em 24h: ${riskPercent}%. `;
    if (hasVM) narrativa += "Em ventilação mecânica. ";
    if (hasVaso) narrativa += "Em uso de drogas vasoativas. ";
    narrativa += "Recomenda-se monitorização próxima e reavaliação periódica do quadro clínico.";
    
    focusPayload.narrativaAgente = narrativa;
    
    return {
      focusSummary: focusPayload,
      microDashboards: dashboards.slice(0, 2),
      timelineHighlights: [],
      plainTextAnswer: narrativa
    };
  }
  
  try {
    const messages = buildPlantonistaMessages({ question, patient, dailyStatus, unitProfile, radiologyReports });
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty LLM response");
    }
    
    // Parsear resposta
    let parsed: LlmPatientAnswer;
    try {
      parsed = JSON.parse(content) as LlmPatientAnswer;
    } catch (e) {
      // Fallback: wrap whatever came back as plain text
      parsed = {
        focusSummary: patient ? buildPatientFocusPayload(patient) : undefined,
        microDashboards: [],
        timelineHighlights: [],
        plainTextAnswer: content,
      };
    }
    
    // Garantir que plainTextAnswer está presente
    if (!parsed.plainTextAnswer) {
      parsed.plainTextAnswer = "[Erro ao interpretar resposta do modelo.]";
    }
    
    // Garantir que focusSummary está preenchido se paciente disponível
    if (patient && !parsed.focusSummary) {
      parsed.focusSummary = buildPatientFocusPayload(patient);
    }
    
    return parsed;
  } catch (error) {
    console.warn("Error calling Plantonista agent, using fallback:", error);
    
    // Fallback: resposta determinística
    if (!patient) {
      return {
        focusSummary: undefined,
        microDashboards: [],
        timelineHighlights: [],
        plainTextAnswer: "Erro ao processar a pergunta. Tente novamente."
      };
    }
    
    const focusPayload = buildPatientFocusPayload(patient);
    const dashboards = buildAllDashboards(patient, radiologyReports || undefined);
    
    const riskPercent = Math.round(patient.riscoMortality24h * 100);
    const narrativa = `Paciente ${patient.nome} (${patient.idade} anos), leito ${patient.leito}, com ${patient.diagnosticoPrincipal}. Risco de mortalidade em 24h: ${riskPercent}%. Veja os dashboards abaixo para detalhes.`;
    
    focusPayload.narrativaAgente = narrativa;
    
    return {
      focusSummary: focusPayload,
      microDashboards: dashboards.slice(0, 2),
      timelineHighlights: [],
      plainTextAnswer: narrativa
    };
  }
}

/**
 * Chama LLM e retorna resposta estruturada (função de compatibilidade)
 */
export async function getLlmPatientAnswer(
  patient: Patient,
  dailyEvolution: DailyPatientStatus[],
  unitProfile: UnitProfile | null,
  userQuestion: string,
  radiologyReports?: RadiologyReportSummary[] | null
): Promise<LlmPatientAnswer> {
  return callPlantonistaAgent({
    question: userQuestion,
    patient,
    dailyStatus: dailyEvolution,
    unitProfile,
    radiologyReports
  });
}

