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
import { PatientFocusMode } from "@/components/PatientFocusMode";
import { SpecialistOpinionMessage } from "@/components/chat/SpecialistOpinionMessage";
import { AgentOpinionBlock } from "@/components/ui/AgentOpinionBlock";
import { RadiologyReportCard } from "@/components/ui/RadiologyReportCard";
import { MicroDashboardRenderer } from "@/components/ui/MicroDashboardRenderer";
import { MicroDashboardV2Renderer } from "@/components/ui/MicroDashboardV2Renderer";
import { PatientTimelineSummary } from "@/components/PatientTimelineSummary";
import { PatientMiniTrends } from "@/components/ui/PatientMiniTrends";
import { VitalsPanel } from "@/components/VitalsPanel";
import { TherapiesPanel } from "@/components/TherapiesPanel";
import { PatientDetailPanel } from "@/components/PatientDetailPanel";
import { PatientPinButton } from "@/components/PatientPinButton";
import { PatientOpinionBadges } from "@/components/PatientOpinionBadges";
import { PatientCard } from "@/components/patients/PatientCard";
import { useClinicalSession } from "@/lib/ClinicalSessionContext";
import type { MicroDashboardPayload } from "@/types/MicroDashboard";

type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
  intent?: "PRIORITIZACAO" | "PACIENTE_ESPECIFICO" | "SINAIS_VITAIS" | "BALANCO_HIDRICO" | "PERFIL_UNIDADE" | "CALCULO_CLINICO" | "AGENTE_PARECER" | "RADIOLOGISTA_VIRTUAL" | "FALLBACK";
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
  agentId?: ClinicalAgentId | 'radiology';
  specialistOpinion?: import('@/types/SpecialistOpinion').SpecialistOpinion;
  radiologyReport?: import('@/types/RadiologyOpinion').RadiologyReport;
  microDashboard?: MicroDashboardPayload;
  microDashboards?: MicroDashboardPayload[];
  // Novos campos do LLM
  llmAnswer?: import('@/types/LlmPatientAnswer').LlmPatientAnswer;
  focusPayload?: import('@/types/PatientFocusPayload').PatientFocusPayload;
  microDashboardsV2?: import('@/types/MicroDashboardV2').MicroDashboard[];
  timelineHighlights?: import('@/types/LlmPatientAnswer').TimelineHighlight[];
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
  radiologyReport?: import('@/types/RadiologyOpinion').RadiologyReport;
  microDashboard?: MicroDashboardPayload;
  microDashboards?: MicroDashboardPayload[];
  // Novos campos do LLM
  llmAnswer?: import('@/types/LlmPatientAnswer').LlmPatientAnswer;
  focusPayload?: import('@/types/PatientFocusPayload').PatientFocusPayload;
  microDashboardsV2?: import('@/types/MicroDashboardV2').MicroDashboard[];
  timelineHighlights?: import('@/types/LlmPatientAnswer').TimelineHighlight[];
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
  onExpandPatient
}: { 
  patients: Patient[]; 
  onSelectPatient?: (patientId: string) => void;
  onExpandPatient?: (patientId: string) => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-slate-900 font-semibold text-base">TOP {patients.length} Pacientes por Prioridade</h3>
      </div>
      <div className="flex flex-col gap-3 md:gap-4">
        {patients.map((p, idx) => (
          <div key={p.id} className="relative">
            <div className="absolute -left-2 top-4 flex items-center justify-center w-6 h-6 bg-slate-100 border border-slate-300 rounded-full text-xs font-semibold text-slate-700 z-10">
              {idx + 1}
            </div>
            <PatientCard
              patient={p}
              onSelect={(patientId) => onSelectPatient?.(patientId)}
              showPin={true}
              className="ml-6"
            />
          </div>
        ))}
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
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Contexto de sessão clínica (mock)
  const sessionIdRef = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [currentAgent, setCurrentAgent] = useState<ClinicalAgentType>("default");
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const activePatient = mockPatients.find(p => p.id === activePatientId) || null;
  const expandedPatient = mockPatients.find(p => p.id === expandedPatientId) || null;
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

  // Scroll para o topo da última mensagem do agente quando uma nova resposta é renderizada
  useEffect(() => {
    if (conversation.length > 0 && !loading) {
      const lastMessage = conversation[conversation.length - 1];
      if (lastMessage.role === "agent") {
        const messageRef = messageRefs.current.get(lastMessage.id);
        if (messageRef) {
          // Pequeno delay para garantir que o DOM foi atualizado
          setTimeout(() => {
            messageRef.scrollIntoView({ 
              behavior: "smooth", 
              block: "start" 
            });
          }, 100);
        }
      }
    }
  }, [conversation, loading]);

  const handleSend = useCallback(async (messageText?: string, agentIdParam?: ClinicalAgentId | 'radiology', patientIdParam?: string) => {
    console.log("[ChatPanel] handleSend called with:", { messageText, input, loading });
    const textToSend = messageText || input.trim();
    if (!textToSend || loading) {
      console.log("[ChatPanel] handleSend returning early:", { textToSend: !!textToSend, loading });
      return;
    }

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
    // Garantir que é uma string válida ou null
    const patientIdToUse = (patientIdParam || activePatientId) ? String(patientIdParam || activePatientId).trim() : null;

    // Log temporário para debug
    console.log("[chat] Sending request:", {
      message: textToSend.substring(0, 50) + "...",
      patientId: patientIdToUse,
      focusedPatientId: patientIdToUse,
      activePatientId,
      patientIdParam,
      agent: currentAgent,
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          focusedPatientId: patientIdToUse || null,
          sessionId: sessionIdRef.current,
          userId: "user-mock",
          role: "plantonista",
          unidade: "UTI Pediátrica A",
          turno: "manhã",
          currentAgent: currentAgent,
          agentId: agentIdParam,
          patientId: patientIdToUse || null
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
        text: data.llmAnswer?.plainTextAnswer ?? data.reply,
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
        specialistOpinion: data.specialistOpinion,
        radiologyReport: data.radiologyReport,
        microDashboard: data.microDashboard,
        microDashboards: data.microDashboards,
        // Novos campos do LLM
        llmAnswer: data.llmAnswer,
        focusPayload: data.focusPayload ?? data.llmAnswer?.focusSummary,
        microDashboardsV2: data.microDashboardsV2 ?? data.llmAnswer?.microDashboards,
        timelineHighlights: data.timelineHighlights ?? data.llmAnswer?.timelineHighlights
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
  }, [activePatientId, sessionIdRef, currentAgent, setConversation, setInput, loading, addOpinion, input]);


  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      console.log("[ChatInput] Enter pressed, input:", input);
      if (input.trim()) {
        void handleSend(input.trim());
      }
    }
  }, [handleSend, input]);

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
                  <div 
                    key={msg.id} 
                    ref={(el) => {
                      if (el) {
                        messageRefs.current.set(msg.id, el);
                      } else {
                        messageRefs.current.delete(msg.id);
                      }
                    }}
                    className={`msg-container ${msg.role === "user" ? "msg-user-wrapper" : "msg-agent-wrapper"}`}
                  >
                    {/* Painel estruturado do Plantonista (quando há llmAnswer) */}
                    {msg.role === "agent" && msg.llmAnswer ? (
                      <div className="plantonista-response-panel">
                        {/* 1. Header text */}
                        <div className="plantonista-response-header">
                          <p className="plantonista-response-text">
                            {msg.llmAnswer.plainTextAnswer ?? msg.text}
                          </p>
                        </div>

                        {/* 2. Dashboards row */}
                        {msg.microDashboardsV2 && msg.microDashboardsV2.length > 0 && (
                          <div className="plantonista-response-dashboards">
                            {msg.microDashboardsV2.map((dashboard, idx) => (
                              <MicroDashboardV2Renderer key={idx} dashboard={dashboard} />
                            ))}
                          </div>
                        )}

                        {/* 3. Timeline row (se paciente específico) */}
                        {msg.timelineHighlights && msg.timelineHighlights.length > 0 && msg.focusedPatient && (
                          <div className="plantonista-response-timeline">
                            <PatientTimelineSummary 
                              patientId={msg.focusedPatient.id}
                              timelineHighlights={msg.timelineHighlights}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Fallback: mensagem simples (para agentes não-Plantonista ou mensagens sem llmAnswer) */
                      <div className={`msg-bubble ${msg.role === "user" ? "msg-user" : "msg-agent"}`}>
                        <div className="msg-text" style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                        
                        {/* Micro Dashboard */}
                        {msg.role === "agent" && msg.microDashboard && (
                          <div className="mt-4">
                            <MicroDashboardRenderer dashboard={msg.microDashboard} />
                          </div>
                        )}
                        
                        {/* Múltiplos Micro Dashboards */}
                        {msg.role === "agent" && msg.microDashboards && msg.microDashboards.length > 0 && (
                          <div className="mt-4 space-y-4">
                            {msg.microDashboards.map((dashboard, idx) => (
                              <MicroDashboardRenderer key={idx} dashboard={dashboard} />
                            ))}
                          </div>
                        )}
                        
                        {/* Micro Dashboards V2 (do LLM) - fallback se não usar painel */}
                        {msg.role === "agent" && msg.microDashboardsV2 && msg.microDashboardsV2.length > 0 && !msg.llmAnswer && (
                          <div className="mt-4 space-y-4">
                            {msg.microDashboardsV2.map((dashboard, idx) => (
                              <MicroDashboardV2Renderer key={idx} dashboard={dashboard} />
                            ))}
                          </div>
                        )}
                        
                        {/* Parecer de Radiologista Virtual */}
                        {msg.role === "agent" && (msg.intent === 'RADIOLOGISTA_VIRTUAL' || msg.radiologyReport) && msg.radiologyReport && (
                          <RadiologyReportCard summary={msg.radiologyReport.summary} fullReport={msg.radiologyReport.full} />
                        )}
                        
                        {/* Parecer de agente com visual premium */}
                        {msg.role === "agent" && msg.intent === 'AGENTE_PARECER' && msg.specialistOpinion && (
                          <AgentOpinionBlock opinion={msg.specialistOpinion} />
                        )}
                        
                        {/* Fallback: Parecer de agente com micro dashboards (formato antigo) */}
                        {msg.role === "agent" && msg.intent === 'AGENTE_PARECER' && !msg.specialistOpinion && msg.focusedPatient && (
                          <>
                            {msg.showPatientMiniPanel && (
                              <MiniPatientSummary 
                                patient={msg.focusedPatient}
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
                            onExpandPatient={(patientId) => {
                              setExpandedPatientId(patientId);
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
                              <MiniPatientSummary 
                                patient={msg.focusedPatient}
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
                    )}
                  </div>
                ))}
                
                {/* Patient Focus Mode - Expandido inline (global, fora do loop de mensagens) */}
                {expandedPatientId && expandedPatient && (() => {
                  // Buscar o focusPayload mais recente para este paciente
                  const latestFocusPayload = conversation
                    .filter(m => m.role === "agent" && m.focusPayload?.patientId === expandedPatient.id)
                    .map(m => m.focusPayload)
                    .find(p => p !== undefined);
                  
                  // Buscar timelineHighlights mais recentes para este paciente
                  const latestTimelineHighlights = conversation
                    .filter(m => m.role === "agent" && m.timelineHighlights && m.timelineHighlights.length > 0)
                    .flatMap(m => m.timelineHighlights || [])
                    .filter((h): h is NonNullable<typeof h> => h !== undefined && h.data !== undefined);
                  
                  return (
                    <div className="msg-container msg-agent-wrapper">
                      <PatientFocusMode
                        patient={expandedPatient}
                        focusPayload={latestFocusPayload}
                        timelineHighlights={latestTimelineHighlights.length > 0 ? latestTimelineHighlights : undefined}
                        onCollapse={() => setExpandedPatientId(null)}
                        onRequestRadiologistOpinion={() => {
                          // Enviar mensagem para acionar o Radiologista Virtual
                          void handleSend(
                            `Radiologista Virtual, analise os exames de imagem do paciente ${expandedPatient.leito} - ${expandedPatient.nome}.`,
                            'radiology',
                            expandedPatient.id
                          );
                        }}
                      />
                    </div>
                  );
                })()}

                {loading && (
                  <div className="msg-container msg-agent-wrapper">
                    <div className="msg-bubble msg-agent">
                      <LoadingSkeleton />
                    </div>
                  </div>
                )}
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
