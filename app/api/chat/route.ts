import { NextResponse } from "next/server";
import {
  mockPatients,
  riskLevelFromScore,
  getSortedByMortalityRisk24h,
  getTopUnstablePatients,
  getPossibleNonRespondersToTherapy,
  type Patient
} from "@/lib/mockData";

interface RequestBody {
  message: string;
  focusedPatientId?: string | null;
}

const DISCLAIMER =
  "\n\n⚠️ **Lembrete importante**: Este é um protótipo com dados completamente fictícios. As informações apresentadas são apenas para demonstração de fluxo e UX. Não substitui o julgamento clínico e não deve ser usado para decisões reais.";

/**
 * Handler para intenção de priorização de pacientes.
 */
function handlePrioritizationIntent(): string {
  const sorted = getSortedByMortalityRisk24h();
  const top3 = sorted.slice(0, 3);

  const lines: string[] = [];
  lines.push(
    "Com base nos dados mockados de risco de mortalidade em 24h, instabilidade hemodinâmica e resposta às terapias em curso, esta seria uma possível priorização de avaliação à beira-leito:"
  );
  lines.push("");

  top3.forEach((p, idx) => {
    const risco24 = (p.riscoMortality24h * 100).toFixed(0);
    const riscoLevel = riskLevelFromScore(p.riscoMortality24h);
    const detalhes: string[] = [];

    if (p.emVasopressor) detalhes.push("em vasopressor");
    if (p.emVentilacaoMecanica) detalhes.push("em ventilação mecânica");
    detalhes.push(`SOFA ${p.sofa}`);
    detalhes.push(
      `lactato ${p.lactato.toFixed(1)} mmol/L (tendência: ${p.tendenciaLactato})`
    );
    if (p.mapaPressaoMedia < 65) {
      detalhes.push(`MAP ${p.mapaPressaoMedia} mmHg (hipotensão)`);
    }

    lines.push(
      `${idx + 1}. **${p.leito} • ${p.nome}** (${p.idade} anos) — risco ${riscoLevel} (${risco24}% em 24h)`
    );
    lines.push(`   Diagnóstico: ${p.diagnosticoPrincipal}`);
    lines.push(`   ${detalhes.join(" • ")}`);
    if (p.emAntibiotico) {
      lines.push(
        `   Em antibiótico há ${p.diasEmAntibioticoAtual} ${p.diasEmAntibioticoAtual === 1 ? "dia" : "dias"} (D${p.diasEmAntibioticoAtual})`
      );
    }
    lines.push("");
  });

  lines.push(
    "Esta é apenas uma visão de apoio, baseada em parâmetros objetivos. A decisão final de priorização deve sempre ser clínica e individualizada."
  );

  return lines.join("\n") + DISCLAIMER;
}

/**
 * Handler para intenção de resumo de paciente específico.
 */
function handleFocusedPatientIntent(focusedPatientId: string): string {
  const p = mockPatients.find((p) => p.id === focusedPatientId);
  if (!p) {
    return (
      "Não encontrei o paciente focado no momento. Tente selecionar novamente na lista da esquerda." +
      DISCLAIMER
    );
  }

  const risco24 = (p.riscoMortality24h * 100).toFixed(0);
  const risco7 = (p.riscoMortality7d * 100).toFixed(0);
  const riscoLevel = riskLevelFromScore(p.riscoMortality24h);

  const linhas: string[] = [];
  linhas.push(`**Resumo orientado por risco para ${p.nome}, leito ${p.leito}:**`);
  linhas.push("");

  // Informações principais
  linhas.push(`**Diagnóstico principal:** ${p.diagnosticoPrincipal}`);
  linhas.push(
    `**Risco estimado:** ${risco24}% em 24h (${riscoLevel}) • ${risco7}% em 7 dias`
  );
  linhas.push(`**Dias de UTI:** ${p.diasDeUTI} ${p.diasDeUTI === 1 ? "dia" : "dias"}`);
  linhas.push("");

  // Parâmetros relevantes
  linhas.push("**Parâmetros atuais:**");
  linhas.push(`• SOFA: ${p.sofa}`);
  linhas.push(
    `• Lactato: ${p.lactato.toFixed(1)} mmol/L (tendência: ${p.tendenciaLactato})`
  );
  linhas.push(`• Pressão arterial média (MAP): ${p.mapaPressaoMedia} mmHg`);
  linhas.push(`• Temperatura: ${p.temperatura.toFixed(1)}°C`);
  linhas.push(
    `• ${p.emVasopressor ? "Em uso de vasopressor" : "Sem vasopressor no momento"}`
  );
  linhas.push(
    `• ${p.emVentilacaoMecanica ? "Em ventilação mecânica" : "Sem ventilação mecânica"}`
  );
  if (p.emAntibiotico) {
  linhas.push(
      `• Em antibiótico há ${p.diasEmAntibioticoAtual} ${p.diasEmAntibioticoAtual === 1 ? "dia" : "dias"} (D${p.diasEmAntibioticoAtual})`
    );
  }
  linhas.push("");

  // Pontos de atenção
  linhas.push("**Principais pontos de atenção:**");
  p.tags.forEach((t) => {
    linhas.push(`• ${t}`);
  });

  // Alertas específicos
  const alertas: string[] = [];
  if (p.tendenciaLactato === "subindo" && p.lactato >= 3) {
    alertas.push("Lactato em ascensão com valor elevado");
  }
  if (p.mapaPressaoMedia < 65) {
    alertas.push("Hipotensão (MAP < 65 mmHg)");
  }
  if (p.emAntibiotico && p.diasEmAntibioticoAtual >= 2 && p.temperatura >= 38) {
    alertas.push("Febre persistente após início de antibiótico");
  }
  if (p.responseToTherapyScore < 0.5) {
    alertas.push("Resposta à terapia abaixo do esperado");
  }

  if (alertas.length > 0) {
    linhas.push("");
    linhas.push("**Alertas:**");
    alertas.forEach((a) => linhas.push(`⚠️ ${a}`));
  }

  linhas.push("");
  linhas.push(
    "Use essas informações como apoio para organizar sua avaliação, sempre integrando exame físico, contexto clínico e protocolos do serviço."
  );

  return linhas.join("\n") + DISCLAIMER;
}

/**
 * Handler para intenção de identificar pacientes sem resposta à terapia.
 */
function handleNonResponseIntent(): string {
  const nonResponders = getPossibleNonRespondersToTherapy();

  const linhas: string[] = [];
  linhas.push(
    "Pacientes que podem não estar respondendo adequadamente à terapia atual (critérios mockados: em antibiótico há ≥2 dias E [lactato subindo OU febre ≥38°C]):"
  );
  linhas.push("");

  if (nonResponders.length === 0) {
    linhas.push(
      "Nenhum paciente atende aos critérios mockados de possível não resposta no momento."
    );
  } else {
    nonResponders.forEach((p) => {
      const risco24 = (p.riscoMortality24h * 100).toFixed(0);
      linhas.push(`**${p.leito} • ${p.nome}** (${p.idade} anos)`);
      linhas.push(`• Diagnóstico: ${p.diagnosticoPrincipal}`);
      linhas.push(
        `• Risco 24h: ${risco24}% • SOFA ${p.sofa} • Lactato ${p.lactato.toFixed(1)} mmol/L (${p.tendenciaLactato})`
      );
      linhas.push(
        `• Em antibiótico há ${p.diasEmAntibioticoAtual} ${p.diasEmAntibioticoAtual === 1 ? "dia" : "dias"} (D${p.diasEmAntibioticoAtual})`
      );
      linhas.push(`• Temperatura: ${p.temperatura.toFixed(1)}°C`);
      if (p.responseToTherapyScore < 0.5) {
        linhas.push(`• Score de resposta à terapia: ${(p.responseToTherapyScore * 100).toFixed(0)}% (baixo)`);
      }
      linhas.push("");
    });

    linhas.push(
      "Recomendo reavaliação clínica desses pacientes, considerando possível ajuste de esquema antimicrobiano, investigação de foco não controlado ou complicações adicionais."
    );
  }

  return linhas.join("\n") + DISCLAIMER;
}

/**
 * Handler para intenção de visão geral/estado global da UTI.
 */
function handleGlobalStatusIntent(): string {
  const total = mockPatients.length;
  const emVM = mockPatients.filter((p) => p.emVentilacaoMecanica).length;
  const emVaso = mockPatients.filter((p) => p.emVasopressor).length;
  const riscoAlto24h = mockPatients.filter(
    (p) => riskLevelFromScore(p.riscoMortality24h) === "alto"
  ).length;
  const emAntibiotico = mockPatients.filter((p) => p.emAntibiotico).length;
  const lactatoSubindo = mockPatients.filter(
    (p) => p.tendenciaLactato === "subindo"
  ).length;
  const instaveis = getTopUnstablePatients(3);

  const linhas: string[] = [];
  linhas.push("**Visão geral da UTI (dados mockados):**");
  linhas.push("");
  linhas.push(`• Total de pacientes: ${total}`);
  linhas.push(`• Em ventilação mecânica: ${emVM}`);
  linhas.push(`• Em vasopressor: ${emVaso}`);
  linhas.push(`• Com risco alto em 24h: ${riscoAlto24h}`);
  linhas.push(`• Em antibiótico: ${emAntibiotico}`);
  linhas.push(`• Com lactato em ascensão: ${lactatoSubindo}`);
  linhas.push("");

  if (instaveis.length > 0) {
    linhas.push("**Pacientes mais instáveis no momento:**");
    instaveis.forEach((p, idx) => {
      const risco24 = (p.riscoMortality24h * 100).toFixed(0);
      linhas.push(
        `${idx + 1}. ${p.leito} • ${p.nome} — risco ${risco24}% • SOFA ${p.sofa} • ${p.emVasopressor ? "vasopressor" : ""} ${p.tendenciaLactato === "subindo" ? "• lactato subindo" : ""}`
      );
    });
    linhas.push("");
  }

  linhas.push(
    "Esta visão geral ajuda a organizar a rotina, mas a avaliação individual de cada paciente à beira-leito é fundamental."
  );

  return linhas.join("\n") + DISCLAIMER;
}

/**
 * Handler fallback para intenções não reconhecidas.
 */
function handleFallbackIntent(): string {
  return (
    "Sou um agent mockado focado em quatro tarefas principais:\n\n" +
    "1. **Priorizar pacientes** por risco de mortalidade em 24h\n" +
    "2. **Resumir o quadro** de um paciente específico (selecione na lista)\n" +
    "3. **Identificar pacientes** possivelmente sem resposta à terapia\n" +
    "4. **Fornecer visão geral** da situação da UTI\n\n" +
    "Tente perguntas como:\n" +
    "• 'Quais são os 3 pacientes com maior risco de mortalidade em 24h?'\n" +
    "• 'Quem não está respondendo à terapia?'\n" +
    "• 'Como está a situação da UTI?'\n" +
    "• Selecione um paciente e pergunte: 'Me dê um resumo desse paciente'" +
    DISCLAIMER
  );
}

/**
 * Detecta a intenção do usuário baseado na mensagem e contexto.
 */
function detectIntent(
  message: string,
  focusedPatientId: string | null
): "prioritization" | "focused_patient" | "non_response" | "global_status" | "fallback" {
  const msg = message.toLowerCase();

  // Se há paciente focado e a mensagem menciona o paciente
  if (
    focusedPatientId &&
    (msg.includes("esse paciente") ||
      msg.includes("este paciente") ||
      msg.includes("desse paciente") ||
      msg.includes("deste paciente") ||
      msg.includes("resumo") ||
      msg.includes("quadro") ||
      msg.includes("situação") ||
      msg.includes("como está"))
  ) {
    return "focused_patient";
  }

  // Priorização
  if (
    msg.includes("prioridade") ||
    msg.includes("priorizar") ||
    msg.includes("quem eu vejo primeiro") ||
    msg.includes("maior risco") ||
    msg.includes("top") ||
    msg.includes("pior paciente") ||
    msg.includes("quem precisa") ||
    msg.includes("urgente")
  ) {
    return "prioritization";
  }

  // Não resposta à terapia
  if (
    msg.includes("não responde") ||
    msg.includes("sem resposta") ||
    msg.includes("resposta à prescrição") ||
    msg.includes("resposta à terapia") ||
    msg.includes("não está respondendo") ||
    msg.includes("antibiótico") ||
    msg.includes("antibiotico") ||
    (msg.includes("vasopressor") && (msg.includes("aumento") || msg.includes("subindo")))
  ) {
    return "non_response";
  }

  // Estado global da UTI
  if (
    msg.includes("situação da uti") ||
    msg.includes("como está a uti") ||
    msg.includes("visão geral") ||
    msg.includes("panorama") ||
    msg.includes("resumo da uti") ||
    msg.includes("estado geral") ||
    msg.includes("overview") ||
    msg.includes("status geral")
  ) {
    return "global_status";
  }

  // Se há paciente focado mas não detectou outra intenção, assume foco no paciente
  if (focusedPatientId) {
    return "focused_patient";
  }

  return "fallback";
}

export async function POST(req: Request) {
  try {
  const body = (await req.json()) as RequestBody;
    const message = (body.message || "").trim();
  const focusedId = body.focusedPatientId ?? null;

    if (!message) {
      return NextResponse.json({
        reply: "Por favor, envie uma mensagem." + DISCLAIMER
      });
    }

    const intent = detectIntent(message, focusedId);
  let reply: string;

    switch (intent) {
      case "prioritization":
        reply = handlePrioritizationIntent();
        break;
      case "focused_patient":
        if (!focusedId) {
    reply =
            "Para obter um resumo de um paciente específico, selecione-o primeiro na lista à esquerda." +
            DISCLAIMER;
  } else {
          reply = handleFocusedPatientIntent(focusedId);
        }
        break;
      case "non_response":
        reply = handleNonResponseIntent();
        break;
      case "global_status":
        reply = handleGlobalStatusIntent();
        break;
      default:
        reply = handleFallbackIntent();
  }

  return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      {
        reply:
          "Tive um problema temporário ao processar sua pergunta. Tente novamente em instantes." +
          DISCLAIMER
      },
      { status: 500 }
    );
  }
}
