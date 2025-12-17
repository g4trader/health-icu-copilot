import { NextResponse } from "next/server";
import { getPatientSnapshotById } from "@/lib/mockPatients/snapshots";

/**
 * GET /api/patients/[id]/snapshot
 * Retorna snapshot completo do paciente (dados atuais)
 * Usado para dashboards que precisam de dados completos
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
    
    const snapshot = getPatientSnapshotById(patientId);
    
    if (!snapshot) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      patient: snapshot,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching patient snapshot:", error);
    return NextResponse.json(
      { error: "Erro ao buscar snapshot do paciente" },
      { status: 500 }
    );
  }
}

