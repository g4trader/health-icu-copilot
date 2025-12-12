"use client";

import { useState, useRef, useEffect } from "react";
import { clinicalAgents, type ClinicalAgentId } from "@/lib/clinicalAgents";

interface AgentSelectorProps {
  selectedAgentId: ClinicalAgentId;
  onSelect: (agentId: ClinicalAgentId) => void;
}

export function AgentSelector({ selectedAgentId, onSelect }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const selectedAgent = clinicalAgents[selectedAgentId];

  return (
    <div className="agent-selector" ref={menuRef}>
      <button
        type="button"
        className="agent-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Selecionar agente"
        title={`Agente: ${selectedAgent.name}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="agent-selector-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
        <span className="agent-selector-text">{selectedAgent.emoji} {selectedAgent.name}</span>
      </button>

      {isOpen && (
        <div className="agent-selector-menu">
          {Object.values(clinicalAgents).map((agent) => (
            <button
              key={agent.id}
              type="button"
              className={`agent-selector-item ${selectedAgentId === agent.id ? "agent-selector-item-selected" : ""}`}
              onClick={() => {
                onSelect(agent.id);
                setIsOpen(false);
              }}
            >
              <span className="agent-selector-item-emoji">{agent.emoji}</span>
              <span className="agent-selector-item-name">{agent.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

