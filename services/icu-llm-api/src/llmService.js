/**
 * Serviço de LLM para parsing de notas de voz clínicas
 * 
 * Esta camada abstrai a chamada ao LLM, permitindo trocar
 * facilmente entre diferentes provedores (OpenAI, Anthropic, etc.)
 */

/**
 * Chama o LLM com um prompt e retorna a resposta
 * @param {string} prompt - Prompt para o LLM
 * @returns {Promise<string>} Resposta do LLM
 */
async function callLLM(prompt) {
  // Por enquanto, usar stub que retorna JSON baseado em exemplo
  // TODO: Substituir por chamada real ao LLM (OpenAI, Anthropic, etc.)
  
  // Exemplo de resposta baseada no áudio "Joãozinho do leito 8..."
  // Em produção, isso seria substituído por uma chamada real ao LLM
  
  // Stub simples - retorna JSON estruturado baseado em palavras-chave
  return JSON.stringify(parseStubResponse(prompt));
}

/**
 * Stub de parsing baseado em palavras-chave (para desenvolvimento)
 * Em produção, substituir por chamada real ao LLM
 */
function parseStubResponse(prompt) {
  // Extrair texto original do prompt
  const rawTextMatch = prompt.match(/Texto:\s*"([^"]+)"/);
  const rawText = rawTextMatch ? rawTextMatch[1] : '';
  const text = rawText.toLowerCase();
  
  // Extrair leito
  const bedMatch = rawText.match(/leito\s+(\d+)/i);
  const bed = bedMatch ? parseInt(bedMatch[1]) : null;
  
  // Extrair informações de ventilação
  const ventilation = {
    mode: null,
    fr: null,
    param2: null,
    fio2: null
  };
  
  // Detectar modo de ventilação
  if (text.includes('ventilação mecânica') || text.includes('ventilacao mecanica') || text.includes('vm')) {
    ventilation.mode = 'ventilacao mecanica';
  }
  
  // Extrair FR e param2 de padrões como "20x7" ou "20 por 7"
  const ventPattern = rawText.match(/(\d+)\s*[xX]\s*(\d+)/) || rawText.match(/(\d+)\s+por\s+(\d+)/);
  if (ventPattern) {
    ventilation.fr = parseInt(ventPattern[1]);
    ventilation.param2 = parseInt(ventPattern[2]);
  } else {
    // Tentar extrair FR separadamente
    const frMatch = rawText.match(/fr[:\s]+(\d+)/i) || rawText.match(/frequência respiratória[:\s]+(\d+)/i) || rawText.match(/(\d+)\s*(?:irpm|rpm)/i);
    if (frMatch) {
      ventilation.fr = parseInt(frMatch[1]);
    }
  }
  
  // Extrair FiO2 - suporta "FO2 de 05", "FiO2 50%", "fio2 0.5", etc.
  // "FO2 de 05" = 50% = 0.5 (zero à esquerda indica dezena)
  // "FO2 de 60" = 60% = 0.6
  const fio2Patterns = [
    /(?:fo2|fio2)[:\s]+(?:de\s+)?0(\d)/i,  // Padrão "FO2 de 05" ou "FO2 05"
    /(?:fo2|fio2)[:\s]+(\d+)\s*%/i,        // Padrão "FO2 50%"
    /(?:fo2|fio2)[:\s]+([0-9.]+)/i         // Padrão genérico
  ];
  
  for (const pattern of fio2Patterns) {
    const match = rawText.match(pattern);
    if (match) {
      let value = parseFloat(match[1]);
      // Se o padrão capturou um zero à esquerda (ex: "05"), multiplicar por 10
      if (pattern.source.includes('0(\\d)') && match[0].includes('0') && value < 10) {
        value = value * 10; // "05" -> 5 -> 50
      }
      // Converter porcentagem para decimal
      if (value <= 100 && value >= 1) {
        value = value / 100;
      }
      // Se já for decimal (0.5, 0.6, etc.), manter como está
      ventilation.fio2 = value;
      break;
    }
  }
  
  // Extrair drogas - melhorado para detectar abreviações
  const drugs = [];
  const drugPatterns = [
    { name: 'adrenalina', patterns: [/adrenalina[:\s]+0?(\d+)/i, /adrenalina[:\s]+([0-9.]+)/i] },
    { name: 'noradrenalina', patterns: [/noradrenalina[:\s]+0?(\d+)/i, /noradrenalina[:\s]+([0-9.]+)/i] },
    { name: 'dopamina', patterns: [/dopamina[:\s]+0?(\d+)/i, /dopamina[:\s]+([0-9.]+)/i] },
    { name: 'dobutamina', patterns: [/dobutamina[:\s]+0?(\d+)/i, /dobutamina[:\s]+([0-9.]+)/i] },
    { name: 'fentanil', patterns: [/fenta[:\s]+(\d+)/i, /fentanil[:\s]+(\d+)/i] },
    { name: 'midazolam', patterns: [/mida[:\s]+0?(\d+)/i, /midazolam[:\s]+(\d+)/i] },
  ];
  
  drugPatterns.forEach(({ name, patterns }) => {
    for (const pattern of patterns) {
      const match = rawText.match(pattern);
      if (match) {
        let dose = parseFloat(match[1]);
        // Para drogas vasoativas (adrenalina, noradrenalina), valores como "03" geralmente são 0.3
        // Para sedação (fentanil, midazolam), valores como "2" são geralmente 2 mesmo
        if ((name === 'adrenalina' || name === 'noradrenalina') && dose < 10 && dose >= 1) {
          // "03" = 0.3, "05" = 0.5
          dose = dose / 10;
        }
        // Se já for decimal (0.3, 0.5), manter como está
        
        drugs.push({
          name: name,
          dose: dose,
          unit: (name === 'adrenalina' || name === 'noradrenalina') ? 'mcg/kg/min' : null
        });
        break;
      }
    }
  });
  
  // Status clínico
  let statusClinico = null;
  if (text.includes('estável') || text.includes('estavel')) statusClinico = 'estavel';
  else if (text.includes('instável') || text.includes('instavel')) statusClinico = 'instavel';
  else if (text.includes('melhorando') || text.includes('melhor')) statusClinico = 'melhorando';
  else if (text.includes('piorando') || text.includes('pior')) statusClinico = 'piorando';
  else if (text.includes('crítico') || text.includes('critico')) statusClinico = 'critico';
  
  // Diurese
  const diureseAdequada = text.includes('diurese adequada') || text.includes('diurese boa') || text.includes('diurese ok');
  
  // Sinais vitais
  const sinaisVitaisBons = text.includes('sinais vitais bons') || text.includes('sinais vitais estão bons') || text.includes('pa estável');
  
  // Exames recentes
  let examesRecentes = null;
  if (text.includes('exames') && (text.includes('normal') || text.includes('normais'))) {
    examesRecentes = 'Exames de hoje relatados como normais.';
  }
  
  // Radiologia
  let radiologia = null;
  if (text.includes('raio x') || text.includes('raiox') || text.includes('radiografia')) {
    if (text.includes('tubo') && text.includes('posicionado')) {
      radiologia = 'Raio X de controle com tubo bem posicionado.';
    } else {
      radiologia = 'Raio X de controle realizado.';
    }
  }
  
  // Plano
  let plano = extractPlano(rawText);
  
  return {
    bed: bed,
    patientId: null,
    ventilation: ventilation,
    drugs: drugs,
    statusClinico: statusClinico,
    diureseAdequada: diureseAdequada || null,
    sinaisVitaisBons: sinaisVitaisBons || null,
    examesRecentes: examesRecentes,
    radiologia: radiologia,
    plano: plano,
    rawText: rawText
  };
}

function extractPlano(text) {
  const lowerText = text.toLowerCase();
  let plano = null;
  
  // Extrair plano mais específico
  if (lowerText.includes('manter') && lowerText.includes('antibiótico')) {
    plano = 'Manter antibioticos';
    if (lowerText.includes('ajustar') && lowerText.includes('drogas')) {
      plano += ' e ajustar drogas mais tarde conforme a pressao arterial';
    } else if (lowerText.includes('ajustar')) {
      plano += ' e ajustar conduta conforme evolução';
    }
  } else if (lowerText.includes('manter') || lowerText.includes('continuar')) {
    plano = 'Manter conduta atual';
  } else if (lowerText.includes('ajustar') && lowerText.includes('drogas')) {
    if (lowerText.includes('pressão') || lowerText.includes('pressao')) {
      plano = 'Ajustar drogas conforme pressao arterial';
    } else {
      plano = 'Ajustar drogas conforme evolução';
    }
  } else if (lowerText.includes('ajustar') || lowerText.includes('reduzir') || lowerText.includes('aumentar')) {
    plano = 'Ajustar conduta conforme evolução';
  }
  
  return plano;
}

/**
 * Monta o prompt para o LLM baseado no texto da nota
 * @param {string} rawText - Texto transcrito da nota de voz
 * @returns {string} Prompt formatado para o LLM
 */
function buildPrompt(rawText) {
  return `Você é um assistente que extrai dados estruturados de uma evolução clínica de UTI em português.

Receberá um texto transcrito de uma nota de voz, com informações como: leito, ventilação mecânica, drogas vasoativas e sedação, estado clínico, exames recentes e conduta.

Sua saída deve ser apenas um JSON válido, sem comentários, sem texto adicional, seguindo exatamente este schema:

{
  "bed": number | null,
  "patientId": string | null,
  "ventilation": {
    "mode": string | null,
    "fr": number | null,
    "param2": number | null,
    "fio2": number | null
  },
  "drugs": [
    {
      "name": string,
      "dose": number | null,
      "unit": string | null
    }
  ],
  "statusClinico": string | null,
  "diureseAdequada": boolean | null,
  "sinaisVitaisBons": boolean | null,
  "examesRecentes": string | null,
  "radiologia": string | null,
  "plano": string | null,
  "rawText": string
}

Regras:

Use null quando a informação não estiver presente de forma clara.

Para "param2", use o segundo parâmetro ventilatório relevante se for mencionado (ex.: volume corrente, PEEP, pressão de suporte – use o melhor julgamento com base no texto).

Para "fio2", converta frases como "FO2 de 05", "FiO2 50%" para um número entre 0 e 1 (ex.: 0.5).

Em "statusClinico", use resumos curtos, por exemplo: "estavel", "instavel", "melhorando", "piorando".

Em "unit" das drogas, se a unidade não estiver clara, use null ou escolha a mais provável para o contexto de UTI (por exemplo, "mcg/kg/min" para noradrenalina/adrenalina).

Em "examesRecentes" e "radiologia", faça um resumo curto em 1 frase cada, se houver informação.

Em "plano", resuma a conduta principal (ex.: manter antibiótico, ajustar drogas conforme pressão, programar desmame ventilatório).

Sempre copie o texto original completo para o campo "rawText".

Agora processe o seguinte texto e devolva apenas o JSON:

Texto: "${rawText}"`;
}

/**
 * Parseia uma nota de áudio em JSON estruturado
 * @param {string} rawText - Texto transcrito da nota de voz
 * @param {object} patientContext - Contexto do paciente (bed, patientId, unit)
 * @returns {Promise<object>} Dados estruturados
 */
export async function parseAudioNote(rawText, patientContext) {
  // Montar prompt
  const prompt = buildPrompt(rawText);
  
  // Chamar LLM
  const llmResponse = await callLLM(prompt);
  
  // Parsear resposta JSON
  let structuredData;
  try {
    structuredData = JSON.parse(llmResponse);
  } catch (error) {
    // Se não conseguir parsear, usar stub
    console.warn('Erro ao parsear resposta do LLM, usando stub:', error);
    structuredData = parseStubResponse(rawText);
  }
  
  // Mesclar com contexto do paciente - usar contexto como default quando texto não trouxer claramente
  // Se o texto não trouxer leito mas o contexto tiver, usar o contexto
  if (!structuredData.bed && patientContext.bed) {
    structuredData.bed = typeof patientContext.bed === 'number' ? patientContext.bed : parseInt(patientContext.bed);
  }
  
  // Se o texto trouxer leito diferente do contexto, priorizar o do texto (mais confiável)
  // Mas se não trouxer, usar o contexto
  if (patientContext.bed && !structuredData.bed) {
    structuredData.bed = typeof patientContext.bed === 'number' ? patientContext.bed : parseInt(patientContext.bed);
  }
  
  // Sempre usar patientId do contexto se disponível (mais confiável que extrair do texto)
  if (patientContext.patientId) {
    structuredData.patientId = patientContext.patientId;
  }
  
  // Garantir que rawText está presente
  structuredData.rawText = rawText;
  
  console.log("[LLM API] Dados estruturados finais:", JSON.stringify(structuredData, null, 2));
  
  return structuredData;
}

