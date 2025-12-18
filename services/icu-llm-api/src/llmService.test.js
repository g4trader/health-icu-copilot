/**
 * Testes automatizados para o serviço de parsing de notas de voz
 */

import { parseAudioNote } from './llmService.js';

// Teste com o exemplo fornecido
const testRawText = "Estou avaliando aqui o Joãozinho do leito 8, ele tá com ventilação mecânica de 20x7, FO2 de 05, tá recebendo adrenalina 03, Fenta 2, Mida 02, ele tá estável, teve uma diurese adequada, os sinais vitais estão bons. Exames de hoje todos normais, o raio X de controle, o tubo tá bem posicionado, e eu penso que ele tá estável, vou manter os antibióticos e ajustar as drogas mais tarde conforme a pressão.";

const expectedOutput = {
  bed: 8,
  patientId: null,
  ventilation: {
    mode: "ventilacao mecanica",
    fr: 20,
    param2: 7,
    fio2: 0.5
  },
  drugs: [
    { name: "adrenalina", dose: 0.3, unit: "mcg/kg/min" },
    { name: "fentanil", dose: 2, unit: null },
    { name: "midazolam", dose: 2, unit: null }
  ],
  statusClinico: "estavel",
  diureseAdequada: true,
  sinaisVitaisBons: true,
  examesRecentes: "Exames de hoje relatados como normais.",
  radiologia: "Raio X de controle com tubo bem posicionado.",
  plano: "Manter antibioticos e ajustar drogas mais tarde conforme a pressao arterial.",
  rawText: testRawText
};

async function runTests() {
  console.log('🧪 Executando testes de parsing de notas de voz...\n');
  
  const patientContext = {
    bed: 8,
    unit: "UTI 1"
  };
  
  try {
    const result = await parseAudioNote(testRawText, patientContext);
    
    // Testes
    const tests = [
      {
        name: 'bed',
        expected: expectedOutput.bed,
        actual: result.bed,
        pass: result.bed === expectedOutput.bed
      },
      {
        name: 'statusClinico',
        expected: expectedOutput.statusClinico,
        actual: result.statusClinico,
        pass: result.statusClinico === expectedOutput.statusClinico
      },
      {
        name: 'diureseAdequada',
        expected: expectedOutput.diureseAdequada,
        actual: result.diureseAdequada,
        pass: result.diureseAdequada === expectedOutput.diureseAdequada
      },
      {
        name: 'sinaisVitaisBons',
        expected: expectedOutput.sinaisVitaisBons,
        actual: result.sinaisVitaisBons,
        pass: result.sinaisVitaisBons === expectedOutput.sinaisVitaisBons
      },
      {
        name: 'plano',
        expected: expectedOutput.plano,
        actual: result.plano,
        pass: result.plano && result.plano.includes('Manter antibioticos') && result.plano.includes('ajustar drogas')
      },
      {
        name: 'ventilation.fr',
        expected: expectedOutput.ventilation.fr,
        actual: result.ventilation?.fr,
        pass: result.ventilation?.fr === expectedOutput.ventilation.fr
      },
      {
        name: 'ventilation.param2',
        expected: expectedOutput.ventilation.param2,
        actual: result.ventilation?.param2,
        pass: result.ventilation?.param2 === expectedOutput.ventilation.param2
      },
      {
        name: 'ventilation.fio2',
        expected: expectedOutput.ventilation.fio2,
        actual: result.ventilation?.fio2,
        pass: Math.abs((result.ventilation?.fio2 || 0) - expectedOutput.ventilation.fio2) < 0.1
      },
      {
        name: 'drugs count',
        expected: expectedOutput.drugs.length,
        actual: result.drugs?.length || 0,
        pass: (result.drugs?.length || 0) >= 3 // Pelo menos 3 drogas
      }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
      if (test.pass) {
        console.log(`✅ ${test.name}: PASS (esperado: ${JSON.stringify(test.expected)}, obtido: ${JSON.stringify(test.actual)})`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAIL (esperado: ${JSON.stringify(test.expected)}, obtido: ${JSON.stringify(test.actual)})`);
        failed++;
      }
    });
    
    console.log(`\n📊 Resultado: ${passed}/${tests.length} testes passaram`);
    
    if (failed > 0) {
      console.log('\n⚠️  Alguns testes falharam. Verifique a implementação do stub ou do LLM.');
      console.log('\nResultado completo:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n🎉 Todos os testes passaram!');
    }
    
    return failed === 0;
  } catch (error) {
    console.error('❌ Erro ao executar testes:', error);
    return false;
  }
}

// Executar testes se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runTests };

