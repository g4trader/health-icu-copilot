import type { Patient } from "@/types/Patient";
import type { UnitProfile } from "@/types/UnitProfile";
import type { DailyPatientStatus } from "@/types/DailyPatientStatus";
import type { LlmPatientAnswer, TimelineHighlight } from "@/types/LlmPatientAnswer";
import type { PatientFocusPayload } from "@/types/PatientFocusPayload";
import type { MicroDashboard } from "@/types/MicroDashboardV2";
import { buildPatientFocusPayload } from "./mockData";
import { buildAllDashboards } from "./microDashboardBuildersV2";
import { getDailyStatus } from "./patientTimeline";
import { enhanceTextWithLLM } from "./llmClient";

/**
 * Constrói prompt do sistema para o LLM "plantonista"
 */
export function buildSystemPromptForPlantonista(): string {
  return `Você é um assistente clínico especializado em UTI Pediátrica. Sua função é analisar dados de pacientes e fornecer respostas estruturadas em português brasileiro.

INSTRUÇÕES:
1. Sempre forneça uma resposta em texto livre (plainTextAnswer) em formato de parágrafo clínico.
2. Quando a pergunta for sobre um paciente específico, preencha o focusSummary com os dados estruturados.
3. Escolha 2-3 microDashboards relevantes baseados na pergunta do usuário.
4. Quando a pergunta for sobre evolução ("melhorou?", "quando piorou?"), inclua timelineHighlights.

FORMATO DE RESPOSTA (JSON):
{
  "focusSummary": {
    "patientId": "string",
    "nome": "string",
    "idade": number,
    "peso": number,
    "leito": "string",
    "diagnosticoPrincipal": "string",
    "riskLevel": "alto" | "moderado" | "baixo",
    "riskPercent24h": number,
    "hasVM": boolean,
    "hasVaso": boolean,
    "lactatoValue": number (opcional),
    "lactatoTrend": "subindo" | "estavel" | "caindo" (opcional),
    "keyFindings": ["string"],
    "narrativaAgente": "string (parágrafo clínico)"
  },
  "microDashboards": [
    {
      "tipo": "status_global" | "respiratorio" | "hemodinamico" | "labs_criticos" | "infeccao_antibiotico",
      "titulo": "string",
      "subtitulo": "string (opcional)",
      "riskLevel": "alto" | "moderado" | "baixo" (opcional),
      "riskPercent24h": number (opcional),
      "blocks": [
        {
          "titulo": "string",
          "tipo": "lista" | "kpi" | "trend",
          "itens": ["string"]
        }
      ]
    }
  ],
  "timelineHighlights": [
    {
      "diaUti": number,
      "data": "ISO string",
      "titulo": "string",
      "descricao": "string",
      "relevancia": "alta" | "media" | "baixa"
    }
  ],
  "plainTextAnswer": "string (parágrafo clínico em português)"
}

IMPORTANTE:
- Use linguagem médica apropriada
- Seja objetivo e focado em decisão clínica
- Sempre inclua plainTextAnswer mesmo quando fornecer dados estruturados`;
}

/**
 * Constrói mensagem do usuário com contexto do paciente
 */
export function buildUserMessageForPatient(
  patient: Patient,
  dailyEvolution: DailyPatientStatus[],
  unitProfile: UnitProfile | null,
  userQuestion: string
): string {
  const lines: string[] = [];
  
  lines.push(`PERGUNTA DO USUÁRIO: ${userQuestion}`);
  lines.push("");
  lines.push("DADOS DO PACIENTE:");
  lines.push(JSON.stringify({
    id: patient.id,
    nome: patient.nome,
    idade: patient.idade,
    peso: patient.peso,
    leito: patient.leito,
    diagnosticoPrincipal: patient.diagnosticoPrincipal,
    diasDeUTI: patient.diasDeUTI,
    riscoMortality24h: patient.riscoMortality24h,
    riscoMortality7d: patient.riscoMortality7d,
    vitalSigns: patient.vitalSigns,
    fluidBalance: patient.fluidBalance,
    medications: patient.medications.filter(m => m.ativo),
    ventilationParams: patient.ventilationParams,
    labResults: patient.labResults.filter(l => l.critico || l.tipo === "lactato" || l.tipo === "pcr")
  }, null, 2));
  
  lines.push("");
  lines.push("EVOLUÇÃO DOS ÚLTIMOS 30 DIAS:");
  lines.push(JSON.stringify(dailyEvolution.slice(-7), null, 2)); // Últimos 7 dias
  
  if (unitProfile) {
    lines.push("");
    lines.push("PERFIL DA UNIDADE:");
    lines.push(JSON.stringify({
      totalPacientes: unitProfile.totalPacientes,
      taxaOcupacao: unitProfile.taxaOcupacao,
      casuistica: unitProfile.casuistica
    }, null, 2));
  }
  
  lines.push("");
  lines.push("Analise os dados acima e forneça uma resposta estruturada conforme o formato especificado no system prompt.");
  
  return lines.join("\n");
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
 * Chama LLM e retorna resposta estruturada
 */
export async function getLlmPatientAnswer(
  patient: Patient,
  dailyEvolution: DailyPatientStatus[],
  unitProfile: UnitProfile | null,
  userQuestion: string
): Promise<LlmPatientAnswer> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    // Sem API key: retornar resposta determinística
    const focusPayload = buildPatientFocusPayload(patient);
    const dashboards = buildAllDashboards(patient);
    
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
    const systemPrompt = buildSystemPromptForPlantonista();
    const userMessage = buildUserMessageForPatient(patient, dailyEvolution, unitProfile, userQuestion);
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }
    
    const data = await response.json();
    const llmResponse = data.choices?.[0]?.message?.content;
    
    if (!llmResponse) {
      throw new Error("Empty LLM response");
    }
    
    return parseLlmResponse(llmResponse, patient);
  } catch (error) {
    console.warn("Error calling LLM, using fallback:", error);
    
    // Fallback: resposta determinística
    const focusPayload = buildPatientFocusPayload(patient);
    const dashboards = buildAllDashboards(patient);
    
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

