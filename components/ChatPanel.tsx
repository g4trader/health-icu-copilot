"use client";

import { useState, useRef, useEffect } from "react";
import type { Patient } from "@/lib/mockData";

type Role = "user" | "agent";

interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
}

interface Props {
  focusedPatient?: Patient | null;
}

export function ChatPanel({ focusedPatient }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      role: "agent",
      content:
        "Bom dia, doutor(a). Posso ajudar a priorizar os pacientes da UTI, apontar maior risco de mortalidade ou mostrar quem não está respondendo bem à prescrição. Como deseja começar?",
      createdAt: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim()) return;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          focusedPatientId: focusedPatient?.id ?? null
        })
      });

      if (!res.ok) {
        throw new Error("Falha ao consultar o agente.");
      }

      const data = (await res.json()) as { reply: string };
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: "agent",
        content: data.reply,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: "agent",
        content:
          "Tive um problema temporário ao processar sua pergunta. Tente novamente em instantes.",
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, agentMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="chat-shell">
      <div
        ref={logRef}
        className="chat-log"
        aria-label="Histórico de conversas com o agente"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-message ${
              m.role === "user" ? "chat-user" : "chat-agent"
            }`}
          >
            <div className="chat-meta">
              {m.role === "user" ? "Você" : "Health ICU Copilot"} •{" "}
              {new Date(m.createdAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
            <div>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-message chat-agent">
            <div className="chat-meta">Health ICU Copilot</div>
            <div>Processando dados da UTI em tempo quase real…</div>
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder={
            focusedPatient
              ? `Pergunte algo sobre o paciente do leito ${focusedPatient.leito} ou sobre a UTI inteira…`
              : "Ex.: Quem são os 3 pacientes com maior risco de mortalidade nas próximas 24h?"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="chat-button"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          type="button"
        >
          Enviar
        </button>
      </div>
      <p className="chat-meta" style={{ marginTop: "0.25rem" }}>
        Este protótipo usa dados fictícios e funciona apenas como demonstração
        de apoio à decisão. Não substitui o julgamento clínico.
      </p>
    </div>
  );
}
