# ICU LLM API

Microserviço para parsear notas de voz clínicas em JSON estruturado usando LLM.

## Tecnologias

- Node.js 20
- Express.js
- CORS habilitado

## Endpoints

### POST /parse-audio-note

Recebe texto de uma nota de voz clínica e retorna JSON estruturado.

**Request:**
```json
{
  "rawText": "Joãozinho do leito 8, estável, FiO2 50%, FR 20, adrenalina 0.3, diurese adequada, manter antibióticos",
  "patientContext": {
    "bed": 8,
    "patientId": "optional-patient-id",
    "unit": "UTI 1"
  }
}
```

**Response:**
```json
{
  "bed": 8,
  "patientId": "optional-patient-id",
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
  "rawText": "Joãozinho do leito 8, estável, FiO2 50%, FR 20, adrenalina 0.3, diurese adequada, manter antibióticos"
}
```

### POST /chat (Placeholder)

Endpoint placeholder para futuras funcionalidades de chat.

## Execução Local

1. Instalar dependências:
```bash
npm install
```

2. Rodar o servidor:
```bash
npm start
# ou para desenvolvimento com watch:
npm run dev
```

O servidor estará disponível em `http://localhost:8080`

## Testes

### Usando curl:
```bash
curl -X POST http://localhost:8080/parse-audio-note \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "Joãozinho do leito 8, estável, FiO2 50%, FR 20, adrenalina 0.3",
    "patientContext": {
      "bed": 8,
      "unit": "UTI 1"
    }
  }'
```

### Usando httpie:
```bash
http POST http://localhost:8080/parse-audio-note \
  rawText="Joãozinho do leito 8, estável, FiO2 50%, FR 20, adrenalina 0.3" \
  patientContext:='{"bed": 8, "unit": "UTI 1"}'
```

## Deploy no Google Cloud Run

1. Build da imagem:
```bash
docker build -t gcr.io/PROJECT_ID/icu-llm-api .
```

2. Push para Container Registry:
```bash
docker push gcr.io/PROJECT_ID/icu-llm-api
```

3. Deploy no Cloud Run:
```bash
gcloud run deploy icu-llm-api \
  --image gcr.io/PROJECT_ID/icu-llm-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

## Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 8080)

## Integração com LLM

Atualmente, o serviço usa um stub que faz parsing básico baseado em palavras-chave. Para usar um LLM real (OpenAI, Anthropic, etc.):

1. Editar `src/llmService.js`
2. Implementar a função `callLLM()` com chamada real à API do LLM
3. Adicionar variáveis de ambiente para chaves de API (ex.: `OPENAI_API_KEY`)

Exemplo de integração com OpenAI:
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function callLLM(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1
  });
  
  return response.choices[0].message.content;
}
```

