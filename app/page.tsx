"use client";

import { useState } from "react";
import { PatientList } from "@/components/PatientList";
import { ChatPanel } from "@/components/ChatPanel";
import type { Patient } from "@/lib/mockData";

export default function HomePage() {
  const [focusedPatient, setFocusedPatient] = useState<Patient | null>(null);

  return (
    <main className="main-shell">
      <section className="panel" style={{ flex: 1 }}>
        <div className="panel-header">
          <div>
            <div className="panel-title">UTI • Hospital Moinhos de Vento</div>
            <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>
              Health ICU Copilot
            </h1>
          </div>
          <span className="badge" style={{ background: "#a7f3d0", color: "#065f46" }}>
            dados mockados
          </span>
        </div>
        <p
          style={{
            fontSize: "0.7rem",
            color: "#64748b",
            marginBottom: "0.75rem",
            fontStyle: "italic",
            fontWeight: 500
          }}
        >
          ⚠️ Protótipo com dados fictícios — uso exclusivo para demonstração hospitalar.
        </p>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#475569",
            marginBottom: "0.75rem",
            lineHeight: 1.5
          }}
        >
          Lista de pacientes priorizada por risco estimado de mortalidade em
          24h, combinando instabilidade aguda e resposta às terapias em curso.
        </p>

        <PatientList
          selectedPatientId={focusedPatient?.id ?? null}
          onSelectPatient={(p) => setFocusedPatient(p)}
        />
      </section>

      <section className="panel" style={{ flex: 1.3 }}>
        <div className="panel-header">
          <div>
            <div className="panel-title">Agente de apoio à decisão</div>
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 600 }}>
              Conversa com a UTI em linguagem natural
            </h2>
          </div>
          {focusedPatient && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <span className="badge" style={{ background: "#a7f3d0", color: "#065f46" }}>
                Foco no {focusedPatient.leito.split(" ")[1]} • {focusedPatient.nome}
              </span>
              <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>
                {focusedPatient.diagnosticoPrincipal}
              </span>
            </div>
          )}
        </div>
        <ChatPanel focusedPatient={focusedPatient} />
      </section>
    </main>
  );
}
