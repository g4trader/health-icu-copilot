/**
 * Tipo VentilationParams - Parâmetros de ventilação mecânica
 */
export interface VentilationParams {
  modo: "CMV" | "SIMV" | "PSV" | "CPAP" | "BiPAP" | "HFOV";
  fiO2: number; // % (0-100)
  peep: number; // cmH2O
  pressaoSuporte?: number; // cmH2O
  volumeCorrente?: number; // ml/kg
  frequenciaRespiratoria: number; // rpm
  relacaoIE?: string; // "1:2", "1:1.5", etc
  paO2FiO2?: number; // PaO2/FiO2 ratio
  ultimaAtualizacao: string; // ISO string
}



