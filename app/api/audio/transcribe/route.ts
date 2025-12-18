import { NextRequest, NextResponse } from "next/server";
import { detectVoiceCommand } from "@/lib/voiceCommands";

const WHISPER_API_URL = process.env.WHISPER_API_URL || "http://localhost:8080";
const LLM_API_URL = process.env.LLM_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    // Obter FormData do request
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 }
      );
    }

    // Obter leito/paciente do query string ou header (opcional)
    const { searchParams } = new URL(request.url);
    const bedParam = searchParams.get("bed");
    const patientIdParam = searchParams.get("patientId");
    
    // Parsear contexto do paciente do FormData (se fornecido)
    const patientContextStr = formData.get("patientContext") as string | null;
    let patientContext: any = {};
    
    if (patientContextStr) {
      try {
        patientContext = JSON.parse(patientContextStr);
      } catch (e) {
        console.warn("Erro ao parsear patientContext:", e);
      }
    }
    
    // Usar query params como fallback
    if (bedParam) {
      patientContext.bed = parseInt(bedParam) || patientContext.bed;
    }
    if (patientIdParam) {
      patientContext.patientId = patientIdParam;
    }
    
    // Default se não houver contexto
    if (!patientContext.bed && !patientContext.patientId) {
      patientContext.bed = 8; // Fallback para simplificar
    }
    if (!patientContext.unit) {
      patientContext.unit = "UTI 1";
    }

    // 1. Enviar áudio para Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append("file", file);

    const whisperResponse = await fetch(`${WHISPER_API_URL}/transcribe`, {
      method: "POST",
      body: whisperFormData,
    });

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json().catch(() => ({
        error: "Erro ao transcrever áudio",
      }));
      return NextResponse.json(
        { error: errorData.error || "Erro ao transcrever áudio" },
        { status: whisperResponse.status }
      );
    }

    const whisperData = await whisperResponse.json();
    const transcribedText = whisperData.text;

    // Logar transcrição para debug
    console.log("[API] Transcrição recebida:", transcribedText);
    console.log("[API] PatientContext:", patientContext);

    if (!transcribedText) {
      return NextResponse.json(
        { error: "Transcrição vazia" },
        { status: 400 }
      );
    }

    // 2. Verificar se é um comando de voz (navegação de paciente)
    const voiceCommand = detectVoiceCommand(transcribedText);
    console.log("[API] Comando detectado:", voiceCommand);

    // Se for comando de seleção de paciente, retornar sem chamar LLM
    if (voiceCommand.type === "select-patient") {
      return NextResponse.json({
        text: transcribedText,
        command: {
          type: "select-patient",
          bed: voiceCommand.bed,
        },
      });
    }

    // 3. Se não for comando, seguir fluxo normal: enviar texto para LLM API para parsing
    let structuredData = null;
    try {
      const llmResponse = await fetch(`${LLM_API_URL}/parse-audio-note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rawText: transcribedText,
          patientContext: {
            bed: patientContext.bed || null,
            patientId: patientContext.patientId || null,
            unit: patientContext.unit || null,
          },
        }),
      });

      if (llmResponse.ok) {
        structuredData = await llmResponse.json();
        console.log("[API] Dados estruturados recebidos:", JSON.stringify(structuredData, null, 2));
      } else {
        const errorText = await llmResponse.text();
        console.warn("Erro ao parsear nota com LLM:", errorText);
        // Continuar mesmo se o parsing falhar
      }
    } catch (error: any) {
      console.error("Erro ao chamar LLM API:", error);
      // Continuar mesmo se o parsing falhar
    }

    // 3. Retornar resposta combinada
    return NextResponse.json({
      text: transcribedText,
      structured: structuredData,
    });
  } catch (error: any) {
    console.error("Erro no endpoint /api/audio/transcribe:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar áudio", message: error.message },
      { status: 500 }
    );
  }
}

