"use client";

import { useState, useRef, useEffect } from "react";
import type { ClinicalAgentType } from "@/lib/clinicalAgents";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message?: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  loading: boolean;
  currentAgent: ClinicalAgentType;
  onAgentChange: (agent: ClinicalAgentType) => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  loading,
  currentAgent,
  onAgentChange
}: ChatInputProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  function handleMenuAction(action: string) {
    setShowMenu(false);
    
    // Simular ações (MVP)
    switch (action) {
      case 'cardiology':
        onAgentChange('cardiology');
        onChange('Ative o agente de Cardiologia Pediátrica');
        break;
      case 'pneumology':
        onAgentChange('pneumology');
        onChange('Ative o agente de Pneumologia Pediátrica');
        break;
      case 'neurology':
        onAgentChange('neurology');
        onChange('Ative o agente de Neurologia Pediátrica');
        break;
      default:
        // Outras ações podem disparar mensagens simuladas
        break;
    }
  }

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <button
          type="button"
          className="chat-input-add-btn"
          onClick={() => setShowMenu(!showMenu)}
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

        {showMenu && (
          <div className="chat-input-menu" ref={menuRef}>
            <div className="menu-section">
              <div className="menu-title">Ações</div>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('document')}
              >
                📄 Enviar documento
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('literature')}
              >
                📚 Investigar literatura médica
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('education')}
              >
                🎓 Tele-educação
              </button>
            </div>
            <div className="menu-section">
              <div className="menu-title">Parecer Especializado</div>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('cardiology')}
              >
                ❤️ Cardiologia Pediátrica
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('pneumology')}
              >
                🫁 Pneumologia Pediátrica
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('neurology')}
              >
                🧠 Neurologia Pediátrica
              </button>
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder="Digite sua pergunta..."
          className="chat-input-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
        />

        <button
          type="button"
          className="chat-input-voice-btn"
          aria-label="Entrada por voz"
          title="Entrada por voz (em breve)"
        >
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
        </button>

        <button
          className="chat-input-send-btn"
          type="button"
          onClick={() => void onSend()}
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
    </div>
  );
}

