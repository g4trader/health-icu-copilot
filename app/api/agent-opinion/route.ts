import { NextRequest, NextResponse } from "next/server";
import { mockPatients } from "@/lib/mockData";
import { buildAgentOpinion, getClinicalAgent, type ClinicalAgentId } from "@/lib/clinicalAgents";

interface RequestBody {
  patientId: string;
  agentId: ClinicalAgentId;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { patientId, agentId } = body;

    if (!patientId || !agentId) {
      return NextResponse.json(
        { error: "patientId e agentId são obrigatórios" },
        { status: 400 }
      );
    }

    const patient = mockPatients.find(p => p.id === patientId);
    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    const agent = getClinicalAgent(agentId);
    const opinion = buildAgentOpinion(patient, agentId);

    // Montar texto do parecer
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

    return NextResponse.json({
      text: lines.join("\n"),
      agentId,
      opinion,
      focusedPatient: patient,
      showPatientOverview: true,
      showVitalsPanel: true,
      showLabsPanel: true,
      showTherapiesPanel: true
    });
  } catch (error) {
    console.error("Erro ao gerar parecer:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação de parecer" },
      { status: 500 }
    );
  }
}




