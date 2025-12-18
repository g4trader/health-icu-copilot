FROM node:20-slim

WORKDIR /app

# Copiar package files
COPY package.json ./

# Instalar dependências
RUN npm install --only=production

# Copiar código
COPY src/ ./src/

# Expor porta
ENV PORT=8080

# Comando para rodar
CMD ["node", "src/index.js"]

