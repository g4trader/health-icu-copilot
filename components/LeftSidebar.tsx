"use client";

import { useClinicalSession } from "@/lib/ClinicalSessionContext";
import { usePreview } from "@/components/PreviewProvider";
import { mockPatients } from "@/lib/mockData";
import { PatientOpinionBadges } from "@/components/PatientOpinionBadges";

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
                  💬 Conversas salvas
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  📚 Educação / Tele-educação
                </button>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Agentes</h3>
            <ul className="sidebar-list">
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  👨‍⚕️ Assistente Geral
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  ❤️ Cardiologia Pediátrica
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  🫁 Pneumologia Pediátrica
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  🧠 Neurologia Pediátrica
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
              <ul className="sidebar-list">
                {pinnedPatients.map((pinned) => {
                  const patient = mockPatients.find(p => p.id === pinned.id);
                  if (!patient) return null;
                  
                  return (
                    <li key={pinned.id} className="sidebar-item">
                      <button
                        type="button"
                        className="sidebar-pinned-patient"
                        onClick={() => handleSelectPatient(pinned.id)}
                      >
                        <div className="sidebar-pinned-avatar">
                          {pinned.bedId?.replace('UTI ', '') ?? patient.leito.replace('UTI ', '')}
                        </div>
                        <div className="sidebar-pinned-info">
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span className="sidebar-pinned-name">
                              {pinned.name}
                            </span>
                            <PatientOpinionBadges patientId={pinned.id} maxVisible={1} />
                          </div>
                          <span className="sidebar-pinned-meta">
                            Risco 24h: {Math.round((patient.riscoMortality24h * 100))}%
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
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

