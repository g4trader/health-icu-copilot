/**
 * Cliente LLM para melhorar redação de respostas
 * Usa Groq API (opcional) para aprimorar texto sem alterar fatos
 */

interface LLMRequest {
  systemPrompt: string;
  context: string;
  draftText: string;
}

/**
 * Melhora a redação de um texto usando Groq API
 * Em caso de erro, retorna o texto original
 */
export async function enhanceTextWithLLM(request: LLMRequest): Promise<string> {
  // Se não houver API key configurada, retorna o texto original
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return request.draftText;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: request.systemPrompt
          },
          {
            role: "user",
            content: `Contexto clínico:\n${request.context}\n\nTexto a melhorar (mantenha todos os fatos e números exatamente como estão):\n${request.draftText}\n\nMelhore a redação deste texto mantendo todos os fatos, números e dados clínicos exatamente como estão. Use linguagem médica apropriada e tom assistivo.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.warn("Groq API error, returning original text");
      return request.draftText;
    }

    const data = await response.json();
    const enhancedText = data.choices?.[0]?.message?.content;

    if (!enhancedText) {
      return request.draftText;
    }

    return enhancedText;
  } catch (error) {
    console.warn("Error calling Groq API:", error);
    return request.draftText;
  }
}

