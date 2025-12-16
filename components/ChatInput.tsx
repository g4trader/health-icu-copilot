"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, Search, GraduationCap, HeartPulse, Activity, Brain } from "lucide-react";
import type { ClinicalAgentType } from "@/lib/clinicalAgents";
import type { Patient } from "@/lib/mockData";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message?: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  loading: boolean;
  currentAgent: ClinicalAgentType;
  onAgentChange: (agent: ClinicalAgentType) => void;
  patients?: Patient[];
  onSelectPatientFromUI?: (patientId: string) => void;
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
  onSelectPatientFromUI
}: ChatInputProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isPatientMenuOpen, setIsPatientMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const patientMenuRef = useRef<HTMLDivElement>(null);

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

  function togglePatientMenu() {
    setIsPatientMenuOpen((prev) => !prev);
    setShowMenu(false); // Fechar menu + quando abrir menu de pacientes
  }

  function handleSelectPatientFromMenu(patientId: string) {
    setIsPatientMenuOpen(false);
    onSelectPatientFromUI?.(patientId);
  }

  return (
    <div className="chat-input-wrapper">
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
                <FileText className="w-4 h-4 text-gray-500" />
                <span>Enviar documento</span>
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('literature')}
              >
                <Search className="w-4 h-4 text-gray-500" />
                <span>Investigar literatura médica</span>
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('education')}
              >
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <span>Tele-educação</span>
              </button>
            </div>
            <div className="menu-section">
              <div className="menu-title">Parecer Especializado</div>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('cardiology')}
              >
                <HeartPulse className="w-4 h-4 text-gray-500" />
                <span>Cardiologia Pediátrica</span>
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('pneumology')}
              >
                <Activity className="w-4 h-4 text-gray-500" />
                <span>Pneumologia Pediátrica</span>
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => handleMenuAction('neurology')}
              >
                <Brain className="w-4 h-4 text-gray-500" />
                <span>Neurologia Pediátrica</span>
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
  );
}

