/**
 * Tipo FluidBalance - Balanço hídrico do paciente pediátrico
 * Valores em ml/kg/h para contexto pediátrico
 */
export interface FluidBalance {
  entrada24h: number; // ml/kg/h
  saida24h: number; // ml/kg/h
  balanco24h: number; // ml/kg/h (entrada - saída)
  entradaTotal: number; // ml (total)
  saidaTotal: number; // ml (total)
  balancoTotal: number; // ml (total)
  diurese: number; // ml/kg/h
  ultimaAtualizacao: string; // ISO string
}





