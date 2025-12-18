# ICU Whisper API

Microserviço para transcrição de áudio usando Whisper, otimizado para português médico.

## Tecnologias

- Python 3.11
- FastAPI
- OpenAI Whisper (modelo base ou small)
- Uvicorn (ASGI server)

## Endpoint

### POST /transcribe

Transcreve áudio em português.

**Request:**
- Content-Type: `multipart/form-data`
- Campo: `file` (arquivo de áudio: .mp3, .m4a, .wav, etc.)

**Response:**
```json
{
  "text": "transcrição em português",
  "language": "pt",
  "duration_seconds": 12.3
}
```

## Execução Local

1. Instalar dependências:
```bash
pip install -r requirements.txt
```

2. Rodar o servidor:
```bash
uvicorn main:app --reload
```

O servidor estará disponível em `http://localhost:8000`

## Testes

### Usando curl:
```bash
curl -X POST http://localhost:8000/transcribe \
  -F "file=@WhatsApp-Audio-2025-12-18-at-15.15.56.mp3"
```

### Usando httpie:
```bash
http POST http://localhost:8000/transcribe file@WhatsApp-Audio-2025-12-18-at-15.15.56.mp3
```

## Deploy no Google Cloud Run

1. Build da imagem:
```bash
docker build -t gcr.io/PROJECT_ID/icu-whisper-api .
```

2. Push para Container Registry:
```bash
docker push gcr.io/PROJECT_ID/icu-whisper-api
```

3. Deploy no Cloud Run:
```bash
gcloud run deploy icu-whisper-api \
  --image gcr.io/PROJECT_ID/icu-whisper-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

**Nota:** O modelo Whisper pode consumir bastante memória. Ajuste `--memory` conforme necessário.

## Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 8080)
- `WHISPER_MODEL`: Modelo Whisper a usar (padrão: "base", opções: "tiny", "base", "small", "medium", "large")

## Modelos Disponíveis

- `tiny`: Mais rápido, menos preciso
- `base`: Balanceado (recomendado para produção)
- `small`: Mais preciso, mais lento
- `medium`: Muito preciso, muito lento
- `large`: Máxima precisão, muito lento

Para uso médico, recomenda-se `base` ou `small`.

