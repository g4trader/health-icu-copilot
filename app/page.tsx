"use client";

import { useState, useRef, useEffect } from "react";
import { mockPatients, getSortedByMortalityRisk24h, riskLevelFromScore } from "@/lib/mockData";

type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
  showIcuPanel?: boolean;
  topN?: number;
};

type AgentReply = {
  reply: string;
  showIcuPanel?: boolean;
  topN?: number;
};

function LoadingCard({ compact }: { compact?: boolean }) {
  const steps = [
    "Acessando prontuários eletrônicos…",
    "Buscando exames laboratoriais recentes…",
    "Analisando exames de imagem em busca de padrões…",
    "Revisando prescrições e doses calculadas…"
  ];

  if (compact) {
    return (
      <div className="loading-steps-compact">
        {steps.map((step, idx) => (
          <div key={idx} className="loading-step-compact">
            <div className="loading-dot"></div>
            <span>{step}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="result-card">
      <div className="loading-card-content">
        <div className="loading-title">Processando sua solicitação</div>
        <div className="loading-steps">
          {steps.map((step, idx) => (
            <div key={idx} className="loading-step">
              <div className="loading-dot"></div>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IcuPanel({ topN = 3 }: { topN?: number }) {
  const totalPacientes = mockPatients.length;
  const emRiscoAlto = mockPatients.filter((p) => p.riscoMortality24h >= 0.7).length;
  const emVM = mockPatients.filter((p) => p.emVentilacaoMecanica).length;
  const emVasopressor = mockPatients.filter((p) => p.emVasopressor).length;

  const topPacientes = getSortedByMortalityRisk24h().slice(0, topN);

  function getStatusText(patient: typeof mockPatients[0]): string {
    const parts: string[] = [];
    if (patient.emVentilacaoMecanica) parts.push("VM");
    if (patient.emVasopressor) parts.push("vasopressor");
    if (parts.length === 0) return "clinicamente estável";
    return parts.join(" + ");
  }

  return (
    <div className="icu-panel">
      <div className="kpi-grid">
        <div className="kpi-item">
          <div className="kpi-label">TOTAL DE PACIENTES</div>
          <div className="kpi-value">{totalPacientes}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-label">EM RISCO ALTO (24h)</div>
          <div className="kpi-value" style={{ color: "#b91c1c" }}>
            {emRiscoAlto}
          </div>
        </div>
        <div className="kpi-item">
          <div className="kpi-label">EM VENTILAÇÃO MECÂNICA</div>
          <div className="kpi-value">{emVM}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-label">EM VASOPRESSOR</div>
          <div className="kpi-value">{emVasopressor}</div>
        </div>
      </div>

      <div className="table-container">
        <table className="patients-table">
          <thead>
            <tr>
              <th>LEITO</th>
              <th>NOME</th>
              <th>IDADE</th>
              <th>RISCO 24h (%)</th>
              <th>SOFA</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {topPacientes.map((p) => (
              <tr key={p.id}>
                <td>{p.leito}</td>
                <td style={{ fontWeight: 600 }}>{p.nome}</td>
                <td>{p.idade} {p.idade === 1 ? "ano" : "anos"}</td>
                <td>
                  <span
                    className={`risk-pill ${riskLevelFromScore(p.riscoMortality24h) === "alto" ? "risk-high" : riskLevelFromScore(p.riscoMortality24h) === "moderado" ? "risk-medium" : "risk-low"}`}
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                  >
                    {(p.riscoMortality24h * 100).toFixed(0)}%
                  </span>
                </td>
                <td>{p.sofa}</td>
                <td>{getStatusText(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, loading]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);

    // Mensagem do usuário entra imediatamente no histórico
    setConversation((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: trimmed
      }
    ]);

    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          focusedPatientId: null
        })
      });

      if (!res.ok) {
        throw new Error("Erro na API do agent");
      }

      const data = (await res.json()) as AgentReply;

      setConversation((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: data.reply,
          showIcuPanel: data.showIcuPanel ?? false,
          topN: data.topN ?? 3
        }
      ]);
    } catch (error) {
      setConversation((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: "Tive um problema para processar essa pergunta no protótipo. Tente novamente em alguns instantes. Lembrando que este ambiente usa apenas dados fictícios para demonstração."
        }
      ]);
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
    <main className="shell">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
            HEALTH COPILOT +
          </h1>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            Interface de apoio à decisão para UTI Pediátrica
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            className="history-button"
            style={{
              padding: "0.5rem 1rem",
              background: "transparent",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              color: "#4b5563",
              cursor: "pointer",
              fontSize: "0.875rem"
            }}
          >
            Histórico
          </button>
          <span
            className="badge"
            style={{
              background: "#a7f3d0",
              color: "#047857",
              border: "1px solid #86efac"
            }}
          >
            PROTÓTIPO
          </span>
        </div>
      </header>

      <section className="content">
        {conversation.length === 0 && !loading && (
          <div className="hero">
            <h1>Como posso ajudar a UTI pediátrica hoje?</h1>
            <p>
              Faça uma pergunta sobre risco de mortalidade, prioridade de atendimento, exames laboratoriais, 
              imagens, prescrições ou perfil da unidade.
            </p>
          </div>
        )}

        {loading && conversation.length === 0 && <LoadingCard />}

        {conversation.length > 0 && (
          <div className="conversation">
            {conversation.map((msg) => (
              <div key={msg.id} className={`msg-container ${msg.role === "user" ? "msg-user-wrapper" : "msg-agent-wrapper"}`}>
                <div className={`msg-bubble ${msg.role === "user" ? "msg-user" : "msg-agent"}`}>
                  {msg.role === "agent" && msg.showIcuPanel && (
                    <div className="icu-panel-wrapper">
                      <IcuPanel topN={msg.topN} />
                    </div>
                  )}
                  <div className="msg-text" style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="msg-container msg-agent-wrapper">
                <div className="msg-bubble msg-agent">
                  <LoadingCard compact />
                </div>
              </div>
            )}

            <div ref={conversationEndRef} />
          </div>
        )}
      </section>

      <footer className="input-bar">
        <div className="input-container">
          <input
            className="main-input"
            type="text"
            placeholder="Ex.: Quais são os 3 pacientes com maior risco de mortalidade em 24h?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="ask-button"
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? "Processando..." : "Perguntar"}
          </button>
        </div>
      </footer>
    </main>
  );
}
