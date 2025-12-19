"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, GraduationCap } from "lucide-react";
import type { ClinicalAgentType } from "@/lib/clinicalAgents";
import type { Patient } from "@/lib/mockData";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message?: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; // Opcional - ChatInput gerencia internamente
  loading: boolean;
  currentAgent: ClinicalAgentType;
  onAgentChange: (agent: ClinicalAgentType) => void;
  patients?: Patient[];
  onSelectPatientFromUI?: (patientId: string) => void;
  onVoiceResult?: (result: { text: string; structured?: any; command?: any; error?: string }) => boolean | void;
  activePatientId?: string | null;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  loading,
  currentAgent,
  onAgentChange,
  patients = [],
  onSelectPatientFromUI,
  onVoiceResult,
  activePatientId
}: ChatInputProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isPatientMenuOpen, setIsPatientMenuOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const patientMenuRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (patientMenuRef.current && !patientMenuRef.current.contains(event.target as Node)) {
        setIsPatientMenuOpen(false);
      }
    }

    if (showMenu || isPatientMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu, isPatientMenuOpen]);

  // Limpar mensagem de erro automaticamente após 5 segundos
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  function handleMenuAction(action: string) {
    setShowMenu(false);
    
    // Simular ações (MVP)
    switch (action) {
      default:
        // Outras ações podem disparar mensagens simuladas
        break;
    }
  }

  function togglePatientMenu() {
    setIsPatientMenuOpen((prev) => !prev);
    setShowMenu(false); // Fechar menu + quando abrir menu de pacientes
  }

  function handleSelectPatientFromMenu(patientId: string) {
    setIsPatientMenuOpen(false);
    onSelectPatientFromUI?.(patientId);
  }

  async function startRecording() {
    try {
      console.log("[ChatInput] startRecording chamado");
      setErrorMessage(null);
      setAudioBlob(null);
      
      // Verificar se a API está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("[ChatInput] MediaDevices API não disponível");
        setErrorMessage("Seu navegador não suporta gravação de áudio.");
        setVoiceState("idle");
        return;
      }
      
      console.log("[ChatInput] Solicitando permissão de microfone...");
      console.log("[ChatInput] Contexto seguro (HTTPS):", window.location.protocol === "https:" || window.location.hostname === "localhost");
      
      // Verificar estado atual da permissão (se disponível)
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log("[ChatInput] Estado da permissão:", permissionStatus?.state);
        }
      } catch (permError) {
        console.log("[ChatInput] Não foi possível verificar estado da permissão (normal em alguns navegadores)");
      }
      
      // Tentar obter acesso ao microfone
      // Primeiro tentar com configuração simples para garantir que a solicitação seja feita
      let stream: MediaStream;
      try {
        // Tentar primeiro com configuração simples
        console.log("[ChatInput] Tentando getUserMedia com configuração simples...");
        console.log("[ChatInput] Aguardando resposta do navegador...");
        
        // Adicionar timeout para detectar se a promise está travada
        const getUserMediaPromise = navigator.mediaDevices.getUserMedia({ audio: true });
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout: getUserMedia não respondeu em 10 segundos")), 10000);
        });
        
        stream = await Promise.race([getUserMediaPromise, timeoutPromise]);
        console.log("[ChatInput] ✅ Permissão de microfone concedida, stream obtido");
      } catch (mediaError: any) {
        console.error("[ChatInput] Erro ao obter acesso ao microfone:", mediaError);
        console.error("[ChatInput] Nome do erro:", mediaError.name);
        console.error("[ChatInput] Mensagem do erro:", mediaError.message);
        
        // Tratar erros específicos de permissão/dispositivo
        if (mediaError.name === "NotAllowedError" || mediaError.name === "PermissionDeniedError") {
          console.warn("[ChatInput] Permissão negada pelo usuário");
          setErrorMessage("Permissão de microfone negada. Por favor, permita o acesso ao microfone nas configurações do navegador.");
          setVoiceState("idle");
          return;
        }
        
        if (mediaError.message?.includes("Timeout")) {
          console.error("[ChatInput] Timeout ao solicitar permissão - o navegador pode não estar respondendo");
          setErrorMessage("O navegador não respondeu à solicitação de permissão. Tente recarregar a página.");
          setVoiceState("idle");
          return;
        }
        
        if (mediaError.name === "NotFoundError" || mediaError.name === "DevicesNotFoundError") {
          // Verificar se realmente não há dispositivos disponíveis
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === "audioinput");
            if (audioInputs.length === 0) {
              setErrorMessage("Nenhum microfone encontrado. Verifique se há um microfone conectado.");
            } else {
              // Há dispositivos, mas pode ser problema de permissão ou acesso
              setErrorMessage("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
            }
          } catch (enumError) {
            // Se não conseguir enumerar, assumir que é problema de permissão
            setErrorMessage("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
          }
          setVoiceState("idle");
          return;
        }
        
        // Outros erros
        setErrorMessage(`Erro ao acessar microfone: ${mediaError.message || "Erro desconhecido"}`);
        setVoiceState("idle");
        return;
      }
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") 
          ? "audio/webm" 
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/webm"
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        // Mudar para estado de transcrição e enviar automaticamente
        setVoiceState("transcribing");
        await sendAudioToAPI(blob);
      };
      
      mediaRecorder.start();
      setVoiceState("recording");
    } catch (error: any) {
      // Erro geral não capturado acima
      console.error("[ChatInput] Erro inesperado ao iniciar gravação:", error);
      setErrorMessage(`Erro ao iniciar gravação: ${error.message || "Erro desconhecido"}`);
      setVoiceState("idle");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && voiceState === "recording") {
      mediaRecorderRef.current.stop();
      // O áudio será enviado automaticamente quando onstop for chamado
    }
  }

  function cancelRecording() {
    if (mediaRecorderRef.current && voiceState === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setAudioBlob(null);
    setVoiceState("idle");
  }


  async function sendAudioToAPI(blob?: Blob) {
    const audioToSend = blob || audioBlob;
    if (!audioToSend) {
      setVoiceState("idle");
      return;
    }
    
    try {
      setErrorMessage(null);
      // Estado já deve estar em "transcribing" quando esta função é chamada
      
      const formData = new FormData();
      formData.append("file", audioToSend, "voice-note.webm");
      
      // Adicionar contexto do paciente completo se disponível
      const activePatient = patients.find(p => p.id === activePatientId);
      if (activePatient) {
        // Extrair número do leito (ex: "UTI 08" -> "8")
        const bedNumber = activePatient.leito.replace(/\D/g, '');
        const patientContext = {
          bed: bedNumber ? parseInt(bedNumber) : null,
          patientId: activePatient.id,
          unit: "UTI 1"
        };
        formData.append("patientContext", JSON.stringify(patientContext));
        console.log("[ChatInput] Enviando patientContext:", patientContext);
      }
      
      // Adicionar query params se necessário
      let url = "/api/audio/transcribe";
      if (activePatient) {
        const bed = activePatient.leito.replace(/\D/g, '');
        if (bed) {
          url += `?bed=${bed}&patientId=${activePatient.id}`;
        }
      }
      
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Verificar se é um comando de voz (navegação ou atualização de parecer)
      if (data.command) {
        if (data.command.type === "select-patient") {
          // Comando de navegação - apenas mudar foco, não processar como nota clínica
          console.log("[ChatInput] Comando de seleção de paciente detectado");
          
          // Adicionar mensagem no chat informando o comando
          onSend(`Comando de voz: mostrando paciente do leito ${data.command.bed}.`);
          
          // Chamar handler para mudar foco do paciente (sem processar como nota clínica)
          if (onVoiceResult) {
            onVoiceResult({ text: data.text, command: data.command });
          }
        } else if (data.command.type === "update-opinion") {
          // Comando de atualização de parecer - processar normalmente
          console.log("[ChatInput] Comando de atualização de parecer detectado");
          
          if (data.structured) {
            if (onVoiceResult) {
              onVoiceResult({ text: data.text, structured: data.structured, command: data.command });
            }
            // Não enviar a nota como mensagem - o parecer já foi atualizado
          }
        }
      } else if (data.error) {
        // Erro na API (ex: tentou atualizar parecer sem paciente selecionado)
        onSend(data.error);
        if (onVoiceResult) {
          onVoiceResult({ text: data.text, error: data.error });
        }
      } else if (data.structured) {
        // Nota clínica normal - verificar se foi processada como parecer
        // IMPORTANTE: Chamar onVoiceResult ANTES de decidir se envia mensagem
        console.log("[ChatInput] Processando structured data, chamando onVoiceResult...");
        let wasProcessedAsOpinion = false;
        if (onVoiceResult) {
          const result = onVoiceResult({ text: data.text, structured: data.structured });
          // Se o handler retornou true, significa que foi processado como parecer
          wasProcessedAsOpinion = result === true;
          console.log("[ChatInput] Resultado do onVoiceResult:", { wasProcessedAsOpinion, result, resultType: typeof result });
        } else {
          console.log("[ChatInput] onVoiceResult não está definido");
        }
        // Só enviar como mensagem normal se NÃO foi processado como parecer
        if (!wasProcessedAsOpinion && data.text) {
          console.log("[ChatInput] ✅ Enviando nota como mensagem normal (não foi parecer)");
          onSend(`Nota de voz: ${data.text}`);
        } else if (wasProcessedAsOpinion) {
          console.log("[ChatInput] ✅ Nota processada como parecer - NÃO enviando como mensagem normal");
        } else {
          console.log("[ChatInput] ⚠️ Condição não atendida - wasProcessedAsOpinion:", wasProcessedAsOpinion, "data.text:", !!data.text);
        }
      }
      
      // Limpar e voltar para idle
      setAudioBlob(null);
      setVoiceState("idle");
      
    } catch (error: any) {
      const errorMsg = error.message || "Erro ao processar áudio";
      setErrorMessage(errorMsg);
      setAudioBlob(null);
      setVoiceState("idle");
    }
  }

  function handleVoiceButtonClick() {
    console.log("[ChatInput] handleVoiceButtonClick chamado, voiceState:", voiceState);
    if (voiceState === "idle") {
      console.log("[ChatInput] Iniciando gravação...");
      startRecording().catch((error) => {
        console.error("[ChatInput] Erro ao iniciar gravação:", error);
        setErrorMessage(`Erro ao iniciar gravação: ${error.message || "Erro desconhecido"}`);
        setVoiceState("idle");
      });
    } else if (voiceState === "recording") {
      // Clicar no microfone durante gravação = parar e enviar
      console.log("[ChatInput] Parando gravação...");
      stopRecording();
    }
    // Se estiver em "transcribing", não fazer nada (aguardar conclusão)
  }

  function handleSendClick() {
    // Enviar texto normalmente (áudio já é enviado automaticamente ao parar gravação)
    const trimmedValue = value.trim();
    if (trimmedValue && !loading && onSend) {
      onSend(trimmedValue);
    }
  }

  return (
    <div 
      className="chat-input-wrapper"
      onKeyDown={(e) => {
        // Prevenir submit de form se houver algum form envolvendo
        if (e.key === "Enter" && e.target !== e.currentTarget) {
          e.stopPropagation();
        }
      }}
    >
        <div className="chat-input-left-buttons">
          <button
            type="button"
            className="chat-input-add-btn"
            onClick={() => {
              setShowMenu(!showMenu);
              setIsPatientMenuOpen(false); // Fechar menu de pacientes quando abrir menu +
            }}
            aria-label="Mais opções"
            title="Mais opções"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="chat-input-add-icon"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          <button
            type="button"
            className="chat-input-add-btn"
            onClick={togglePatientMenu}
            aria-label="Selecionar paciente"
            title="Selecionar paciente"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="chat-input-add-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          </button>
        </div>

        {showMenu && (
          <div className="chat-input-menu" ref={menuRef}>
            <div className="menu-section">
              <div className="menu-title">Ações</div>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('document')}
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Enviar documento</span>
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('education')}
              >
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <span>UpToDate</span>
              </button>
            </div>
          </div>
        )}

        {isPatientMenuOpen && patients.length > 0 && (
          <div className="chat-input-patient-menu" ref={patientMenuRef}>
            <div className="chat-input-patient-menu-header">
              Selecionar paciente
            </div>
            <ul className="chat-input-patient-menu-list">
              {patients.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="chat-input-patient-menu-item"
                    onClick={() => handleSelectPatientFromMenu(p.id)}
                  >
                    <span className="chat-input-patient-menu-name">
                      {p.leito} • {p.nome}
                    </span>
                    <span className="chat-input-patient-menu-meta">
                      {p.idade} anos • {p.diagnosticoPrincipal}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <input
          type="text"
          placeholder="Digite sua pergunta..."
          className="chat-input-field"
          value={value}
          autoComplete="off"
          onChange={(e) => {
            // Apenas atualizar o estado, sem fazer submit
            onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            // Só fazer submit com Enter, não com outras teclas
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              const trimmedValue = value.trim();
              if (trimmedValue && !loading && onSend) {
                onSend(trimmedValue);
              }
              return false; // Não processar mais nada para Enter
            }
            // Para outras teclas, não fazer nada - apenas permitir digitação normal
          }}
          disabled={loading}
        />

        {/* Botão de microfone */}
        <button
          type="button"
          className={`chat-input-voice-btn ${voiceState === "recording" ? "voice-rec-btn" : ""}`}
          aria-label={
            voiceState === "recording" 
              ? "Parar gravação" 
              : voiceState === "transcribing"
              ? "Transcrevendo..."
              : "Iniciar gravação"
          }
          title={
            voiceState === "recording" 
              ? "Clique para parar e enviar" 
              : voiceState === "transcribing"
              ? "Transcrevendo áudio..."
              : "Gravar nota de voz"
          }
          onClick={handleVoiceButtonClick}
          disabled={loading || voiceState === "transcribing"}
        >
          {voiceState === "transcribing" ? (
            // Ícone de loading durante transcrição
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="chat-input-voice-icon animate-spin"
              style={{ color: '#3b82f6' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
              />
            </svg>
          ) : voiceState === "recording" ? (
            // Ícone REC pulsante durante gravação
            <div className="voice-rec-indicator">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="chat-input-voice-icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
                />
              </svg>
            </div>
          ) : (
            // Ícone normal de microfone
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="chat-input-voice-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
              />
            </svg>
          )}
        </button>
        
        {errorMessage && (
          <p className="text-xs text-rose-600 mt-1 px-2 absolute -top-6 left-0">{errorMessage}</p>
        )}

        <button
          className="chat-input-send-btn"
          type="button"
          onClick={handleSendClick}
          disabled={loading || !value.trim()}
          aria-label="Enviar mensagem"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="chat-input-send-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
    </div>
  );
}

