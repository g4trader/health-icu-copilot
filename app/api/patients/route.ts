import { NextResponse } from "next/server";
import { patientsIndex } from "@/lib/mockPatients";

/**
 * GET /api/patients
 * Retorna SOMENTE o índice leve de pacientes (sem dados completos)
 * Performance: rápido, payload mínimo
 */
export async function GET() {
  try {
    return NextResponse.json({
      patients: patientsIndex,
      count: patientsIndex.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching patients index:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pacientes" },
      { status: 500 }
    );
  }
}
