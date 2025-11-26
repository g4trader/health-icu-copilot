import { NextResponse } from "next/server";
import { mockPatients, riskLevelFromScore } from "@/lib/mockData";

interface RequestBody {
  message: string;
  focusedPatientId?: string | null;
}

function buildPrioritizationReply(): string {
  const sorted = [...mockPatients].sort(
    (a, b) => b.riscoMortality24h - a.riscoMortality24h
  );

  const lines: string[] = [];
  lines.push(
    "Com base nos dados mockados de risco de mortalidade em 24h, instabilidade hemodinâmica e resposta às terapias em curso, esta seria uma possível priorização de avaliação à beira-leito:"
  );
  lines.push("");

  sorted.slice(0, 5).forEach((p, idx) => {
    const risco24 = (p.riscoMortality24h * 100).toFixed(0);
    const riscoLevel = riskLevelFromScore(p.riscoMortality24h);
    const detalhes: string[] = [];
    if (p.emVasopressor) detalhes.push("em vasopressor");
    if (p.emVentilacaoMecanica) detalhes.push("em ventilação mecânica");
    if (p.lactato >= 3) detalhes.push(`lactato ${p.lactato.toFixed(1)} mmol/L`);
    detalhes.push(`SOFA ${p.sofa}`);

    lines.push(
      `${idx + 1}. ${p.leito} • ${p.nome} (${p.idade} anos) — risco ${riscoLevel} (${risco24}%) • ${p.diagnosticoPrincipal}. ${detalhes.join(
        " • "
      )}.`
    );
  });

  lines.push("");
  lines.push(
    "Lembrando: esta é apenas uma visão de apoio, baseada em parâmetros objetivos. A decisão final de priorização deve sempre ser clínica e individualizada."
  );

  return lines.join("\n");
}

function buildFocusedPatientReply(id: string): string {
  const p = mockPatients.find((p) => p.id === id);
  if (!p) {
    return "Não encontrei o paciente focado no momento. Tente selecionar novamente na lista da esquerda.";
  }

  const risco24 = (p.riscoMortality24h * 100).toFixed(0);
  const risco7 = (p.riscoMortality7d * 100).toFixed(0);
  const riscoLevel = riskLevelFromScore(p.riscoMortality24h);

  const linhas: string[] = [];
  linhas.push(
    `Resumo orientado por risco para ${p.nome}, leito ${p.leito}:`
  );
  linhas.push("");
  linhas.push(
    `• Diagnóstico principal: ${p.diagnosticoPrincipal}.`
  );
  linhas.push(
    `• Risco estimado de mortalidade em 24h: ${risco24}% (faixa ${riscoLevel}).`
  );
  linhas.push(
    `• Risco estimado em 7 dias: ${risco7}%.`
  );
  linhas.push(
    `• SOFA atual ${p.sofa}, lactato ${p.lactato.toFixed(
      1
    )} mmol/L, ${
      p.emVasopressor ? "em uso de vasopressor" : "sem vasopressor no momento"
    } e ${
      p.emVentilacaoMecanica
        ? "em ventilação mecânica"
        : "sem ventilação mecânica"
    }.`
  );
  linhas.push("");
  linhas.push(
    "Principais pontos de atenção considerados pelo agent mockado:"
  );
  p.tags.forEach((t) => {
    linhas.push(`• ${t}`);
  });
  linhas.push("");
  linhas.push(
    "Use essas informações como apoio para organizar sua avaliação, sempre integrando exame físico, contexto clínico e protocolos do serviço."
  );

  return linhas.join("\n");
}

export async function POST(req: Request) {
  const body = (await req.json()) as RequestBody;
  const message = (body.message || "").toLowerCase();
  const focusedId = body.focusedPatientId ?? null;

  let reply: string;

  if (
    message.includes("prioridade") ||
    message.includes("priorizar") ||
    message.includes("quem eu vejo primeiro") ||
    message.includes("maior risco") ||
    message.includes("top") ||
    message.includes("pior paciente")
  ) {
    reply = buildPrioritizationReply();
  } else if (focusedId) {
    reply = buildFocusedPatientReply(focusedId);
  } else if (
    message.includes("não responde") ||
    message.includes("sem resposta") ||
    message.includes("resposta à prescrição") ||
    message.includes("antibiótico") ||
    message.includes("vasopressor")
  ) {
    reply =
      "Neste mock, pacientes com score de resposta à terapia mais baixo são considerados como possível não resposta adequada. Recomendo priorizar a reavaliação de pacientes com lactato em ascensão, febre persistente e aumento de necessidade de vasopressor em relação às 6–12h anteriores.";
  } else {
    reply =
      "Sou um agent mockado focado em três tarefas principais: priorizar pacientes por risco, resumir o quadro de um paciente específico e sinalizar possível não resposta às terapias atuais. Tente algo como: 'Quais são os 3 pacientes com maior risco de mortalidade em 24h?' ou selecione um paciente na lista e pergunte 'Me dê um resumo orientado por risco desse paciente'.";
  }

  return NextResponse.json({ reply });
}
