FROM python:3.11-slim

# Instalar dependências do sistema (ffmpeg para processar áudio)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY main.py .

# Expor porta (Cloud Run usa variável de ambiente PORT)
ENV PORT=8080

# Comando para rodar o servidor
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}

