import { NextResponse } from "next/server";
import { getPatientHistoryById } from "@/lib/mockPatients/history";

/**
 * GET /api/patients/[id]/history
 * Retorna histórico completo do paciente (séries temporais + timeline)
 * Usado para gráficos, timeline e análises temporais
 * Carregado sob demanda (apenas quando necessário)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;
    
    if (!patientId) {
      return NextResponse.json(
        { error: "ID do paciente não fornecido" },
        { status: 400 }
      );
    }
    
    const history = getPatientHistoryById(patientId);
    
    if (!history) {
      return NextResponse.json(
        { error: "Histórico do paciente não encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      history,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching patient history:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico do paciente" },
      { status: 500 }
    );
  }
}

