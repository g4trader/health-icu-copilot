/**
 * Tipo VitalSigns - Sinais vitais do paciente pediátrico
 */
export interface VitalSigns {
  temperatura: number; // ºC
  frequenciaCardiaca: number; // bpm
  frequenciaRespiratoria: number; // rpm
  pressaoArterialSistolica: number; // mmHg
  pressaoArterialDiastolica: number; // mmHg
  pressaoArterialMedia: number; // mmHg (MAP)
  saturacaoO2: number; // % (SpO2)
  escalaGlasgow?: number; // GCS (quando aplicável)
  pressaoIntracraniana?: number; // mmHg (quando aplicável)
}




