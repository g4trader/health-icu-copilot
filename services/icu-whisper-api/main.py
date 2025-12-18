"""
ICU Whisper API - Serviço de transcrição de áudio usando Whisper
"""
import os
import tempfile
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import whisper

app = FastAPI(title="ICU Whisper API", version="1.0.0")

# Carregar modelo Whisper uma vez na inicialização
# Usar modelo medium ou large para melhor precisão em português médico
MODEL_NAME = os.getenv("WHISPER_MODEL", "medium")
print(f"Carregando modelo Whisper: {MODEL_NAME}")
model = whisper.load_model(MODEL_NAME)
print(f"Modelo {MODEL_NAME} carregado com sucesso")


class TranscriptionResponse(BaseModel):
    text: str
    language: str
    duration_seconds: float


@app.get("/")
async def root():
    return {"service": "icu-whisper-api", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy", "model": MODEL_NAME}


@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcreve áudio em português usando Whisper.
    
    Aceita arquivos de áudio (.mp3, .m4a, .wav, etc.)
    Retorna a transcrição em português.
    """
    # Validar tipo de arquivo
    if not file.content_type or not file.content_type.startswith("audio/"):
        # Aceitar também application/octet-stream para flexibilidade
        if file.content_type != "application/octet-stream":
            raise HTTPException(
                status_code=400,
                detail="Arquivo deve ser um áudio (audio/* ou application/octet-stream)"
            )
    
    try:
        # Salvar arquivo temporário
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            # Transcrever com Whisper
            # Forçar português e task de transcrição com parâmetros otimizados
            result = model.transcribe(
                tmp_path,
                language="pt",
                task="transcribe",
                beam_size=5,  # Aumentar beam_size para melhor precisão
                best_of=5,    # Aumentar best_of para reduzir erros
                temperature=0.0,  # Usar temperatura 0 para resultados mais determinísticos
                fp16=False,   # Usar fp32 para melhor precisão (mais lento mas mais preciso)
                verbose=False
            )
            
            # Extrair informações
            text = result["text"].strip()
            language = result.get("language", "pt")
            duration = result.get("segments", [])
            duration_seconds = duration[-1]["end"] if duration else 0.0
            
            # Logar transcrição para debug
            print(f"[Whisper] Transcrição recebida ({len(text)} chars): {text[:200]}...")
            
            return TranscriptionResponse(
                text=text,
                language=language,
                duration_seconds=duration_seconds
            )
        
        finally:
            # Limpar arquivo temporário
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao transcrever áudio: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)

