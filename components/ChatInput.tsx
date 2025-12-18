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
  onVoiceResult?: (result: { text: string; structured: any }) => void;
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcriptionPreview, setTranscriptionPreview] = useState<string | null>(null);
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
      setErrorMessage(null);
      setTranscriptionPreview(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        await sendAudioToAPI(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      const errorMsg = error.name === "NotAllowedError" || error.name === "PermissionDeniedError"
        ? "Permissão de microfone negada. Por favor, permita o acesso ao microfone."
        : error.name === "NotFoundError" || error.name === "DevicesNotFoundError"
        ? "Nenhum microfone encontrado."
        : `Erro ao iniciar gravação: ${error.message}`;
      
      setErrorMessage(errorMsg);
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function sendAudioToAPI(audioBlob: Blob) {
    try {
      setIsTranscribing(true);
      setErrorMessage(null);
      
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-note.webm");
      
      // Adicionar contexto do paciente se disponível
      const activePatient = patients.find(p => p.id === activePatientId);
      if (activePatient) {
        formData.append("patientContext", JSON.stringify({
          bed: activePatient.leito.replace(/\D/g, '') || null,
          patientId: activePatient.id,
          unit: "UTI 1"
        }));
      }
      
      // Adicionar query params se necessário
      let url = "/api/audio/transcribe";
      if (activePatient) {
        const bed = activePatient.leito.replace(/\D/g, '');
        if (bed) {
          url += `?bed=${bed}`;
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
      
      setTranscriptionPreview(data.text);
      
      // Chamar callback se fornecido
      if (onVoiceResult && data.structured) {
        onVoiceResult({ text: data.text, structured: data.structured });
      }
      
      // Também enviar como mensagem de chat
      if (data.text) {
        onSend(`Nota de voz: ${data.text}`);
      }
      
      // Limpar preview após 3 segundos
      setTimeout(() => {
        setTranscriptionPreview(null);
      }, 3000);
      
    } catch (error: any) {
      const errorMsg = error.message || "Erro ao processar áudio";
      setErrorMessage(errorMsg);
    } finally {
      setIsTranscribing(false);
    }
  }

  function handleVoiceButtonClick() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
            // NÃO chamar onSend para outras teclas
          }}
          disabled={loading}
        />

        <button
          type="button"
          className={`chat-input-voice-btn ${isRecording ? 'recording' : ''}`}
          aria-label={isRecording ? "Parar gravação" : "Iniciar gravação"}
          title={isRecording ? "Parar gravação" : "Gravar nota de voz"}
          onClick={handleVoiceButtonClick}
          disabled={isTranscribing || loading}
          style={{
            color: isRecording ? '#ef4444' : undefined,
            opacity: (isTranscribing || loading) ? 0.5 : 1
          }}
        >
          {isTranscribing ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="chat-input-voice-icon"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          ) : (
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
          <p className="text-xs text-rose-600 mt-1 px-2">{errorMessage}</p>
        )}
        
        {transcriptionPreview && (
          <p className="text-xs text-green-600 mt-1 px-2">{transcriptionPreview}</p>
        )}

        <button
          className="chat-input-send-btn"
          type="button"
          onClick={() => {
            const trimmedValue = value.trim();
            if (trimmedValue && !loading && onSend) {
              console.log("[ChatInput] Send button clicked, value:", trimmedValue);
              onSend(trimmedValue);
            }
          }}
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

