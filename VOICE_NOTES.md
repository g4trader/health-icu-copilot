# Sistema de Notas de Voz

Este documento descreve o fluxo completo de processamento de notas de voz clínicas, desde a gravação até a atualização dos dados do paciente.

## Arquitetura

O sistema é composto por três componentes principais:

1. **Frontend (Next.js)**: Componente `VoiceNoteRecorder` que captura áudio do usuário
2. **icu-whisper-api**: Microserviço Python/FastAPI que transcreve áudio usando Whisper
3. **icu-llm-api**: Microserviço Node.js que parseia o texto transcrito em JSON estruturado

## Fluxo de Dados

```
┌─────────────────┐
│  Frontend       │
│  (Next.js)      │
│                 │
│  VoiceNote      │
│  Recorder       │
└────────┬────────┘
         │
         │ 1. Gravação de áudio
         │    (MediaRecorder API)
         │
         ▼
┌─────────────────┐
│  Next.js API    │
│  /api/audio/    │
│  transcribe     │
└────────┬────────┘
         │
         │ 2. POST /transcribe
         │    (multipart/form-data)
         ▼
┌─────────────────┐
│  icu-whisper-api│
│  (Cloud Run)    │
│                 │
│  Whisper Model  │
│  (base/small)   │
└────────┬────────┘
         │
         │ 3. { text, language, duration }
         │
         ▼
┌─────────────────┐
│  Next.js API    │
│  (continua)     │
└────────┬────────┘
         │
         │ 4. POST /parse-audio-note
         │    { rawText, patientContext }
         ▼
┌─────────────────┐
│  icu-llm-api    │
│  (Cloud Run)    │
│                 │
│  LLM Parser     │
│  (OpenAI/Stub)  │
└────────┬────────┘
         │
         │ 5. JSON estruturado
         │    { bed, ventilation, drugs, ... }
         │
         ▼
┌─────────────────┐
│  Frontend       │
│  (Next.js)      │
│                 │
│  onStructured   │
│  Data callback  │
└─────────────────┘
```

## Componentes

### 1. VoiceNoteRecorder

Componente React que:
- Captura áudio usando `navigator.mediaDevices.getUserMedia()`
- Usa `MediaRecorder` para gravar o áudio
- Envia o áudio para `/api/audio/transcribe`
- Exibe estados: "gravando", "enviando", "transcrevendo", "processando"
- Chama callbacks `onTranscription` e `onStructuredData`

**Props:**
```typescript
interface VoiceNoteRecorderProps {
  onTranscription?: (text: string) => void;
  onStructuredData?: (data: any) => void;
  onError?: (error: string) => void;
  patientContext?: {
    bed?: string;
    patientId?: string;
    unit?: string;
  };
  disabled?: boolean;
}
```

### 2. Rota API Next.js: `/api/audio/transcribe`

Endpoint que:
1. Recebe o arquivo de áudio em `FormData`
2. Faz proxy para `icu-whisper-api` (`POST /transcribe`)
3. Recebe a transcrição em texto
4. Faz proxy para `icu-llm-api` (`POST /parse-audio-note`)
5. Retorna resposta combinada:
   ```json
   {
     "text": "transcrição em português",
     "language": "pt",
     "duration_seconds": 12.3,
     "structured": {
       "bed": 8,
       "ventilation": { ... },
       "drugs": [ ... ],
       ...
     }
   }
   ```

### 3. icu-whisper-api

Microserviço Python/FastAPI que:
- Expõe `POST /transcribe`
- Usa modelo Whisper (base ou small)
- Força idioma português (`language="pt"`)
- Retorna JSON com texto transcrito

**Request:**
- `multipart/form-data` com campo `file` (áudio)

**Response:**
```json
{
  "text": "transcrição em português",
  "language": "pt",
  "duration_seconds": 12.3
}
```

### 4. icu-llm-api

Microserviço Node.js que:
- Expõe `POST /parse-audio-note`
- Recebe texto transcrito e contexto do paciente
- Usa LLM (ou stub) para extrair dados estruturados
- Retorna JSON seguindo schema definido

**Request:**
```json
{
  "rawText": "Joãozinho do leito 8, estável, FiO2 50%, FR 20, adrenalina 0.3",
  "patientContext": {
    "bed": 8,
    "patientId": "P001",
    "unit": "UTI 1"
  }
}
```

**Response:**
```json
{
  "bed": 8,
  "patientId": "P001",
  "ventilation": {
    "mode": null,
    "fr": 20,
    "param2": null,
    "fio2": 0.5
  },
  "drugs": [
    {
      "name": "adrenalina",
      "dose": 0.3,
      "unit": "mcg/kg/min"
    }
  ],
  "statusClinico": "estavel",
  "diureseAdequada": true,
  "sinaisVitaisBons": null,
  "examesRecentes": null,
  "radiologia": null,
  "plano": "Manter conduta atual",
  "rawText": "Joãozinho do leito 8, estável, FiO2 50%, FR 20, adrenalina 0.3"
}
```

## Variáveis de Ambiente

### Next.js (.env.local)

```bash
# URLs dos serviços Cloud Run
WHISPER_API_URL=https://icu-whisper-api-xxxxx.run.app
LLM_API_URL=https://icu-llm-api-xxxxx.run.app
```

### icu-whisper-api

```bash
PORT=8080
WHISPER_MODEL=base  # ou "small", "tiny", "medium", "large"
```

### icu-llm-api

```bash
PORT=8080
# Para usar OpenAI (opcional):
OPENAI_API_KEY=sk-...
```

## Integração com Dados do Paciente

Quando `onStructuredData` é chamado no frontend, os dados estruturados podem ser usados para:

1. **Atualizar snapshot do paciente:**
   - Parâmetros de ventilação (FiO₂, FR, modo)
   - Drogas vasoativas (adicionar/atualizar)
   - Status clínico

2. **Adicionar evento na timeline:**
   - Criar evento do tipo `"note"`
   - Incluir descrição baseada nos dados estruturados
   - Timestamp atual

3. **Atualizar tags do paciente:**
   - Status clínico
   - Terapias ativas

### Exemplo de uso:

```typescript
<VoiceNoteRecorder
  patientContext={{
    bed: patient.leito,
    patientId: patient.id,
    unit: "UTI 1"
  }}
  onStructuredData={(data) => {
    // Aplicar atualizações ao paciente
    const updates = applyVoiceNoteToPatient(patient, data);
    
    // Adicionar evento na timeline
    const event = createVoiceNoteTimelineEvent(patient.id, data, data.rawText);
    
    // Em produção, fazer chamada à API para persistir
    // await updatePatient(patient.id, updates);
    // await addTimelineEvent(patient.id, event);
  }}
/>
```

## Deploy

### icu-whisper-api

```bash
cd services/icu-whisper-api
docker build -t gcr.io/PROJECT_ID/icu-whisper-api .
docker push gcr.io/PROJECT_ID/icu-whisper-api
gcloud run deploy icu-whisper-api \
  --image gcr.io/PROJECT_ID/icu-whisper-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

### icu-llm-api

```bash
cd services/icu-llm-api
docker build -t gcr.io/PROJECT_ID/icu-llm-api .
docker push gcr.io/PROJECT_ID/icu-llm-api
gcloud run deploy icu-llm-api \
  --image gcr.io/PROJECT_ID/icu-llm-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

## Testes Locais

### Testar icu-whisper-api

```bash
cd services/icu-whisper-api
pip install -r requirements.txt
uvicorn main:app --reload

# Em outro terminal:
curl -X POST http://localhost:8000/transcribe \
  -F "file=@test-audio.mp3"
```

### Testar icu-llm-api

```bash
cd services/icu-llm-api
npm install
npm start

# Em outro terminal:
curl -X POST http://localhost:8080/parse-audio-note \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "Joãozinho do leito 8, estável, FiO2 50%, FR 20, adrenalina 0.3",
    "patientContext": { "bed": 8, "unit": "UTI 1" }
  }'
```

## Tratamento de Erros

O sistema trata os seguintes erros:

1. **Permissão de microfone negada:**
   - Exibe mensagem amigável no frontend
   - Não bloqueia a interface

2. **Erro na transcrição:**
   - Retorna HTTP 500 com mensagem de erro
   - Frontend exibe toast/alert

3. **Erro no parsing:**
   - Se o LLM falhar, continua com transcrição
   - Frontend recebe `structured: null` mas ainda tem `text`

4. **Serviço indisponível:**
   - Timeout configurado nas chamadas fetch
   - Mensagem de erro clara para o usuário

## Melhorias Futuras

1. **Cache de transcrições:** Evitar re-transcrever o mesmo áudio
2. **Streaming de transcrição:** Mostrar transcrição em tempo real
3. **Validação de dados:** Validar dados estruturados antes de aplicar
4. **Histórico de notas:** Armazenar todas as notas de voz para auditoria
5. **Edição manual:** Permitir editar transcrição antes de aplicar
6. **Múltiplos idiomas:** Suporte para outros idiomas além de português

