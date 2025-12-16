"use client";

import type { SpecialistOpinion } from "@/types/SpecialistOpinion";
import { User, HeartPulse, Activity, Brain, TrendingUp, TrendingDown, Minus, AlertCircle, Clock, FileText, CheckCircle2 } from "lucide-react";
import type { ClinicalAgentId } from "@/lib/clinicalAgents";
import { BaseCard } from "./BaseCard";
import { SectionHeader } from "./SectionHeader";
import { MetricTile } from "./MetricTile";
import { MetricChip } from "./MetricChip";

const agentIcons: Record<ClinicalAgentId, typeof User> = {
  general: User,
  cardiology: HeartPulse,
  pneumology: Activity,
  neurology: Brain,
};

interface AgentOpinionBlockProps {
  opinion: SpecialistOpinion;
}

export function AgentOpinionBlock({ opinion }: AgentOpinionBlockProps) {
  const { dashboards } = opinion;
  const AgentIcon = agentIcons[opinion.agentId] || User;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <BaseCard className="mt-4" padding="lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-slate-100 rounded-xl">
            <AgentIcon className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-900 font-semibold text-base mb-1">
              {opinion.agentName}
            </h3>
            <p className="text-slate-600 text-sm">
              {opinion.patientBed} • {opinion.patientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(opinion.timestamp)}</span>
          </div>
          <MetricChip label="Mock" value="Protótipo" variant="info" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parecer */}
          <section>
            <SectionHeader title="Parecer" />
            <p className="text-slate-700 text-sm leading-relaxed mt-3">
              {opinion.summary}
            </p>
          </section>

          {/* Hipóteses / Riscos */}
          {opinion.risks.length > 0 && (
            <section>
              <SectionHeader title="Principais riscos nas próximas 24h" />
              <ul className="mt-3 space-y-2">
                {opinion.risks.map((risk, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-slate-700 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Plano Sugerido */}
          {(opinion.suggestedTherapies.length > 0 ||
            opinion.suggestedOrders.length > 0) && (
            <section>
              <SectionHeader title="Plano sugerido" />
              <div className="mt-3 space-y-4">
                {opinion.suggestedTherapies.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                      Condutas
                    </h5>
                    <ul className="space-y-1.5">
                      {opinion.suggestedTherapies.map((therapy, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-slate-700 text-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{therapy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {opinion.suggestedOrders.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                      Exames
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {opinion.suggestedOrders.map((exam, idx) => (
                        <MetricChip
                          key={idx}
                          label=""
                          value={exam}
                          variant="default"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar - Micro Dashboards */}
        <div className="lg:col-span-1 space-y-4">
          {/* Vitals */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-3">
              Sinais Vitais
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <MetricTile
                label="MAP"
                value={dashboards.vitals.map}
                unit="mmHg"
                critical={dashboards.vitals.map < 65}
              />
              <MetricTile
                label="FC"
                value={dashboards.vitals.hr}
                unit="bpm"
              />
              <MetricTile
                label="FR"
                value={dashboards.vitals.rr}
                unit="rpm"
              />
              <MetricTile
                label="SpO₂"
                value={dashboards.vitals.spo2}
                unit="%"
                critical={dashboards.vitals.spo2 < 92}
              />
              <MetricTile
                label="Temp"
                value={dashboards.vitals.temperature.toFixed(1)}
                unit="°C"
                className="col-span-2"
              />
            </div>
          </div>

          {/* Labs */}
          {(dashboards.labs.lactate || dashboards.labs.pcr) && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-3">
                Exames Laboratoriais
              </h4>
              <div className="space-y-2">
                {dashboards.labs.lactate && (
                  <MetricTile
                    label="Lactato"
                    value={dashboards.labs.lactate.value.toFixed(1)}
                    unit={dashboards.labs.lactate.unit}
                    trend={dashboards.labs.lactate.trend}
                    trendValue={
                      dashboards.labs.lactate.previousValue
                        ? `24h: ${dashboards.labs.lactate.previousValue.toFixed(1)}`
                        : undefined
                    }
                    critical={dashboards.labs.lactate.value >= 3}
                  />
                )}
                {dashboards.labs.pcr && (
                  <MetricTile
                    label="PCR"
                    value={dashboards.labs.pcr.value.toFixed(0)}
                    unit={dashboards.labs.pcr.unit}
                    trend={dashboards.labs.pcr.trend}
                    trendValue={
                      dashboards.labs.pcr.previousValue
                        ? `24h: ${dashboards.labs.pcr.previousValue.toFixed(0)}`
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* Therapies */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-3">
              Terapias
            </h4>
            <div className="flex flex-wrap gap-2">
              {dashboards.therapies.ventilation && (
                <MetricChip label="VM" value="Ativo" variant="info" />
              )}
              {dashboards.therapies.vasopressor && (
                <MetricChip
                  label="Vaso"
                  value="Ativo"
                  variant="danger"
                />
              )}
              {dashboards.therapies.antibiotics.map((ab, idx) => (
                <MetricChip
                  key={idx}
                  label="ATB"
                  value={ab}
                  variant="default"
                />
              ))}
            </div>
          </div>

          {/* Alerts */}
          {dashboards.alerts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-3">
                Alertas
              </h4>
              <div className="space-y-1.5">
                {dashboards.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 bg-rose-50 border border-rose-200 rounded-lg"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-rose-700">{alert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Parecer automatizado com dados simulados. Sempre confirme condutas com a equipe médica e protocolos locais.
        </p>
      </div>
    </BaseCard>
  );
}

