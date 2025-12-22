/**
 * Testes simples para garantir consistência entre números dos cards e listas exibidas
 * 
 * Estes testes verificam que:
 * 1. O número exibido nos cards é igual ao tamanho da lista exibida ao clicar
 * 2. Os limites de tempo (24h para trás ou 24h para frente) estão sendo aplicados corretamente
 */

import { getAdmissoes24h, getAltasPrevistas24h, getAdmissionsLast24h, getDischargesNext24h } from "../icuSummary";

// Testes simples sem framework de testes (podem ser executados manualmente ou com Jest/Vitest)
export function testIcuSummaryConsistency() {
  const results: { test: string; passed: boolean; message: string }[] = [];

  // Teste 1: Consistência entre getAdmissoes24h() e getAdmissionsLast24h()
  const admissionsArray = getAdmissoes24h();
  const admissionsCount = getAdmissionsLast24h();
  const test1Passed = admissionsArray.length === admissionsCount;
  results.push({
    test: "getAdmissoes24h().length === getAdmissionsLast24h()",
    passed: test1Passed,
    message: test1Passed 
      ? `✅ Passou: ${admissionsCount} admissões`
      : `❌ Falhou: Array tem ${admissionsArray.length} mas contador retorna ${admissionsCount}`
  });

  // Teste 2: Verificar limites de tempo para admissões (últimas 24h)
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  let allAdmissionsInRange = true;
  admissionsArray.forEach(patient => {
    const admissionDate = new Date(now);
    admissionDate.setDate(admissionDate.getDate() - (patient.diasDeUTI || 0) + 1);
    if (admissionDate < twentyFourHoursAgo || admissionDate > now) {
      allAdmissionsInRange = false;
    }
  });
  results.push({
    test: "Admissões estão dentro da janela de 24h",
    passed: allAdmissionsInRange,
    message: allAdmissionsInRange
      ? `✅ Passou: Todas as ${admissionsArray.length} admissões estão nas últimas 24h`
      : `❌ Falhou: Algumas admissões estão fora da janela de 24h`
  });

  // Teste 3: Consistência entre getAltasPrevistas24h() e getDischargesNext24h()
  const dischargesArray = getAltasPrevistas24h();
  const dischargesCount = getDischargesNext24h();
  const test3Passed = dischargesArray.length === dischargesCount;
  results.push({
    test: "getAltasPrevistas24h().length === getDischargesNext24h()",
    passed: test3Passed,
    message: test3Passed
      ? `✅ Passou: ${dischargesCount} altas previstas`
      : `❌ Falhou: Array tem ${dischargesArray.length} mas contador retorna ${dischargesCount}`
  });

  // Teste 4: Verificar que pacientes de alta estão em condições de alta
  let allReadyForDischarge = true;
  dischargesArray.forEach(patient => {
    const hasVM = !!patient.ventilationParams;
    const hasVaso = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
    if (hasVM || hasVaso) {
      allReadyForDischarge = false;
    }
  });
  results.push({
    test: "Pacientes de alta estão em condições de alta (sem VM/vaso)",
    passed: allReadyForDischarge,
    message: allReadyForDischarge
      ? `✅ Passou: Todos os ${dischargesArray.length} pacientes estão em condições de alta`
      : `❌ Falhou: Alguns pacientes têm VM ou vasopressor`
  });

  // Teste 5: Consistência final - número do card deve ser igual ao tamanho da lista
  const cardAdmissions = getAdmissionsLast24h();
  const listAdmissions = getAdmissoes24h().length;
  const test5Passed = cardAdmissions === listAdmissions;
  results.push({
    test: "Card de admissões: número === tamanho da lista",
    passed: test5Passed,
    message: test5Passed
      ? `✅ Passou: Card mostra ${cardAdmissions} e lista tem ${listAdmissions}`
      : `❌ Falhou: Card mostra ${cardAdmissions} mas lista tem ${listAdmissions}`
  });

  const cardDischarges = getDischargesNext24h();
  const listDischarges = getAltasPrevistas24h().length;
  const test6Passed = cardDischarges === listDischarges;
  results.push({
    test: "Card de altas: número === tamanho da lista",
    passed: test6Passed,
    message: test6Passed
      ? `✅ Passou: Card mostra ${cardDischarges} e lista tem ${listDischarges}`
      : `❌ Falhou: Card mostra ${cardDischarges} mas lista tem ${listDischarges}`
  });

  return results;
}

// Executar testes se estiver em ambiente de desenvolvimento
if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
  const results = testIcuSummaryConsistency();
  console.log("\n=== Testes de Consistência ICU Summary ===\n");
  results.forEach(r => console.log(r.message));
  console.log("\n");
}

