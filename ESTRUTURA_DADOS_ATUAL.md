# Estrutura de Dados Atual - Problema Identificado

## 🔴 PROBLEMA: Dependência Circular

### Fluxo Atual (INCORRETO):

```
1. mockData.ts
   └─> mockPatientsRaw (dados brutos, risco 0.72 para Isabella)
   └─> applyTargetRisk() → risco baixo (0.08-0.15)
   └─> alignSnapshotWithLatestStatus() 
       └─> getLatestDailyStatus() de patientTimeline.ts
           └─> getDailyStatus()
               └─> generate30DayEvolution()
                   └─> USA patient.riscoMortality24h do snapshot
                       └─> MAS o snapshot ainda não foi ajustado!
```

### O Problema:

1. **`patientTimeline.ts`** importa `mockPatientsRaw` (dados brutos)
2. **`generate30DayEvolution`** usa `patient.riscoMortality24h` do snapshot para gerar timeline
3. **`alignSnapshotWithLatestStatus`** precisa da timeline já gerada para alinhar
4. **MAS** a timeline é gerada com dados brutos (risco 0.72), não com dados ajustados (risco 0.10)

### Resultado:

- Isabella tem `riscoMortality24h: 0.72` no `mockPatientsRaw` (dados brutos)
- `applyTargetRisk` ajusta para `0.10` (baixo risco)
- `alignSnapshotWithLatestStatus` tenta alinhar, mas chama `getLatestDailyStatus`
- `getLatestDailyStatus` usa `mockPatientsRaw` (ainda com 0.72!)
- Timeline é gerada com risco 0.72 → todos os dias em "grave"
- Snapshot mostra risco 0.10 → inconsistência!

## 📊 Estrutura de Dados Atual:

### 1. `mockPatientsRaw` (lib/mockData.ts)
- Dados brutos, não processados
- Isabella: riscoMortality24h: 0.72, diasDeUTI: 2, tem vasopressor ativo

### 2. `riskAdjustedPatients` (lib/mockData.ts linha 1764)
- Aplicado `applyTargetRisk`
- Isabella: riscoMortality24h: 0.10 (determinístico), sem vasopressor, sem VM

### 3. `alignedPatientsRaw` (lib/mockData.ts linha 1770)
- Aplicado `alignSnapshotWithLatestStatus` (só para low risk)
- Isabella: tenta alinhar com timeline, mas timeline usa dados brutos!

### 4. `mockPatientsCompat` (lib/mockData.ts linha 1778)
- Exportado como `mockPatients`
- Usado pelos componentes

### 5. `patientTimeline.ts`
- Importa `mockPatientsRaw` diretamente
- Gera timeline baseada em dados brutos (não ajustados)

## ✅ SOLUÇÃO IMPLEMENTADA:

Quebrar a dependência circular usando um cache:

1. **Dados Base (mockPatientsRaw)**: Dados brutos, imutáveis
2. **Aplicar `applyTargetRisk`**: Ajustar risco para distribuição controlada
3. **Definir cache em `patientTimeline.ts`**: `setProcessedPatients(riskAdjustedPatients)`
4. **Gerar timeline**: Usa dados do cache (processados), não brutos
5. **Aplicar `alignSnapshotWithLatestStatus`**: Alinha snapshot com timeline gerada
6. **Atualizar cache**: `setProcessedPatients(alignedPatientsRaw)`
7. **Exportar `mockPatientsCompat`**: Dados finais processados

### Fluxo Corrigido:

```
1. mockData.ts
   └─> mockPatientsRaw (dados brutos)
   └─> applyTargetRisk() → riskAdjustedPatients
   └─> setProcessedPatients(riskAdjustedPatients) → Define cache
   └─> alignSnapshotWithLatestStatus() 
       └─> getLatestDailyStatus() 
           └─> getDailyStatus()
               └─> generate30DayEvolution()
                   └─> USA getProcessedPatient() do cache ✅
   └─> setProcessedPatients(alignedPatientsRaw) → Atualiza cache
   └─> Exporta mockPatientsCompat
```

### Resultado:

- Timeline é gerada com dados processados (risco ajustado)
- Snapshot e timeline são consistentes
- Sem dependência circular

