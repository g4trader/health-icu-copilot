# Arquitetura do Sistema de IA para UTI Pediátrica

## Visão Geral

Este documento descreve a arquitetura atual do sistema de apoio à decisão clínica para UTI pediátrica, incluindo o pipeline de dados, camada de serviços/APIs e frontend. O sistema é um protótipo que utiliza dados mockados em memória, preparado para evoluir para integração com sistemas reais de EHR (Electronic Health Records).

### Diagrama Textual do Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FONTES DE DADOS (Futuro)                     │
├─────────────────────────────────────────────────────────────────┤
│  EHR (Prontuário Eletrônico)                                    │
│  Monitores (Sinais Vitais em Tempo Real)                        │
│  Laboratório (Exames, Cultura, Antibiograma)                    │
│  Farmácia (Prescrições, Dispensação)                            │
│  Radiologia (Laudos, Imagens)                                   │
│  Enfermagem (Balanço Hídrico, Diurese)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              PIPELINE DE INGESTÃO/TRANSFORMAÇÃO                 │
│                    (Atualmente: Mock Data)                      │
├─────────────────────────────────────────────────────────────────┤
│  • lib/mockData.ts - Array mockPatients em memória              │
│  • lib/mockPatients/ - Estrutura de dados históricos            │
│  • lib/patientTimeline.ts - Geração de timeline evolutiva        │
│  • Transformações:                                               │
│    - Alinhamento de snapshots com timeline                      │
│    - Aplicação de perfis clínicos                               │
│    - Cálculo de scores de risco                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ARMAZENAMENTO                                │
│              (Atualmente: Memória/Estado React)                  │
├─────────────────────────────────────────────────────────────────┤
│  • mockPatients (array em memória)                              │
│  • Estado React (conversation, activePatientId)                  │
│  • Cache de pacientes processados                               │
│  • Context API (PreviewProvider, ClinicalSessionContext)         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SERVIÇOS / APIs                                │
│              (Next.js API Routes)                                │
├─────────────────────────────────────────────────────────────────┤
│  GET  /api/patients                    → Lista índice           │
│  GET  /api/patients/[id]/snapshot      → Dados atuais           │
│  GET  /api/patients/[id]/history       → Histórico temporal     │
│  POST /api/chat                        → Agente LLM             │
│  POST /api/audio/transcribe            → Transcrição de voz     │
│  POST /api/agent-opinion               → Parecer especialista   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AGENTE LLM                                    │
│              (Groq API / Llama 3.1 70B)                         │
├─────────────────────────────────────────────────────────────────┤
│  • Detecção de intenção (detectIntent)                          │
│  • Handlers específicos por intent                               │
│  • Chamada ao LLM via lib/llmPatientAnswer.ts                   │
│  • Normalização de respostas                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND / DASHBOARD                         │
│              (Next.js 14 + React 18)                            │
├─────────────────────────────────────────────────────────────────┤
│  • app/page.tsx - Página principal                              │
│  • components/ContextSnapshot.tsx - Cards de resumo             │
│  • components/ChatInput.tsx - Input de texto/voz                │
│  • components/ui/PlantonistaAnswerPanel.tsx - Respostas         │
│  • components/PreviewDrawer.tsx - Drawer lateral                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Pipeline de Dados

### Estado Atual: Dados Mockados

**Fonte Principal:**
- **Arquivo**: `lib/mockData.ts`
- **Tipo**: Array `mockPatients` em memória (TypeScript)
- **Estrutura**: Array de objetos `Patient` com dados completos

**Estrutura de Dados:**

```typescript
Patient {
  id: string                    // "p1", "p2", etc.
  leito: string                 // "UTI 01", "UTI 02"
  nome: string
  idade: number
  peso: number
  diagnosticoPrincipal: string
  diasDeUTI: number
  riscoMortality24h: number     // 0-1
  riscoMortality7d: number      // 0-1
  ultimaAtualizacao: string     // ISO timestamp
  tags: string[]
  
  // Dados relacionados
  vitalSigns: VitalSigns
  fluidBalance: FluidBalance
  medications: Medication[]
  ventilationParams?: VentilationParams
  labResults: LabResult[]
  voiceNoteSummary?: string      // Parecer atualizado por voz
}
```

**Transformações Aplicadas:**

1. **Alinhamento com Timeline** (`lib/alignSnapshotWithTimeline.ts`)
   - Garante que snapshot atual está alinhado com timeline evolutiva
   - Ajusta risco se timeline termina em "alta_uti"

2. **Aplicação de Perfis Clínicos** (`lib/patientClinicalProfiles.ts`)
   - Trajetórias esperadas por tipo de paciente
   - Fases de evolução (crítico → grave → estável → melhora → alta)

3. **Aplicação de Risco Alvo** (`lib/applyTargetRisk.ts`)
   - Ajusta risco baseado em categoria alvo
   - Garante consistência com thresholds padronizados

4. **Geração de Timeline** (`lib/patientTimeline.ts`)
   - Gera evolução de 30 dias para cada paciente
   - Calcula status global por dia
   - Gera eventos principais e resumos diários

**Latência:**
- **Atual**: Instantânea (dados em memória)
- **Futuro**: 
  - Sinais vitais: Near real-time (1-5 segundos)
  - Exames laboratoriais: Batch (a cada 1-2 horas)
  - Prescrições: Event-driven (quando há mudança)
  - Dados históricos: Batch diário

**Monitoramento:**
- **Atual**: Apenas `console.log` em pontos críticos
- **Faltando**: 
  - Logs estruturados (Winston, Pino)
  - Métricas de latência
  - Alertas de falha
  - Dashboard de monitoramento

---

## 2. Camada de Serviços / APIs

### Endpoints Principais

#### 2.1. `/api/patients` (GET)
- **Descrição**: Retorna índice leve de pacientes (sem dados completos)
- **Lógica**: `lib/mockPatients/index.ts` → `patientsIndex`
- **Uso**: Listagem rápida, busca de pacientes
- **Payload**: Array de `{ id, leito, nome, riscoMortality24h }`

#### 2.2. `/api/patients/[id]/snapshot` (GET)
- **Descrição**: Retorna snapshot completo do paciente (dados atuais)
- **Lógica**: `lib/mockPatients/snapshots.ts` → `getPatientSnapshotById()`
- **Uso**: Dashboards que precisam de dados completos
- **Payload**: Objeto `Patient` completo

#### 2.3. `/api/patients/[id]/history` (GET)
- **Descrição**: Retorna histórico completo (séries temporais + timeline)
- **Lógica**: `lib/mockPatients/history.ts` → `getPatientHistoryById()`
- **Uso**: Gráficos, timeline, análises temporais
- **Payload**: Objeto com séries temporais e eventos

#### 2.4. `/api/chat` (POST)
- **Descrição**: Endpoint principal do agente LLM
- **Lógica de Negócio**: `app/api/chat/route.ts`
  - Detecção de intenção (`detectIntent`)
  - Handlers específicos por intent
  - Chamada ao LLM via `lib/llmPatientAnswer.ts`
  - Normalização de resposta via `lib/normalizeAgentAnswer.ts`
- **Intents Suportados**:
  - `PIOROU_6H` → `lib/patientDeterioration.ts`
  - `PRIORITIZACAO` → `lib/mockData.ts` → `getTopPatients()`
  - `PACIENTE_ESPECIFICO` → LLM com contexto do paciente
  - `SINAIS_VITAIS`, `BALANCO_HIDRICO`, `PERFIL_UNIDADE`, etc.
- **Payload de Entrada**:
  ```json
  {
    "message": "string",
    "focusedPatientId": "string | null",
    "sessionId": "string",
    "patientId": "string | null"
  }
  ```
- **Payload de Saída**: `AgentReply` com `reply`, `topPatients`, `focusedPatient`, `llmAnswer`, etc.

#### 2.5. `/api/audio/transcribe` (POST)
- **Descrição**: Transcreve áudio e detecta comandos de voz
- **Lógica**: 
  - Envia áudio para serviço externo (Whisper API)
  - Detecta comandos via `lib/voiceCommands.ts`
  - Chama LLM para estruturação se necessário
- **Retorna**: `{ text, command?, structured?, error? }`

#### 2.6. `/api/agent-opinion` (POST)
- **Descrição**: Gera parecer de especialista (não usado atualmente)

### Funções de Negócio Principais

#### Cálculos de Risco e Contagens

**Localização**: `lib/icuSummary.ts`, `lib/mockData.ts`

| Função | Localização | Lógica |
|--------|-------------|--------|
| `getTotalPatients()` | `lib/icuSummary.ts` | `mockPatients.length` |
| `getPatientsOnVentilation()` | `lib/icuSummary.ts` | Filtra `ventilationParams !== undefined` |
| `getPatientsOnVasopressors()` | `lib/icuSummary.ts` | Filtra `medications` com `tipo === "vasopressor" && ativo` |
| `getHighRiskPatients()` | `lib/icuSummary.ts` | Filtra `riscoMortality24h >= 0.61` OU `riskLevelFromScore() === "alto"` |
| `getAdmissoes24h()` | `lib/icuSummary.ts` | Calcula data de admissão: `hoje - (diasDeUTI - 1)` e filtra últimas 24h |
| `getAltasPrevistas24h()` | `lib/icuSummary.ts` | Filtra baixo risco + sem VM + sem vaso |
| `getPioresPacientesUltimas6h()` | `lib/patientDeterioration.ts` | Calcula score de piora baseado em múltiplos fatores |
| `calculateRiskScore()` | `lib/mockData.ts` | Score composto: vitais + VM + vaso + lactato + balanço hídrico |
| `getTopPatients(n)` | `lib/mockData.ts` | Ordena por `calculateRiskScore()` e retorna top N |

**Problema Identificado**: 
- `getHighRiskPatients()` usa `riscoMortality24h >= 0.61` OU `riskLevelFromScore(riscoMortality24h) === "alto"`
- `riskLevelFromScore()` usa thresholds diferentes de `riscoMortality24h` direto
- Pode haver inconsistência se `riscoMortality24h` não for calculado via `calculateRiskScore()`
- **Duplicação**: `HighRiskPreview` em `PreviewDrawer.tsx:373` refaz o mesmo filtro:
  ```typescript
  const highRisk = mockPatients.filter(p => {
    const isHighRisk = p.riscoMortality24h >= 0.61 || riskLevelFromScore(p.riscoMortality24h) === "alto";
    return isHighRisk;
  });
  ```
  Isso é exatamente a mesma lógica de `getHighRiskPatients()`, mas implementada localmente.

---

## 3. Frontend

### 3.1. Tela Principal (`app/page.tsx`)

**Componentes Principais:**
- `ContextSnapshot` - Cards de resumo da UTI
- `ChatInput` - Input de texto/voz
- `PlantonistaAnswerPanel` - Renderização de respostas do agente
- `PreviewDrawer` - Drawer lateral com detalhes

**Fluxo de Dados:**

1. **Carregamento Inicial:**
   - Importa `mockPatients` diretamente de `lib/mockData.ts`
   - Chama funções de `lib/icuSummary.ts` para calcular números dos cards
   - Renderiza `ContextSnapshot` com dados calculados

2. **Interação com Chat:**
   - Usuário digita ou grava áudio
   - `ChatInput` envia para `/api/chat`
   - Resposta é normalizada e adicionada ao estado `conversation`
   - `PlantonistaAnswerPanel` renderiza resposta estruturada

3. **Seleção de Paciente:**
   - Clique em card ou comando de voz
   - Atualiza `activePatientId` no estado
   - `PatientContextBar` mostra paciente ativo
   - Chat passa a incluir `focusedPatientId` nas requisições

### 3.2. ContextSnapshot (`components/ContextSnapshot.tsx`)

**Chamadas de Dados:**
- Importa funções de `lib/icuSummary.ts` diretamente
- Calcula números no render (não via API)
- Passa arrays filtrados para `PreviewDrawer` ao clicar nos cards

**Problema Identificado:**
- Cálculos feitos no frontend (não há API dedicada)
- Dados vêm de `mockPatients` em memória (não há cache/refresh)

### 3.3. Filtros e Processamento no Frontend

**Onde o Frontend Filtra/Processa:**

1. **PreviewDrawer** (`components/PreviewDrawer.tsx`):
   - `VentilatedPreview`: Filtra `mockPatients.filter(p => p.ventilationParams !== undefined)`
   - `VasopressorsPreview`: Filtra `mockPatients.filter(p => p.medications.some(...))`
   - `HighRiskPreview`: Filtra `mockPatients.filter(p => p.riscoMortality24h >= 0.61 || ...)`
   - **Risco**: Mesma lógica duplicada de `getHighRiskPatients()` mas implementada localmente

2. **PatientList** (`components/PatientList.tsx`):
   - Usa `getSortedByMortalityRisk24h()` do `lib/mockData.ts`
   - Ordena por `riscoMortality24h` (não por `calculateRiskScore()`)

3. **Cálculos de Risco**:
   - `calculateRiskScore()` chamado em múltiplos lugares
   - `riskLevelFromScore()` usado em vários componentes
   - **Risco**: Lógica duplicada, pode divergir

### 3.4. Conexão com Agente LLM

**Endpoint**: `POST /api/chat`

**Payload Enviado:**
```typescript
{
  message: string,
  focusedPatientId: string | null,
  sessionId: string,
  userId: string,
  role: "plantonista" | "diarista" | "coordenador",
  unidade: string,
  turno: string,
  currentAgent: ClinicalAgentType,
  agentId: ClinicalAgentId,
  patientId: string | null
}
```

**Contexto de Dados Enviado:**
- Se `focusedPatientId` existe: paciente completo via `mockPatients.find()`
- Se intent é `PACIENTE_ESPECIFICO`: chama `getLlmPatientAnswer()` com:
  - `patient`: objeto Patient completo
  - `dailyStatus`: timeline de 14 dias via `getDailyStatus()`
  - `unitProfile`: perfil da unidade (mock)
  - `radiologyReports`: séries de laudos radiológicos

**Resposta Recebida:**
- `AgentReply` com `reply`, `topPatients`, `focusedPatient`, `llmAnswer`, etc.
- Normalizada para `PlantonistaAnswerContent` via `normalizeAgentAnswer()`

---

## 4. Pontos Fracos e Riscos

### 4.1. Pipeline de Dados

| Risco | Descrição | Impacto | Localização |
|-------|-----------|---------|-------------|
| **Dados em Memória** | `mockPatients` é array em memória, perdido no refresh | Alto | `lib/mockData.ts` |
| **Sem Persistência** | Não há banco de dados, tudo é volátil | Alto | Todo o sistema |
| **Sem Validação de Schema** | Não há validação de estrutura de dados | Médio | Tipos TypeScript não são validados em runtime |
| **Sem Logs Estruturados** | Apenas `console.log`, sem rastreabilidade | Médio | Todos os arquivos |
| **Sem Monitoramento** | Não há métricas de latência, falhas, uso | Alto | Falta implementar |
| **Timeline Gerada Dinamicamente** | Timeline é calculada a cada chamada, não persistida | Médio | `lib/patientTimeline.ts` |
| **Sem Versionamento de Dados** | Não há histórico de mudanças nos dados | Baixo | Apenas timeline simulada |

### 4.2. Serviços/APIs

| Risco | Descrição | Impacto | Localização |
|-------|-----------|---------|-------------|
| **Lógica Duplicada de Risco** | `getHighRiskPatients()` e `HighRiskPreview` têm lógica **diferente** | **Crítico** | `lib/icuSummary.ts` vs `components/PreviewDrawer.tsx:373` |
| | `getHighRiskPatients()`: `riscoMortality24h >= 0.61 || riskLevelFromScore(riscoMortality24h) === "alto"` | | |
| | `HighRiskPreview`: `riscoMortality24h >= 0.61` (sem `riskLevelFromScore`) | | |
| | **Resultado**: Card pode mostrar número diferente da lista! | | |
| **Inconsistência de Thresholds** | `getHighRiskPatients()` usa `riscoMortality24h >= 0.61` OU `riskLevelFromScore()`, mas `riskLevelFromScore()` pode dar resultado diferente | Alto | `lib/icuSummary.ts:37-44` |
| **Cálculo de Risco em Múltiplos Lugares** | `calculateRiskScore()` chamado em vários arquivos, pode divergir | Médio | `lib/mockData.ts`, `lib/icuSummary.ts`, `lib/patientDeterioration.ts` |
| **Sem Testes Automatizados** | Apenas `lib/__tests__/icuSummary.test.ts` básico | Alto | Falta cobertura |
| **Cards vs Listas Inconsistentes** | Já corrigido: `getAdmissoes24h()` e `getAltasPrevistas24h()` agora retornam arrays usados tanto para número quanto lista | Resolvido | `lib/icuSummary.ts` |
| **Detecção de Intent Frágil** | `detectIntent()` usa apenas palavras-chave, sem ML/NLP robusto | Médio | `app/api/chat/route.ts:258` |
| **Sem Cache de Respostas LLM** | Cada pergunta chama LLM, mesmo para perguntas similares | Baixo | `lib/llmPatientAnswer.ts` |
| **Sem Rate Limiting** | API pode ser sobrecarregada | Médio | Falta implementar |

### 4.3. Frontend

| Risco | Descrição | Impacto | Localização |
|-------|-----------|---------|-------------|
| **Cálculos no Frontend** | `ContextSnapshot` calcula números diretamente, não via API | Médio | `components/ContextSnapshot.tsx` |
| **Filtros Duplicados** | `PreviewDrawer` refaz filtros que já existem em `lib/icuSummary.ts` | Alto | `components/PreviewDrawer.tsx:266, 318, 373` |
| | `VentilatedPreview`: Filtra `mockPatients.filter(p => p.ventilationParams !== undefined)` - mesma lógica de `getPatientsOnVentilation()` | | |
| | `VasopressorsPreview`: Filtra `mockPatients.filter(p => p.medications.some(...))` - mesma lógica de `getPatientsOnVasopressors()` | | |
| | `HighRiskPreview`: Filtra com **lógica diferente** de `getHighRiskPatients()` (veja risco acima) | | |
| **Sem Tratamento de Estados** | Não há estados de "carregando", "erro", "sem dados" | Médio | Vários componentes |
| **Dados Desatualizados** | `mockPatients` não é atualizado automaticamente | Alto | Estado React não sincroniza com "backend" |
| **Múltiplas Fontes de Verdade** | `mockPatients` importado em vários lugares, pode divergir | Alto | `lib/mockData.ts` importado em múltiplos arquivos |
| **Sem Validação de Dados no Frontend** | Assume que dados vêm corretos do backend | Baixo | Tipos TypeScript ajudam, mas não validam runtime |
| **Cálculo de Piora no Frontend** | `getPioresPacientesUltimas6h()` é chamado no backend, mas lógica poderia estar centralizada | Baixo | `lib/patientDeterioration.ts` (já está no backend) |

### 4.4. Integração LLM

| Risco | Descrição | Impacto | Localização |
|-------|-----------|---------|-------------|
| **Sem Fallback Robusto** | Se LLM falhar, resposta genérica pode não ser útil | Médio | `app/api/chat/route.ts` |
| **Contexto Limitado** | LLM recebe apenas dados do paciente atual, não contexto da UTI inteira | Baixo | `lib/llmPatientAnswer.ts` |
| **Sem Validação de Resposta** | Não valida se resposta do LLM está no formato esperado | Médio | `lib/normalizeAgentAnswer.ts` |
| **Custo de API** | Cada chamada custa, sem otimização | Baixo | `lib/llmClient.ts` |

---

## 5. Recomendações Iniciais

### 5.1. Padronização e Consistência

1. **Centralizar Cálculos de Risco**
   - Criar serviço dedicado `services/riskCalculation.ts`
   - Todas as funções de risco devem usar este serviço
   - Remover duplicação entre `lib/icuSummary.ts` e `components/PreviewDrawer.tsx`

2. **Padronizar Thresholds**
   - Definir constantes em `lib/constants.ts`:
     ```typescript
     export const RISK_THRESHOLDS = {
       ALTO: 0.61,
       MODERADO: 0.21,
       BAIXO: 0.0
     };
     ```
   - Usar essas constantes em todos os lugares

3. **Criar API Dedicada para Resumos**
   - Endpoint `/api/icu/summary` que retorna todos os números dos cards
   - Frontend chama API em vez de calcular localmente
   - Garante consistência entre cards e listas

### 5.2. Arquitetura de Dados

4. **Implementar Camada de Dados Abstrata**
   - Criar `lib/data/patientRepository.ts` com interface:
     ```typescript
     interface PatientRepository {
       getAll(): Promise<Patient[]>;
       getById(id: string): Promise<Patient | null>;
       getByBed(bed: string): Promise<Patient | null>;
       update(id: string, updates: Partial<Patient>): Promise<Patient>;
     }
     ```
   - Implementação mock atual e futura implementação real

5. **Adicionar Validação de Schema**
   - Usar Zod ou Yup para validar dados em runtime
   - Validar na entrada de APIs e após transformações

6. **Implementar Cache com TTL**
   - Cache de pacientes processados com TTL de 5 minutos
   - Cache de respostas LLM para perguntas similares

### 5.3. Testes e Qualidade

7. **Criar Testes de Consistência**
   - Teste que garante: `getAdmissoes24h().length === getAdmissionsLast24h()`
   - Teste que garante: número do card === tamanho da lista
   - Teste que garante: `getHighRiskPatients()` usa mesma lógica que `HighRiskPreview`

8. **Testes de Integração para APIs**
   - Testes para cada endpoint principal
   - Testes de cenários de erro
   - Testes de performance

9. **Testes de Regressão para Lógica Clínica**
   - Testes que garantem que mudanças em `calculateRiskScore()` não quebram outros componentes

### 5.4. Monitoramento e Observabilidade

10. **Implementar Logs Estruturados**
    - Usar Winston ou Pino
    - Logs com contexto (patientId, sessionId, intent)
    - Níveis apropriados (error, warn, info, debug)

11. **Adicionar Métricas**
    - Tempo de resposta de APIs
    - Taxa de erro
    - Uso de LLM (chamadas, tokens, custo)
    - Uso de recursos (memória, CPU)

12. **Dashboard de Saúde do Sistema**
    - Status de APIs externas (LLM, Whisper)
    - Última atualização de dados
    - Alertas de falhas

### 5.5. Frontend

13. **Mover Lógica de Negócio para Backend**
    - Remover filtros duplicados do `PreviewDrawer`
    - Criar endpoints específicos:
      - `/api/icu/ventilated` → retorna pacientes em VM
      - `/api/icu/vasopressors` → retorna pacientes em vaso
      - `/api/icu/high-risk` → retorna pacientes de alto risco

14. **Adicionar Estados de UI**
    - Loading states para todas as chamadas de API
    - Error states com mensagens claras
    - Empty states quando não há dados
    - Skeleton loaders durante carregamento

15. **Implementar Refresh Automático**
    - Polling a cada 30 segundos para dados críticos
    - WebSocket para atualizações em tempo real (futuro)
    - Indicador visual de "última atualização"

### 5.6. Segurança e Performance

16. **Rate Limiting**
    - Limitar chamadas por usuário/sessão
    - Proteger endpoints de LLM

17. **Validação de Input**
    - Validar todos os inputs de API
    - Sanitizar mensagens antes de enviar ao LLM

18. **Otimização de Payloads**
    - Endpoints leves para listagens (já existe `/api/patients`)
    - Lazy loading de dados históricos (já existe `/api/patients/[id]/history`)

### 5.7. Preparação para Produção

19. **Migração Gradual para Banco de Dados**
    - Criar schema de banco de dados
    - Implementar migrações
    - Manter compatibilidade com mock durante transição

20. **Documentação de APIs**
    - OpenAPI/Swagger para todos os endpoints
    - Exemplos de request/response
    - Códigos de erro documentados

21. **Versionamento de API**
    - Versão nos endpoints: `/api/v1/chat`
    - Suporte a múltiplas versões durante transição

---

## 6. Priorização de Melhorias

### Crítico (Fazer Agora)
1. ✅ Centralizar cálculos de risco (já parcialmente feito com `lib/icuSummary.ts`)
2. ✅ Garantir consistência entre cards e listas de admissões/altas (já corrigido)
3. ⚠️ **CORRIGIR**: `HighRiskPreview` usa lógica diferente de `getHighRiskPatients()` - pode causar inconsistência entre card e lista
4. ⚠️ Remover duplicação de lógica entre `lib/icuSummary.ts` e `PreviewDrawer` (VentilatedPreview, VasopressorsPreview)
5. ⚠️ Adicionar tratamento de estados de erro/loading no frontend

### Alto (Próximas 2-4 semanas)
5. Criar API dedicada `/api/icu/summary`
6. Implementar logs estruturados
7. Adicionar testes de consistência automatizados
8. Mover filtros do frontend para backend

### Médio (Próximos 2-3 meses)
9. Implementar camada de dados abstrata
10. Adicionar validação de schema (Zod)
11. Implementar cache com TTL
12. Dashboard de monitoramento

### Baixo (Futuro)
13. Migração para banco de dados real
14. WebSocket para atualizações em tempo real
15. Rate limiting e segurança avançada

---

## 7. Notas Técnicas

### Dependências Principais
- **Next.js 14.2.5**: Framework React
- **React 18.3.1**: UI Library
- **Groq API**: LLM (Llama 3.1 70B)
- **Whisper API**: Transcrição de áudio (serviço externo)

### Estrutura de Pastas
```
lib/
  ├── mockData.ts              # Dados mockados principais
  ├── icuSummary.ts            # Funções de resumo da UTI
  ├── patientDeterioration.ts   # Cálculo de piora
  ├── patientTimeline.ts        # Geração de timeline
  ├── llmPatientAnswer.ts       # Integração com LLM
  └── mockPatients/            # Estrutura de dados históricos
      ├── index.ts             # Índice leve
      ├── snapshots.ts         # Snapshots completos
      └── history.ts           # Histórico temporal

app/api/
  ├── chat/route.ts            # Endpoint principal do agente
  ├── patients/route.ts        # Lista de pacientes
  └── patients/[id]/
      ├── snapshot/route.ts    # Dados atuais
      └── history/route.ts    # Histórico

components/
  ├── ContextSnapshot.tsx      # Cards de resumo
  ├── ChatInput.tsx            # Input de texto/voz
  ├── PreviewDrawer.tsx        # Drawer lateral
  └── ui/
      └── PlantonistaAnswerPanel.tsx  # Renderização de respostas
```

---

**Última Atualização**: 2025-01-XX
**Versão do Documento**: 1.0
**Autor**: Sistema de Documentação Automática

