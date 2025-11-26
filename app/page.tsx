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
            <h1 style={{ margin: 0, fontSize: "1.2rem" }}>
              Health ICU Copilot
            </h1>
          </div>
          <span className="badge">dados mockados</span>
        </div>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#cbd5f5",
            marginBottom: "0.75rem"
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
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
              Conversa com a UTI em linguagem natural
            </h2>
          </div>
          {focusedPatient && (
            <span className="badge">
              Foco no {focusedPatient.leito.split(" ")[1]} • {focusedPatient.nome}
            </span>
          )}
        </div>
        <ChatPanel focusedPatient={focusedPatient} />
      </section>
    </main>
  );
}
