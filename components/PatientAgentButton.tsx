"use client";

import { useState, useRef, useEffect } from "react";
import { clinicalAgents, type ClinicalAgentId } from "@/lib/clinicalAgents";

interface PatientAgentButtonProps {
  patientId: string;
  onRequestOpinion: (patientId: string, agentId: ClinicalAgentId) => void;
}

export function PatientAgentButton({ patientId, onRequestOpinion }: PatientAgentButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  // Incluir todos os agentes (incluindo Assistente Geral)
  const allAgents = Object.values(clinicalAgents);

  return (
    <div className="patient-agent-button" ref={menuRef}>
      <button
        type="button"
        className="patient-agent-icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
        aria-label="Pedir parecer de especialista"
        title="Pedir parecer de especialista"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="patient-agent-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      </button>

      {isMenuOpen && (
        <div className="patient-agent-menu">
          {allAgents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              className="patient-agent-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                onRequestOpinion(patientId, agent.id);
                setIsMenuOpen(false);
              }}
            >
              <span className="patient-agent-menu-emoji">{agent.emoji}</span>
              <span className="patient-agent-menu-name">{agent.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

