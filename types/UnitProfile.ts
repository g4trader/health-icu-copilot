/**
 * Tipo UnitProfile - Perfil epidemiológico da unidade
 */
export interface UnitProfile {
  totalPacientes: number;
  taxaOcupacao: number; // 0-1
  casuistica: {
    respiratorios: number;
    sepse: number;
    cardiopatias: number;
    trauma: number;
    outros: number;
  };
  germesMaisFrequentes: {
    nome: string;
    frequencia: number; // número de casos
    resistencia?: string[]; // antibióticos aos quais é resistente
  }[];
  perfilResistencia: {
    antibiotico: string;
    taxaResistencia: number; // 0-1
    germes: string[]; // germes resistentes
  }[];
  periodo: {
    inicio: string; // ISO string
    fim: string; // ISO string
  };
}



