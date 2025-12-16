"use client";

import { MessageSquare, GraduationCap, User, HeartPulse, Activity, Brain } from "lucide-react";
import { useClinicalSession } from "@/lib/ClinicalSessionContext";
import { usePreview } from "@/components/PreviewProvider";
import { mockPatients } from "@/lib/mockData";
import { PatientOpinionBadges } from "@/components/PatientOpinionBadges";
import { PatientListItem } from "./ui/PatientListItem";

export function LeftSidebar() {
  const { pinnedPatients, setActivePatient } = useClinicalSession();
  const { setPreview } = usePreview();

  const handleSelectPatient = (patientId: string) => {
    setActivePatient(patientId);
    const patient = mockPatients.find(p => p.id === patientId);
    if (patient) {
      setPreview('patient', { patient });
    }
  };

  return (
    <aside className="left-sidebar">
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Menu</h3>
            <ul className="sidebar-list">
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span>Conversas salvas</span>
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  <GraduationCap className="w-4 h-4 text-gray-500" />
                  <span>Educação / Tele-educação</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Agentes</h3>
            <ul className="sidebar-list">
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>Assistente Geral</span>
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  <HeartPulse className="w-4 h-4 text-gray-500" />
                  <span>Cardiologia Pediátrica</span>
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <span>Pneumologia Pediátrica</span>
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  <Brain className="w-4 h-4 text-gray-500" />
                  <span>Neurologia Pediátrica</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Seção Meus pacientes */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Meus pacientes</h3>
            {pinnedPatients.length === 0 ? (
              <p className="sidebar-empty-message">
                Fixe pacientes importantes para acompanhar aqui.
              </p>
            ) : (
              <div className="space-y-2">
                {pinnedPatients.map((pinned) => {
                  const patient = mockPatients.find(p => p.id === pinned.id);
                  if (!patient) return null;
                  
                  return (
                    <PatientListItem
                      key={pinned.id}
                      patient={patient}
                      onSelect={(p) => handleSelectPatient(p.id)}
                      showActions={true}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Rodapé com nome do usuário */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            A
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Aristóteles</span>
            <span className="sidebar-user-role">UTI Pediátrica A</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

