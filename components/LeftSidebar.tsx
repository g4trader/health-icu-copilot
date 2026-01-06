"use client";

import { useState } from "react";
import { User, Scan, BarChart3, GraduationCap, Wrench } from "lucide-react";
import { useClinicalSession } from "@/lib/ClinicalSessionContext";
import { usePreview } from "@/components/PreviewProvider";
import { mockPatients } from "@/lib/mockData";
import { PatientCard } from "./patients/PatientCard";

type SidebarMode = "plantonista" | "radiologista" | "dados-locais" | "educacao" | "ferramentas";

interface SidebarItem {
  id: SidebarMode;
  label: string;
  icon: typeof User;
  requiresPatient?: boolean;
}

export function LeftSidebar() {
  const { pinnedPatients, setActivePatient, activePatientId } = useClinicalSession();
  const { setPreview } = usePreview();
  const [activeMode, setActiveMode] = useState<SidebarMode>("plantonista");

  const sidebarItems: SidebarItem[] = [
    {
      id: "plantonista",
      label: "Plantonista",
      icon: User,
    },
    {
      id: "radiologista",
      label: "Radiologista virtual",
      icon: Scan,
      requiresPatient: true,
    },
    {
      id: "dados-locais",
      label: "Dados locais da UTI",
      icon: BarChart3,
    },
    {
      id: "educacao",
      label: "UpToDate",
      icon: GraduationCap,
    },
    {
      id: "ferramentas",
      label: "Ferramentas",
      icon: Wrench,
    },
  ];

  const handleSelectPatient = (patientId: string) => {
    setActivePatient(patientId);
    const patient = mockPatients.find(p => p.id === patientId);
    if (patient) {
      setPreview('patient', { patient });
    }
  };

  const handleModeSelect = (mode: SidebarMode) => {
    // Se o modo requer paciente e não há paciente selecionado, não faz nada
    const item = sidebarItems.find(i => i.id === mode);
    if (item?.requiresPatient && !activePatientId) {
      return;
    }
    setActiveMode(mode);
    // TODO: Implementar lógica de mudança de modo no chat
  };

  return (
    <aside className="left-sidebar">
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <ul className="sidebar-list">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMode === item.id;
                const isDisabled = item.requiresPatient && !activePatientId;
                
                return (
                  <li key={item.id} className="sidebar-item">
                    <button
                      className={`sidebar-link ${isActive ? "sidebar-link-active" : ""} ${isDisabled ? "sidebar-link-disabled" : ""}`}
                      type="button"
                      onClick={() => handleModeSelect(item.id)}
                      disabled={isDisabled}
                      title={isDisabled ? "Selecione um paciente primeiro" : undefined}
                    >
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
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
              <div className="flex flex-col gap-3 md:gap-4">
                {pinnedPatients.map((pinned) => {
                  const patient = mockPatients.find(p => p.id === pinned.id);
                  if (!patient) return null;
                  
                  return (
                    <PatientCard
                      key={pinned.id}
                      patient={patient}
                      showPin={true}
                      onSelect={(patientId) => handleSelectPatient(patientId)}
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

