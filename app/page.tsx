"use client";

import { useState } from "react";
import { mockPatients, getSortedByMortalityRisk24h, riskLevelFromScore } from "@/lib/mockData";

function LoadingCard() {
  const steps = [
    "Acessando prontuários eletrônicos…",
    "Buscando exames laboratoriais recentes…",
    "Analisando exames de imagem em busca de padrões…",
    "Revisando prescrições e doses calculadas…"
  ];

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

export default function HomePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const [lastAnswer, setLastAnswer] = useState("");
  const [hasAnswer, setHasAnswer] = useState(false);

  // Calcular KPIs
  const totalPacientes = mockPatients.length;
  const emRiscoAlto = mockPatients.filter((p) => p.riscoMortality24h >= 0.7).length;
  const emVM = mockPatients.filter((p) => p.emVentilacaoMecanica).length;
  const emVasopressor = mockPatients.filter((p) => p.emVasopressor).length;

  // Top 5 pacientes por risco
  const topPacientes = getSortedByMortalityRisk24h().slice(0, 5);

  function getStatusText(patient: typeof mockPatients[0]): string {
    const parts: string[] = [];
    if (patient.emVentilacaoMecanica) parts.push("VM");
    if (patient.emVasopressor) parts.push("vasopressor");
    if (parts.length === 0) return "clinicamente estável";
    return parts.join(" + ");
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          focusedPatientId: null
        })
      });

      if (!res.ok) {
        throw new Error("Falha ao consultar o agente.");
      }

      const data = (await res.json()) as { reply: string };
      setLastQuestion(question);
      setLastAnswer(data.reply);
      setHasAnswer(true);
    } catch (error) {
      setLastQuestion(question);
      setLastAnswer(
        "Tive um problema temporário ao processar sua pergunta. Tente novamente em instantes."
      );
      setHasAnswer(true);
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
        {loading ? (
          <LoadingCard />
        ) : hasAnswer ? (
          <div className="result-card">
            <div className="question-bubble">{lastQuestion}</div>

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

            <div className="answer-summary">
              <div className="answer-content">{lastAnswer}</div>
            </div>
          </div>
        ) : (
          <div className="hero">
            <h1>Como posso ajudar a UTI pediátrica hoje?</h1>
            <p>
              Faça uma pergunta sobre risco de mortalidade, prioridade de atendimento, exames laboratoriais, 
              imagens, prescrições ou perfil da unidade.
            </p>
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
