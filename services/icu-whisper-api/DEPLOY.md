# Deploy do icu-whisper-api no Cloud Run

## Pré-requisitos
- Ter `gcloud` CLI instalado e autenticado
- Ter permissões no projeto `automatizar-452311`
- Ter Docker instalado (opcional, para build local)

## Opção 1: Deploy via Cloud Build (Recomendado)

```bash
cd services/icu-whisper-api

# Build e push da imagem
gcloud builds submit --tag gcr.io/automatizar-452311/icu-whisper-api --project automatizar-452311

# Deploy no Cloud Run
gcloud run deploy icu-whisper-api \
  --image gcr.io/automatizar-452311/icu-whisper-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --port 8080 \
  --project automatizar-452311
```

## Opção 2: Build local com Docker + Deploy

Se o Cloud Build não funcionar, você pode fazer o build localmente:

```bash
cd services/icu-whisper-api

# Build local
docker build -t gcr.io/automatizar-452311/icu-whisper-api .

# Push para Google Container Registry
docker push gcr.io/automatizar-452311/icu-whisper-api

# Deploy no Cloud Run
gcloud run deploy icu-whisper-api \
  --image gcr.io/automatizar-452311/icu-whisper-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --port 8080 \
  --project automatizar-452311
```

## Notas Importantes

1. **Memória e CPU**: O modelo `medium` requer mais recursos:
   - Mínimo recomendado: 2Gi de memória e 2 CPUs
   - Se houver problemas de timeout, aumentar para 4Gi

2. **Variável de Ambiente**: O modelo pode ser configurado via env var:
   ```bash
   gcloud run services update icu-whisper-api \
     --set-env-vars WHISPER_MODEL=medium \
     --region us-central1 \
     --project automatizar-452311
   ```

3. **Verificar Deploy**: Após o deploy, teste o endpoint:
   ```bash
   curl https://icu-whisper-api-XXXXX.us-central1.run.app/health
   ```

4. **Atualizar URL no Next.js**: Após obter a URL do Cloud Run, atualize o `.env.local`:
   ```
   WHISPER_API_URL=https://icu-whisper-api-XXXXX.us-central1.run.app
   ```

## Troubleshooting

- **Erro de permissão**: Verifique se a conta tem permissões de Cloud Build e Cloud Run Admin
- **Timeout no build**: O modelo `medium` é maior, pode demorar mais para fazer download
- **Erro de memória**: Aumente a memória para 4Gi se necessário

