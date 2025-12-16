"use client";

import type { SpecialistOpinion } from '@/types/SpecialistOpinion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, User } from 'lucide-react';
import type { ClinicalAgentId } from '@/lib/clinicalAgents';

const agentIcons: Record<ClinicalAgentId, typeof User> = {
  general: User,
};

interface SpecialistOpinionMessageProps {
  opinion: SpecialistOpinion;
}

export function SpecialistOpinionMessage({ opinion }: SpecialistOpinionMessageProps) {
  const { dashboards } = opinion;
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="inline-block w-4 h-4 text-gray-500" />;
    if (trend === 'down') return <TrendingDown className="inline-block w-4 h-4 text-gray-500" />;
    return <Minus className="inline-block w-4 h-4 text-gray-400" />;
  };

  const AgentIcon = agentIcons[opinion.agentId] || User;

  return (
    <div className="specialist-opinion-message">
      {/* Header */}
      <div className="specialist-opinion-header">
        <div className="specialist-opinion-header-main">
          <div className="specialist-opinion-agent">
            <AgentIcon className="w-5 h-5 text-gray-500" />
            <div>
              <div className="specialist-opinion-agent-name">{opinion.agentName}</div>
              <div className="specialist-opinion-patient">
                {opinion.patientBed} • {opinion.patientName}
              </div>
            </div>
          </div>
          <div className="specialist-opinion-meta">
            <span className="specialist-opinion-timestamp">{formatTime(opinion.timestamp)}</span>
            <span className="specialist-opinion-badge">Mock / Protótipo</span>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="specialist-opinion-content">
        {/* Resumo Clínico */}
        <section className="specialist-opinion-section">
          <h4 className="specialist-opinion-section-title">Resumo clínico</h4>
          <p className="specialist-opinion-section-text">{opinion.summary}</p>
        </section>

        {/* Principais riscos */}
        {opinion.risks.length > 0 && (
          <section className="specialist-opinion-section">
            <h4 className="specialist-opinion-section-title">Principais riscos nas próximas 24h</h4>
            <ul className="specialist-opinion-risks">
              {opinion.risks.map((risk, idx) => (
                <li key={idx} className="specialist-opinion-risk-item">
                  <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Condutas sugeridas */}
        {opinion.suggestedTherapies.length > 0 && (
          <section className="specialist-opinion-section">
            <h4 className="specialist-opinion-section-title">Condutas sugeridas</h4>
            <ul className="specialist-opinion-list">
              {opinion.suggestedTherapies.map((therapy, idx) => (
                <li key={idx} className="specialist-opinion-list-item">{therapy}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Exames sugeridos */}
        {opinion.suggestedOrders.length > 0 && (
          <section className="specialist-opinion-section">
            <h4 className="specialist-opinion-section-title">Exames sugeridos</h4>
            <div className="specialist-opinion-exams">
              {opinion.suggestedOrders.map((exam, idx) => (
                <span key={idx} className="specialist-opinion-exam-chip">{exam}</span>
              ))}
            </div>
          </section>
        )}

        {/* Micro Dashboards */}
        <div className="specialist-opinion-dashboards">
          {/* Sinais Vitais */}
          <div className="specialist-opinion-dashboard-card">
            <h5 className="specialist-opinion-dashboard-title">Sinais Vitais</h5>
            <div className="specialist-opinion-vitals-grid">
              <div className="specialist-opinion-vital">
                <span className="specialist-opinion-vital-label">MAP</span>
                <span className={dashboards.vitals.map < 65 ? 'specialist-opinion-vital-critical' : ''}>
                  {dashboards.vitals.map} mmHg
                </span>
              </div>
              <div className="specialist-opinion-vital">
                <span className="specialist-opinion-vital-label">FC</span>
                <span>{dashboards.vitals.hr} bpm</span>
              </div>
              <div className="specialist-opinion-vital">
                <span className="specialist-opinion-vital-label">FR</span>
                <span>{dashboards.vitals.rr} rpm</span>
              </div>
              <div className="specialist-opinion-vital">
                <span className="specialist-opinion-vital-label">SpO₂</span>
                <span className={dashboards.vitals.spo2 < 92 ? 'specialist-opinion-vital-critical' : ''}>
                  {dashboards.vitals.spo2}%
                </span>
              </div>
              <div className="specialist-opinion-vital">
                <span className="specialist-opinion-vital-label">Temp</span>
                <span>{dashboards.vitals.temperature.toFixed(1)}°C</span>
              </div>
            </div>
          </div>

          {/* Labs com Tendência */}
          {(dashboards.labs.lactate || dashboards.labs.pcr) && (
            <div className="specialist-opinion-dashboard-card">
              <h5 className="specialist-opinion-dashboard-title">Exames Laboratoriais</h5>
              <div className="specialist-opinion-labs">
                {dashboards.labs.lactate && (
                  <div className="specialist-opinion-lab">
                    <div className="specialist-opinion-lab-header">
                      <span className="specialist-opinion-lab-name">Lactato</span>
                      <TrendIcon trend={dashboards.labs.lactate.trend} />
                    </div>
                    <div className="specialist-opinion-lab-value">
                      {dashboards.labs.lactate.value.toFixed(1)} {dashboards.labs.lactate.unit}
                      {dashboards.labs.lactate.previousValue && (
                        <span className="specialist-opinion-lab-previous">
                          {' '}→ {dashboards.labs.lactate.previousValue.toFixed(1)} (24h)
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {dashboards.labs.pcr && (
                  <div className="specialist-opinion-lab">
                    <div className="specialist-opinion-lab-header">
                      <span className="specialist-opinion-lab-name">PCR</span>
                      <TrendIcon trend={dashboards.labs.pcr.trend} />
                    </div>
                    <div className="specialist-opinion-lab-value">
                      {dashboards.labs.pcr.value.toFixed(0)} {dashboards.labs.pcr.unit}
                      {dashboards.labs.pcr.previousValue && (
                        <span className="specialist-opinion-lab-previous">
                          {' '}→ {dashboards.labs.pcr.previousValue.toFixed(0)} (24h)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terapias */}
          <div className="specialist-opinion-dashboard-card">
            <h5 className="specialist-opinion-dashboard-title">Terapias</h5>
            <div className="specialist-opinion-therapies">
              {dashboards.therapies.ventilation && (
                <span className="specialist-opinion-therapy-badge specialist-opinion-therapy-vm">
                  VM
                </span>
              )}
              {dashboards.therapies.vasopressor && (
                <span className="specialist-opinion-therapy-badge specialist-opinion-therapy-vaso">
                  Vasopressor
                </span>
              )}
              {dashboards.therapies.antibiotics.map((ab, idx) => (
                <span key={idx} className="specialist-opinion-therapy-badge specialist-opinion-therapy-antibiotic">
                  {ab}
                </span>
              ))}
            </div>
          </div>

          {/* Alertas */}
          {dashboards.alerts.length > 0 && (
            <div className="specialist-opinion-dashboard-card specialist-opinion-alerts">
              <h5 className="specialist-opinion-dashboard-title">Alertas</h5>
              <div className="specialist-opinion-alerts-list">
                {dashboards.alerts.map((alert, idx) => (
                  <span key={idx} className="specialist-opinion-alert-chip">
                    {alert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="specialist-opinion-disclaimer">
          ⚠️ Este é um parecer automatizado com dados simulados. Sempre confirme condutas com a equipe médica e protocolos locais.
        </div>
      </div>
    </div>
  );
}

