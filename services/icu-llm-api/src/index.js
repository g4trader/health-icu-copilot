import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { parseAudioNote } from './llmService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'icu-llm-api', status: 'running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

/**
 * POST /parse-audio-note
 * Recebe texto de uma nota de voz clínica e retorna JSON estruturado
 */
app.post('/parse-audio-note', async (req, res) => {
  try {
    const { rawText, patientContext } = req.body;

    // Validação básica
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({
        error: 'Campo rawText é obrigatório e deve ser uma string'
      });
    }

    if (!patientContext || typeof patientContext !== 'object') {
      return res.status(400).json({
        error: 'Campo patientContext é obrigatório e deve ser um objeto'
      });
    }

    // Chamar serviço de parsing
    const structuredData = await parseAudioNote(rawText, patientContext);

    res.json(structuredData);
  } catch (error) {
    console.error('Erro ao parsear nota de áudio:', error);
    res.status(500).json({
      error: 'Erro interno ao processar nota de áudio',
      message: error.message
    });
  }
});

/**
 * POST /chat (placeholder para futuras funcionalidades)
 */
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Campo message é obrigatório'
      });
    }

    // Placeholder - retornar echo por enquanto
    res.json({
      response: `Echo: ${message}`,
      note: 'Este endpoint é um placeholder. Implementar integração com LLM conforme necessário.'
    });
  } catch (error) {
    console.error('Erro no chat:', error);
    res.status(500).json({
      error: 'Erro interno no chat',
      message: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ICU LLM API rodando na porta ${PORT}`);
});

