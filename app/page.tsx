"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { mockPatients, getTopPatients, riskLevelFromScore, mockUnitProfile, type Patient } from "@/lib/mockData";
import { clinicalAgents, type ClinicalAgentType, type ClinicalAgentId } from "@/lib/clinicalAgents";
import { ContextSnapshot } from "@/components/ContextSnapshot";
import { AppShell } from "@/components/AppShell";
import { ChatInput } from "@/components/ChatInput";
import { PatientContextBar } from "@/components/PatientContextBar";
import { usePreview } from "@/components/PreviewProvider";
import { MiniPatientSummary } from "@/components/MiniPatientSummary";
import { SpecialistOpinionMessage } from "@/components/chat/SpecialistOpinionMessage";
import { VitalsPanel } from "@/components/VitalsPanel";
import { TherapiesPanel } from "@/components/TherapiesPanel";
import { PatientDetailPanel } from "@/components/PatientDetailPanel";
import { PatientPinButton } from "@/components/PatientPinButton";
import { PatientAgentButton } from "@/components/PatientAgentButton";
import { PatientOpinionBadges } from "@/components/PatientOpinionBadges";
import { useClinicalSession } from "@/lib/ClinicalSessionContext";

type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
  intent?: "PRIORITIZACAO" | "PACIENTE_ESPECIFICO" | "SINAIS_VITAIS" | "BALANCO_HIDRICO" | "PERFIL_UNIDADE" | "CALCULO_CLINICO" | "AGENTE_PARECER" | "FALLBACK";
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
  agentId?: ClinicalAgentId;
  specialistOpinion?: import('@/types/SpecialistOpinion').SpecialistOpinion;
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
  agentId?: ClinicalAgentId;
  selectedPatientId?: string;
  showPatientOverview?: boolean;
  showVitalsPanel?: boolean;
  showLabsPanel?: boolean;
  showTherapiesPanel?: boolean;
  specialistOpinion?: import('@/types/SpecialistOpinion').SpecialistOpinion;
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

function PrioritizationPanel({ 
  patients, 
  onSelectPatient,
  onRequestOpinion 
}: { 
  patients: Patient[]; 
  onSelectPatient?: (patientId: string) => void;
  onRequestOpinion?: (patientId: string, agentId: ClinicalAgentId) => void;
}) {
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
                    {onRequestOpinion && (
                      <PatientAgentButton 
                        patientId={p.id} 
                        onRequestOpinion={onRequestOpinion}
                      />
                    )}
                    <span className={`risk-pill ${riskLevel === "alto" ? "risk-high" : riskLevel === "moderado" ? "risk-medium" : "risk-low"}`}>
                      Risco {(p.riscoMortality24h * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="prioritization-diagnosis">{p.diagnosticoPrincipal}</div>
                <PatientOpinionBadges patientId={p.id} />
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
  const { setActivePatient: setActivePatientFromContext, addOpinion } = useClinicalSession();

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

  const handleSend = useCallback(async (messageText?: string, agentIdParam?: ClinicalAgentId, patientIdParam?: string) => {
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

    // Usar patientIdParam se fornecido, senão usar activePatientId
    const patientIdToUse = patientIdParam || activePatientId;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          focusedPatientId: patientIdToUse,
          sessionId: sessionIdRef.current,
          userId: "user-mock",
          role: "plantonista",
          unidade: "UTI Pediátrica A",
          turno: "manhã",
          currentAgent: currentAgent,
          agentId: agentIdParam,
          patientId: patientIdToUse || undefined
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
        showUnitProfilePanel: data.showUnitProfilePanel,
        agentId: data.agentId,
        showPatientMiniPanel: data.showPatientOverview,
        showVitalsPanel: data.showVitalsPanel,
        showLabsPanel: data.showLabsPanel,
        showTherapiesPanel: data.showTherapiesPanel,
        specialistOpinion: data.specialistOpinion
      };

      setConversation((prev) => [...prev, agentMessage]);
      
      // Registrar parecer se for de especialista
      if (data.agentId && data.agentId !== 'general' && data.focusedPatient) {
        addOpinion(data.focusedPatient.id, data.agentId);
      }
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
  }, [activePatientId, sessionIdRef, currentAgent, setConversation, setInput, loading, addOpinion]);

  /**
   * Função utilitária para solicitar parecer de agente especialista
   * Dispara uma mensagem automática no chat que será processada pelo backend
   */
  const requestSpecialistOpinion = useCallback((agentId: ClinicalAgentId, patientId: string) => {
    const patient = mockPatients.find(p => p.id === patientId);
    if (!patient) {
      console.error('Paciente não encontrado');
      return;
    }

    const agent = clinicalAgents[agentId];
    
    // Construir mensagem automática para o chat
    const message = `${agent.name}, avalie o caso do paciente ${patient.leito} - ${patient.nome} (${patient.idade} ${patient.idade === 1 ? 'ano' : 'anos'}, ${patient.diagnosticoPrincipal}) e sugira condutas ou exames complementares.`;

    // Disparar mensagem usando o fluxo de envio do chat (simulando que o usuário digitou isso)
    // Passar explicitamente agentId e patientId para garantir detecção correta da intenção
    handleSend(message, agentId, patientId);
  }, [handleSend]);

  // Função para solicitar parecer de agente especialista (mantida para compatibilidade com PatientAgentButton)
  const handleRequestAgentOpinion = useCallback((patientId: string, agentId: ClinicalAgentId) => {
    requestSpecialistOpinion(agentId, patientId);
  }, [requestSpecialistOpinion]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }, [handleSend]);

  const handlePromptClick = useCallback((prompt: string) => {
    // Enviar a pergunta automaticamente
    void handleSend(prompt);
  }, [handleSend]);

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
                      
                      {/* Parecer de agente com visual premium */}
                      {msg.role === "agent" && msg.intent === 'AGENTE_PARECER' && msg.specialistOpinion && (
                        <SpecialistOpinionMessage opinion={msg.specialistOpinion} />
                      )}
                      
                      {/* Fallback: Parecer de agente com micro dashboards (formato antigo) */}
                      {msg.role === "agent" && msg.intent === 'AGENTE_PARECER' && !msg.specialistOpinion && msg.focusedPatient && (
                        <>
                          {msg.showPatientMiniPanel && (
                            <MiniPatientSummary 
                              patient={msg.focusedPatient}
                              onRequestOpinion={handleRequestAgentOpinion}
                            />
                          )}
                          {msg.showVitalsPanel && (
                            <VitalsPanel patient={msg.focusedPatient} />
                          )}
                          {msg.showLabsPanel && (
                            <LabPanel patients={[msg.focusedPatient]} />
                          )}
                          {msg.showTherapiesPanel && (
                            <TherapiesPanel patient={msg.focusedPatient} />
                          )}
                        </>
                      )}
                      
                      {msg.role === "agent" && msg.showIcuPanel && msg.topPatients && msg.topPatients.length > 0 && (
                        <PrioritizationPanel 
                          patients={msg.topPatients} 
                          onSelectPatient={(patientId) => {
                            openPatientPreviewDrawer(patientId);
                          }}
                          onRequestOpinion={handleRequestAgentOpinion}
                        />
                      )}
                      
                      {msg.role === "agent" && msg.focusedPatient && !msg.type && (
                        <PatientDetailPanel patient={msg.focusedPatient} />
                      )}

                      {/* Overview do paciente com micro-painéis */}
                      {msg.role === "agent" && msg.type === 'patient-overview' && msg.focusedPatient && (
                        <>
                          {msg.showPatientMiniPanel && (
                            <MiniPatientSummary 
                              patient={msg.focusedPatient}
                              onRequestOpinion={handleRequestAgentOpinion}
                            />
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
