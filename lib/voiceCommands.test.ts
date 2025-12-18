/**
 * Testes unitários para detecção de comandos de voz
 */

import { detectVoiceCommand } from './voiceCommands';

function runTests() {
  console.log('🧪 Executando testes de comandos de voz...\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(name: string, input: string, expected: { type: string; bed?: number }) {
    totalTests++;
    const result = detectVoiceCommand(input);
    const passed = 
      result.type === expected.type &&
      (expected.bed === undefined || result.type === 'none' || (result.type === 'select-patient' && result.bed === expected.bed));
    
    if (passed) {
      console.log(`✅ ${name}: PASS`);
      console.log(`   Input: "${input}"`);
      console.log(`   Expected: ${JSON.stringify(expected)}`);
      console.log(`   Got: ${JSON.stringify(result)}\n`);
      passedTests++;
    } else {
      console.log(`❌ ${name}: FAIL`);
      console.log(`   Input: "${input}"`);
      console.log(`   Expected: ${JSON.stringify(expected)}`);
      console.log(`   Got: ${JSON.stringify(result)}\n`);
    }
  }

  // Testes de comandos válidos
  test('Comando: "me mostra o paciente 5"', 'me mostra o paciente 5', { type: 'select-patient', bed: 5 });
  test('Comando: "mostrar paciente 3"', 'mostrar paciente 3', { type: 'select-patient', bed: 3 });
  test('Comando: "mostra paciente 1"', 'mostra paciente 1', { type: 'select-patient', bed: 1 });
  test('Comando: "abre o leito 3"', 'abre o leito 3', { type: 'select-patient', bed: 3 });
  test('Comando: "abrir leito 8"', 'abrir leito 8', { type: 'select-patient', bed: 8 });
  test('Comando: "leito 5"', 'leito 5', { type: 'select-patient', bed: 5 });
  test('Comando: "focar no leito 8"', 'focar no leito 8', { type: 'select-patient', bed: 8 });
  test('Comando: "paciente 01"', 'paciente 01', { type: 'select-patient', bed: 1 });
  test('Comando: "mostrar o leito 01"', 'mostrar o leito 01', { type: 'select-patient', bed: 1 });
  
  // Testes de comandos com acentos
  test('Comando com acento: "mostrar paciente 5"', 'mostrar paciente 5', { type: 'select-patient', bed: 5 });
  test('Comando com acento: "abrir leito 3"', 'abrir leito 3', { type: 'select-patient', bed: 3 });
  
  // Testes de casos que NÃO são comandos
  test('Nota clínica normal: "nota de voz clínica normal"', 'nota de voz clínica normal', { type: 'none' });
  test('Nota clínica: "Estou avaliando aqui o Joãozinho do leito 8"', 'Estou avaliando aqui o Joãozinho do leito 8', { type: 'none' });
  test('Texto sem comando: "paciente estável"', 'paciente estável', { type: 'none' });
  test('Texto sem número: "mostrar paciente"', 'mostrar paciente', { type: 'none' });
  test('Texto vazio', '', { type: 'none' });
  
  // Testes de edge cases
  test('Leito zero: "leito 0"', 'leito 0', { type: 'none' }); // Leito 0 não é válido
  test('Número grande: "leito 99"', 'leito 99', { type: 'select-patient', bed: 99 });
  test('Com espaços extras: "  mostrar  paciente  5  "', '  mostrar  paciente  5  ', { type: 'select-patient', bed: 5 });

  console.log(`\n📊 Resultado: ${passedTests}/${totalTests} testes passaram`);
  if (passedTests === totalTests) {
    console.log('🎉 Todos os testes passaram!');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique a implementação.');
  }
}

// Executar testes se rodado diretamente
if (require.main === module) {
  runTests();
}

export { runTests };

