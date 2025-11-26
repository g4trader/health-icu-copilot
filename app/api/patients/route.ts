import { NextResponse } from "next/server";
import { mockPatients } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json({ patients: mockPatients });
}
