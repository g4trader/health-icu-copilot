"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { mockPatients, getTopPatients, riskLevelFromScore, mockUnitProfile, type Patient } from "@/lib/mockData";
import type { ClinicalAgentType } from "@/lib/clinicalAgents";
import { ContextSnapshot } from "@/components/ContextSnapshot";
import { AppShell } from "@/components/AppShell";
import { ChatInput } from "@/components/ChatInput";
import { PatientContextBar } from "@/components/PatientContextBar";
import { usePreview } from "@/components/PreviewProvider";
import { MiniPatientSummary } from "@/components/MiniPatientSummary";
import { VitalsPanel } from "@/components/VitalsPanel";
import { TherapiesPanel } from "@/components/TherapiesPanel";
import { PatientPinButton } from "@/components/PatientPinButton";
import { useClinicalSession } from "@/lib/ClinicalSessionContext";

type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
  intent?: "PRIORITIZACAO" | "PACIENTE_ESPECIFICO" | "SINAIS_VITAIS" | "BALANCO_HIDRICO" | "PERFIL_UNIDADE" | "CALCULO_CLINICO" | "FALLBACK";
  topPatients?: Patient[];
  focusedPatient?: Patient;
  showIcuPanel?: boolean;
  showLabPanel?: boolean;
  showUnitProfilePanel?: boolean;
  type?: 'patient-overview';
  patientId?: string;
  showPatientMiniPanel?: boolean;
  showVitalsPanel?: boolean;
  showLabsPanel?: boolean;
  showTherapiesPanel?: boolean;
};

type AgentReply = {
  reply: string;
  showIcuPanel?: boolean;
  topN?: number;
  topPatients?: Patient[];
  focusedPatient?: Patient;
  showLabPanel?: boolean;
  showUnitProfilePanel?: boolean;
  intent?: string;
  agent?: ClinicalAgentType;
  agentName?: string;
  selectedPatientId?: string;
};

function LoadingSkeleton() {
  const steps = [
    "Acessando prontuários eletrônicos…",
    "Buscando exames laboratoriais recentes…",
    "Analisando exames de imagem…",
    "Revisando prescrições e doses calculadas…"
  ];

  return (
    <div className="loading-skeleton">
      {steps.map((step, idx) => (
        <div key={idx} className="loading-step">
          <div className="loading-dot"></div>
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
}

function PrioritizationPanel({ patients, onSelectPatient }: { patients: Patient[]; onSelectPatient?: (patientId: string) => void }) {
  return (
    <div className="prioritization-panel">
      <div className="panel-header">
        <h3 className="panel-title">TOP {patients.length} Pacientes por Prioridade</h3>
      </div>
      <div className="prioritization-list">
        {patients.map((p, idx) => {
          const riskLevel = riskLevelFromScore(p.riscoMortality24h);
          const lactato = p.labResults.find(l => l.tipo === "lactato");
          const lactatoValue = lactato && typeof lactato.valor === "number" ? lactato.valor : 0;
          
          return (
            <button
              key={p.id}
              type="button"
              className="prioritization-card prioritization-card-clickable"
              onClick={() => onSelectPatient?.(p.id)}
            >
              <div className="prioritization-rank">#{idx + 1}</div>
              <div className="prioritization-content">
                <div className="prioritization-header">
                  <div>
                    <div className="prioritization-name">{p.leito} • {p.nome}</div>
                    <div className="prioritization-meta">
                      {p.idade} {p.idade === 1 ? "ano" : "anos"} • {p.peso?.toFixed(1) || "N/A"} kg
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <PatientPinButton patient={p} />
                    <span className={`risk-pill ${riskLevel === "alto" ? "risk-high" : riskLevel === "moderado" ? "risk-medium" : "risk-low"}`}>
                      Risco {(p.riscoMortality24h * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="prioritization-diagnosis">{p.diagnosticoPrincipal}</div>
                <div className="prioritization-vitals">
                  <div className="vital-item">
                    <span className="vital-label">MAP:</span>
                    <span className={p.vitalSigns.pressaoArterialMedia < 65 ? "vital-critical" : ""}>
                      {p.vitalSigns.pressaoArterialMedia} mmHg
                    </span>
                  </div>
                  <div className="vital-item">
                    <span className="vital-label">FC:</span>
                    <span>{p.vitalSigns.frequenciaCardiaca} bpm</span>
                  </div>
                  <div className="vital-item">
                    <span className="vital-label">SpO2:</span>
                    <span className={p.vitalSigns.saturacaoO2 < 92 ? "vital-critical" : ""}>
                      {p.vitalSigns.saturacaoO2}%
                    </span>
                  </div>
                  {lactatoValue > 0 && (
                    <div className="vital-item">
                      <span className="vital-label">Lactato:</span>
                      <span className={lactatoValue >= 3 ? "vital-critical" : ""}>
                        {lactatoValue.toFixed(1)} mmol/L
                      </span>
                    </div>
                  )}
                </div>
                <div className="prioritization-support">
                  {p.medications.some(m => m.tipo === "vasopressor" && m.ativo) && (
                    <span className="support-badge vasopressor">Vasopressor</span>
                  )}
                  {p.ventilationParams && (
                    <span className="support-badge ventilation">VM</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LabPanel({ patients }: { patients: Patient[] }) {
  // Criar histórico mock de exames (últimos 2-3 valores por paciente)
  const getLabHistory = (patient: Patient) => {
    const lactato = patient.labResults.find(l => l.tipo === "lactato");
    const pcr = patient.labResults.find(l => l.tipo === "pcr");
    
    // Mock de histórico: valores anteriores simulados
    const lactatoHistory = lactato ? [
      { value: typeof lactato.valor === "number" ? (lactato.valor * 0.85).toFixed(1) : "N/A", date: "24h atrás" },
      { value: typeof lactato.valor === "number" ? lactato.valor.toFixed(1) : "N/A", date: "Atual", current: true }
    ] : [];
    
    const pcrHistory = pcr ? [
      { value: typeof pcr.valor === "number" ? (pcr.valor * 0.9).toFixed(0) : "N/A", date: "24h atrás" },
      { value: typeof pcr.valor === "number" ? pcr.valor.toFixed(0) : "N/A", date: "Atual", current: true }
    ] : [];

    return { lactato: lactatoHistory, pcr: pcrHistory, lactatoTrend: lactato?.tendencia };
  };

  const top3 = patients.slice(0, 3);

  return (
    <div className="lab-panel">
      <div className="panel-header">
        <h3 className="panel-title">Exames Laboratoriais com Tendência</h3>
      </div>
      <div className="lab-panel-content">
        {top3.map(patient => {
          const history = getLabHistory(patient);
          const lactato = patient.labResults.find(l => l.tipo === "lactato");
          const lactatoValue = lactato && typeof lactato.valor === "number" ? lactato.valor : null;
          const pcr = patient.labResults.find(l => l.tipo === "pcr");
          const pcrValue = pcr && typeof pcr.valor === "number" ? pcr.valor : null;

          return (
            <div key={patient.id} className="lab-patient-card">
              <div className="lab-patient-header">
                <div className="lab-patient-name">{patient.leito} • {patient.nome}</div>
                <div className="lab-patient-meta">{patient.idade} {patient.idade === 1 ? "ano" : "anos"} • {patient.peso?.toFixed(1) || "N/A"} kg</div>
              </div>
              
              {lactatoValue !== null && (
                <div className="lab-item">
                  <div className="lab-item-header">
                    <span className="lab-item-name">Lactato</span>
                    <span className={`lab-trend ${history.lactatoTrend === "subindo" ? "trend-up" : history.lactatoTrend === "caindo" ? "trend-down" : "trend-stable"}`}>
                      {history.lactatoTrend === "subindo" ? "↑" : history.lactatoTrend === "caindo" ? "↓" : "="}
                    </span>
                  </div>
                  <div className="lab-values">
                    {history.lactato.map((h, idx) => (
                      <div key={idx} className={`lab-value ${h.current ? "lab-current" : ""}`}>
                        <span className="lab-value-number">{h.value} mmol/L</span>
                        <span className="lab-value-date">{h.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pcrValue !== null && (
                <div className="lab-item">
                  <div className="lab-item-header">
                    <span className="lab-item-name">PCR</span>
                    <span className="lab-trend trend-stable">=</span>
                  </div>
                  <div className="lab-values">
                    {history.pcr.map((h, idx) => (
                      <div key={idx} className={`lab-value ${h.current ? "lab-current" : ""}`}>
                        <span className="lab-value-number">{h.value} mg/L</span>
                        <span className="lab-value-date">{h.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lactatoValue === null && pcrValue === null && (
                <div className="lab-no-data">Sem exames laboratoriais recentes</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnitProfilePanel() {
  const total = mockUnitProfile.totalPacientes;
  const percentages = {
    respiratorios: ((mockUnitProfile.casuistica.respiratorios / total) * 100).toFixed(0),
    sepse: ((mockUnitProfile.casuistica.sepse / total) * 100).toFixed(0),
    cardiopatias: ((mockUnitProfile.casuistica.cardiopatias / total) * 100).toFixed(0),
    trauma: ((mockUnitProfile.casuistica.trauma / total) * 100).toFixed(0)
  };

  return (
    <div className="unit-profile-panel">
      <div className="panel-header">
        <h3 className="panel-title">Perfil Epidemiológico da Unidade</h3>
        <div className="unit-profile-period">Últimos 30 dias</div>
      </div>

      <div className="unit-profile-sections">
        <div className="unit-section">
          <h4 className="unit-section-title">Casuística</h4>
          <div className="unit-casuistica">
            <div className="unit-casuistica-item">
              <div className="unit-casuistica-label">Respiratórios</div>
              <div className="unit-casuistica-bar">
                <div 
                  className="unit-casuistica-fill" 
                  style={{ width: `${percentages.respiratorios}%` }}
                ></div>
              </div>
              <div className="unit-casuistica-value">
                {mockUnitProfile.casuistica.respiratorios}/{total} ({percentages.respiratorios}%)
              </div>
            </div>
            <div className="unit-casuistica-item">
              <div className="unit-casuistica-label">Sepse</div>
              <div className="unit-casuistica-bar">
                <div 
                  className="unit-casuistica-fill" 
                  style={{ width: `${percentages.sepse}%` }}
                ></div>
              </div>
              <div className="unit-casuistica-value">
                {mockUnitProfile.casuistica.sepse}/{total} ({percentages.sepse}%)
              </div>
            </div>
            <div className="unit-casuistica-item">
              <div className="unit-casuistica-label">Cardiopatias</div>
              <div className="unit-casuistica-bar">
                <div 
                  className="unit-casuistica-fill" 
                  style={{ width: `${percentages.cardiopatias}%` }}
                ></div>
              </div>
              <div className="unit-casuistica-value">
                {mockUnitProfile.casuistica.cardiopatias}/{total} ({percentages.cardiopatias}%)
              </div>
            </div>
            <div className="unit-casuistica-item">
              <div className="unit-casuistica-label">Trauma</div>
              <div className="unit-casuistica-bar">
                <div 
                  className="unit-casuistica-fill" 
                  style={{ width: `${percentages.trauma}%` }}
                ></div>
              </div>
              <div className="unit-casuistica-value">
                {mockUnitProfile.casuistica.trauma}/{total} ({percentages.trauma}%)
              </div>
            </div>
          </div>
        </div>

        <div className="unit-section">
          <h4 className="unit-section-title">Germes Mais Frequentes</h4>
          <div className="unit-germs">
            {mockUnitProfile.germesMaisFrequentes.map((germe, idx) => (
              <div key={idx} className="unit-germ-item">
                <div className="unit-germ-name">{germe.nome}</div>
                <div className="unit-germ-freq">{germe.frequencia} {germe.frequencia === 1 ? "caso" : "casos"}</div>
                {germe.resistencia && germe.resistencia.length > 0 && (
                  <div className="unit-germ-resistance">
                    Resistência: {germe.resistencia.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="unit-section">
          <h4 className="unit-section-title">Perfil de Resistência Antimicrobiana</h4>
          <div className="unit-resistance">
            {mockUnitProfile.perfilResistencia.map((perfil, idx) => (
              <div key={idx} className="unit-resistance-item">
                <div className="unit-resistance-header">
                  <span className="unit-resistance-antibiotic">{perfil.antibiotico}</span>
                  <span className="unit-resistance-rate">{(perfil.taxaResistencia * 100).toFixed(0)}%</span>
                </div>
                <div className="unit-resistance-germs">
                  {perfil.germes.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientDetailPanel({ patient }: { patient: Patient }) {
  const lactato = patient.labResults.find(l => l.tipo === "lactato");
  const lactatoValue = lactato && typeof lactato.valor === "number" ? lactato.valor : 0;
  const temVasopressor = patient.medications.some(m => m.tipo === "vasopressor" && m.ativo);
  const antibioticos = patient.medications.filter(m => m.tipo === "antibiotico" && m.ativo);

  return (
    <div className="patient-detail-panel">
      <div className="panel-header">
        <h3 className="panel-title">{patient.leito} • {patient.nome}</h3>
        <span className={`risk-pill ${riskLevelFromScore(patient.riscoMortality24h) === "alto" ? "risk-high" : riskLevelFromScore(patient.riscoMortality24h) === "moderado" ? "risk-medium" : "risk-low"}`}>
          Risco {(patient.riscoMortality24h * 100).toFixed(0)}%
        </span>
      </div>

      <div className="patient-detail-sections">
        <div className="detail-section">
          <h4 className="detail-section-title">Resumo</h4>
          <div className="detail-content">
            <p><strong>Idade:</strong> {patient.idade} {patient.idade === 1 ? "ano" : "anos"} • <strong>Peso:</strong> {patient.peso?.toFixed(1) || "N/A"} kg</p>
            <p><strong>Diagnóstico:</strong> {patient.diagnosticoPrincipal}</p>
            <p><strong>Dias de UTI:</strong> {patient.diasDeUTI} {patient.diasDeUTI === 1 ? "dia" : "dias"}</p>
          </div>
        </div>

        <div className="detail-section">
          <h4 className="detail-section-title">Sinais Vitais</h4>
          <div className="vitals-grid">
            <div className="vital-card">
              <div className="vital-label">Temperatura</div>
              <div className="vital-value">{patient.vitalSigns.temperatura.toFixed(1)}°C</div>
            </div>
            <div className="vital-card">
              <div className="vital-label">FC</div>
              <div className="vital-value">{patient.vitalSigns.frequenciaCardiaca} bpm</div>
            </div>
            <div className="vital-card">
              <div className="vital-label">FR</div>
              <div className="vital-value">{patient.vitalSigns.frequenciaRespiratoria} rpm</div>
            </div>
            <div className="vital-card">
              <div className="vital-label">MAP</div>
              <div className={`vital-value ${patient.vitalSigns.pressaoArterialMedia < 65 ? "vital-critical" : ""}`}>
                {patient.vitalSigns.pressaoArterialMedia} mmHg
              </div>
            </div>
            <div className="vital-card">
              <div className="vital-label">SpO2</div>
              <div className={`vital-value ${patient.vitalSigns.saturacaoO2 < 92 ? "vital-critical" : ""}`}>
                {patient.vitalSigns.saturacaoO2}%
              </div>
            </div>
            {patient.vitalSigns.escalaGlasgow && (
              <div className="vital-card">
                <div className="vital-label">GCS</div>
                <div className="vital-value">{patient.vitalSigns.escalaGlasgow}</div>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h4 className="detail-section-title">Balanço Hídrico (24h)</h4>
          <div className="fluid-balance-grid">
            <div className="fluid-item">
              <div className="fluid-label">Entrada</div>
              <div className="fluid-value">{patient.fluidBalance.entrada24h.toFixed(1)} ml/kg/h</div>
            </div>
            <div className="fluid-item">
              <div className="fluid-label">Saída</div>
              <div className="fluid-value">{patient.fluidBalance.saida24h.toFixed(1)} ml/kg/h</div>
            </div>
            <div className="fluid-item">
              <div className="fluid-label">Balanço</div>
              <div className={`fluid-value ${patient.fluidBalance.balanco24h > 3 ? "fluid-positive" : patient.fluidBalance.balanco24h < -1 ? "fluid-negative" : ""}`}>
                {patient.fluidBalance.balanco24h > 0 ? "+" : ""}{patient.fluidBalance.balanco24h.toFixed(1)} ml/kg/h
              </div>
            </div>
            <div className="fluid-item">
              <div className="fluid-label">Diurese</div>
              <div className={`fluid-value ${patient.fluidBalance.diurese < 1 ? "fluid-critical" : ""}`}>
                {patient.fluidBalance.diurese.toFixed(1)} ml/kg/h
              </div>
            </div>
          </div>
        </div>

        {temVasopressor && (
          <div className="detail-section">
            <h4 className="detail-section-title">Drogas Vasoativas</h4>
            <div className="medications-list">
              {patient.medications
                .filter(m => m.tipo === "vasopressor" && m.ativo)
                .map(m => (
                  <div key={m.id} className="medication-item">
                    <strong>{m.nome}</strong>: {m.dose} {m.unidade}
                  </div>
                ))}
            </div>
          </div>
        )}

        {antibioticos.length > 0 && (
          <div className="detail-section">
            <h4 className="detail-section-title">Antibióticos</h4>
            <div className="medications-list">
              {antibioticos.map(m => (
                <div key={m.id} className="medication-item">
                  <strong>{m.nome}</strong>: {m.dose} {m.unidade} • D{m.diasDeUso}
                </div>
              ))}
            </div>
          </div>
        )}

        {patient.ventilationParams && (
          <div className="detail-section">
            <h4 className="detail-section-title">Ventilação Mecânica</h4>
            <div className="ventilation-params">
              <div className="vent-param">
                <span className="vent-label">Modo:</span>
                <span className="vent-value">{patient.ventilationParams.modo}</span>
              </div>
              <div className="vent-param">
                <span className="vent-label">FiO2:</span>
                <span className="vent-value">{patient.ventilationParams.fiO2}%</span>
              </div>
              <div className="vent-param">
                <span className="vent-label">PEEP:</span>
                <span className="vent-value">{patient.ventilationParams.peep} cmH2O</span>
              </div>
              {patient.ventilationParams.pressaoSuporte && (
                <div className="vent-param">
                  <span className="vent-label">PS:</span>
                  <span className="vent-value">{patient.ventilationParams.pressaoSuporte} cmH2O</span>
                </div>
              )}
              {patient.ventilationParams.paO2FiO2 && (
                <div className="vent-param">
                  <span className="vent-label">PaO2/FiO2:</span>
                  <span className="vent-value">{patient.ventilationParams.paO2FiO2}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {lactatoValue > 0 && (
          <div className="detail-section">
            <h4 className="detail-section-title">Exames Laboratoriais</h4>
            <div className="lab-results">
              <div className="lab-item">
                <span className="lab-label">Lactato:</span>
                <span className={`lab-value ${lactatoValue >= 3 ? "lab-critical" : ""}`}>
                  {lactatoValue.toFixed(1)} mmol/L
                </span>
                {lactato?.tendencia && (
                  <span className="lab-trend">({lactato.tendencia})</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const conversationEndRef = useRef<HTMLDivElement>(null);
  
  // Contexto de sessão clínica (mock)
  const sessionIdRef = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [currentAgent, setCurrentAgent] = useState<"default" | "cardiology" | "pneumology" | "neurology">("default");
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const activePatient = mockPatients.find(p => p.id === activePatientId) || null;
  const { setPreview, setOnSelectPatient } = usePreview();
  const { setActivePatient: setActivePatientFromContext } = useClinicalSession();

  // Sincronizar activePatientId com o contexto
  useEffect(() => {
    setActivePatientFromContext(activePatientId || undefined);
  }, [activePatientId, setActivePatientFromContext]);

  // Função para mostrar overview inline no chat (sem drawer) - usado no menu do input
  const showPatientOverviewInline = useCallback((patientId: string) => {
    setActivePatientId(patientId);
    const patient = mockPatients.find(p => p.id === patientId);
    if (!patient) {
      console.error('Paciente não encontrado com ID:', patientId);
      return;
    }

    // Adicionar mensagem automática no chat com overview (sem abrir drawer)
    const overviewMessage: Message = {
      id: crypto.randomUUID(),
      role: "agent",
      text: `Mostrando overview do paciente ${patient.leito} • ${patient.nome}.`,
      type: 'patient-overview',
      patientId: patientId,
      focusedPatient: patient,
      showPatientMiniPanel: true,
      showVitalsPanel: true,
      showLabsPanel: true,
      showTherapiesPanel: true
    };
    setConversation((prev) => [...prev, overviewMessage]);
  }, [setConversation]);

  // Função para abrir drawer com paciente (usado em cards/big numbers)
  const openPatientPreviewDrawer = useCallback((patientId: string) => {
    setActivePatientId(patientId);
    const patient = mockPatients.find(p => p.id === patientId);
    if (!patient) {
      console.error('Paciente não encontrado com ID:', patientId);
      return;
    }
    setPreview('patient', { patient });
  }, [setPreview]);

  // Configurar handler de seleção de paciente (para cards/big numbers - abre drawer)
  useEffect(() => {
    const handleSelectPatient = (patientId: string) => {
      console.log('Selecionando paciente:', patientId); // Debug
      openPatientPreviewDrawer(patientId);
    };
    setOnSelectPatient(handleSelectPatient);
    return () => setOnSelectPatient(undefined);
  }, [setOnSelectPatient, openPatientPreviewDrawer]);

  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, loading]);

  async function handleSend(messageText?: string) {
    const textToSend = messageText || input.trim();
    if (!textToSend || loading) return;

    setLoading(true);

    // Mensagem do usuário entra imediatamente no histórico
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: textToSend
    };
    setConversation((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          focusedPatientId: activePatientId,
          sessionId: sessionIdRef.current,
          userId: "user-mock",
          role: "plantonista",
          unidade: "UTI Pediátrica A",
          turno: "manhã",
          currentAgent: currentAgent
        })
      });

      if (!res.ok) {
        throw new Error("Erro na API do agent");
      }

      const data = (await res.json()) as AgentReply;

      // Atualizar agente se mudou
      if (data.agent && data.agent !== currentAgent) {
        setCurrentAgent(data.agent);
      }

      // Se o backend retornou um selectedPatientId, atualizar o paciente ativo
      if (data.selectedPatientId) {
        setActivePatientId(data.selectedPatientId);
      }

      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: "agent",
        text: data.reply,
        intent: data.intent as Message["intent"],
        topPatients: data.topPatients,
        focusedPatient: data.focusedPatient,
        showIcuPanel: data.showIcuPanel,
        showLabPanel: data.showLabPanel,
        showUnitProfilePanel: data.showUnitProfilePanel
      };

      setConversation((prev) => [...prev, agentMessage]);
    } catch (error) {
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: "agent",
        text: "Tive um problema para processar essa pergunta no protótipo. Tente novamente em alguns instantes. Lembrando que este ambiente usa apenas dados fictícios para demonstração."
      };
      setConversation((prev) => [...prev, agentMessage]);
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

  function handlePromptClick(prompt: string) {
    // Enviar a pergunta automaticamente
    void handleSend(prompt);
  }

  return (
    <div className="app-wrapper">
      <header className="hc-topbar">
        <div className="hc-brand">
          <img src="/favicon.png" alt="Health Copilot" className="hc-icon" />
          <div className="hc-brand-text">
            <div className="hc-title">
              HEALTH COPILOT<span className="hc-reg">®</span>
            </div>
            <div className="hc-subtitle">UTI Pediátrica</div>
          </div>
        </div>

        <div className="hc-actions">
          <button className="hc-icon-btn" type="button" aria-label="Histórico">
            <span>⏱</span>
            <span className="hc-icon-btn-label">Histórico</span>
          </button>
          <span className="hc-badge">PROTÓTIPO</span>
        </div>
      </header>

      <AppShell>
        <div className="main-chat-content">
          <main className="chat-content-scrollable">
            <div className="chat-container">
              {conversation.length === 0 && !loading && (
                <div className="hero">
                  <h1 className="hero-title">Como posso ajudar a UTI pediátrica hoje?</h1>
                  <p className="hero-subtitle">
                    Faça uma pergunta sobre risco de mortalidade, prioridade de atendimento, exames laboratoriais, 
                    imagens, prescrições ou perfil da unidade.
                  </p>
                  <ContextSnapshot onPromptClick={handlePromptClick} />
                </div>
              )}

              {conversation.length > 0 && (
                <div className="conversation">
                  <PatientContextBar 
                    activePatient={activePatient} 
                    onClear={() => setActivePatientId(null)} 
                  />
                  {conversation.map((msg) => (
                  <div key={msg.id} className={`msg-container ${msg.role === "user" ? "msg-user-wrapper" : "msg-agent-wrapper"}`}>
                    <div className={`msg-bubble ${msg.role === "user" ? "msg-user" : "msg-agent"}`}>
                      <div className="msg-text" style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                      
                      {msg.role === "agent" && msg.showIcuPanel && msg.topPatients && msg.topPatients.length > 0 && (
                        <PrioritizationPanel 
                          patients={msg.topPatients} 
                          onSelectPatient={(patientId) => {
                            openPatientPreviewDrawer(patientId);
                          }}
                        />
                      )}
                      
                      {msg.role === "agent" && msg.focusedPatient && !msg.type && (
                        <PatientDetailPanel patient={msg.focusedPatient} />
                      )}

                      {/* Overview do paciente com micro-painéis */}
                      {msg.role === "agent" && msg.type === 'patient-overview' && msg.focusedPatient && (
                        <>
                          {msg.showPatientMiniPanel && (
                            <MiniPatientSummary patient={msg.focusedPatient} />
                          )}
                          {msg.showVitalsPanel && (
                            <VitalsPanel patient={msg.focusedPatient} />
                          )}
                          {msg.showLabsPanel && (
                            <LabPanel patients={msg.focusedPatient ? [msg.focusedPatient] : []} />
                          )}
                          {msg.showTherapiesPanel && (
                            <TherapiesPanel patient={msg.focusedPatient} />
                          )}
                        </>
                      )}

                      {msg.role === "agent" && msg.showLabPanel && msg.topPatients && msg.topPatients.length > 0 && !msg.type && (
                        <LabPanel patients={msg.topPatients} />
                      )}

                      {msg.role === "agent" && msg.showUnitProfilePanel && (
                        <UnitProfilePanel />
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="msg-container msg-agent-wrapper">
                    <div className="msg-bubble msg-agent">
                      <LoadingSkeleton />
                    </div>
                  </div>
                )}

                  <div ref={conversationEndRef} />
          </div>
              )}
            </div>
          </main>

          <footer className="chat-input-footer">
            <div className="chat-input-footer-inner">
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                onKeyDown={handleKeyDown}
                loading={loading}
                currentAgent={currentAgent}
                onAgentChange={setCurrentAgent}
                patients={mockPatients}
                onSelectPatientFromUI={(patientId) => {
                  showPatientOverviewInline(patientId);
                }}
              />
            </div>
          </footer>
        </div>
      </AppShell>
        </div>
  );
}
