/**
 * Tipo Medication - Medicamento do paciente pediátrico
 */
export interface Medication {
  id: string;
  nome: string;
  tipo: "antibiotico" | "vasopressor" | "sedativo" | "diuretico" | "outro";
  dose: number; // mg/kg ou mcg/kg/min conforme tipo
  unidade: string; // "mg/kg/dia", "mcg/kg/min", etc
  via: "EV" | "VO" | "inalatoria" | "topica";
  frequencia: string; // "8/8h", "contínuo", etc
  diasDeUso: number;
  inicio: string; // ISO string
  ativo: boolean;
  observacoes?: string;
}




