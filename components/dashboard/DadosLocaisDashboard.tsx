"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
} from "recharts";
import "./DadosLocaisDashboard.css";

const CORES_PATOLOGIAS = ["#0ea5e9", "#06b6d4", "#0891b2", "#0e7490", "#155e75", "#164e63"];
const CORES_GRADIENTE = ["#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6"];

export function DadosLocaisDashboard() {
  const principaisPatologias = [
    { nome: "PAV", nomeCompleto: "Pneumonia associada à ventilação", casos: 4, percentual: 28 },
    { nome: "Sepse", nomeCompleto: "Sepse / choque séptico", casos: 3, percentual: 21 },
    { nome: "Pós-op cardíaco", nomeCompleto: "Pós-operatório cardiovascular", casos: 2, percentual: 14 },
    { nome: "Bronquiolite", nomeCompleto: "Bronquiolite / IR", casos: 2, percentual: 14 },
    { nome: "Trauma", nomeCompleto: "Trauma / pós-cirúrgico", casos: 2, percentual: 14 },
    { nome: "Outros", nomeCompleto: "Outros", casos: 1, percentual: 9 },
  ];

  const germesResistencia = [
    { germe: "K. pneumoniae", padrao: "ESBL+", isolamentos: 5, resistenciaPct: 80 },
    { germe: "P. aeruginosa", padrao: "MDR", isolamentos: 3, resistenciaPct: 65 },
    { germe: "S. aureus", padrao: "MRSA", isolamentos: 2, resistenciaPct: 100 },
    { germe: "E. coli", padrao: "ESBL+", isolamentos: 4, resistenciaPct: 75 },
    { germe: "Acinetobacter", padrao: "CR", isolamentos: 1, resistenciaPct: 100 },
  ];

  const dadosPieGermes = germesResistencia.map((g, i) => ({
    name: g.germe,
    value: g.isolamentos,
    fill: CORES_GRADIENTE[i % CORES_GRADIENTE.length],
    resistenciaPct: g.resistenciaPct,
    padrao: g.padrao,
  }));

  const indicadoresRadial = [
    { label: "Risco médio 24h", valor: 18, unidade: "%", cor: "#0ea5e9" },
    { label: "Mortalidade est. 24h", valor: 4.2, unidade: "%", cor: "#06b6d4" },
    { label: "Alto risco (≥30%)", valor: 3, unidade: " pac.", cor: "#f59e0b" },
    { label: "Ocupação", valor: 100, unidade: "%", cor: "#10b981" },
  ].map((ind) => ({
    ...ind,
    fill: ind.cor,
    pct: ind.label === "Ocupação" ? 100 : Math.min(100, (ind.valor / (ind.label.includes("Risco médio") ? 100 : ind.label.includes("Mortalidade") ? 20 : ind.label.includes("Alto risco") ? 10 : 100)) * 100),
  }));

  return (
    <div className="dados-locais-dashboard">
      <div className="dados-locais-header">
        <h1 className="dados-locais-title">Dados locais da UTI</h1>
        <p className="dados-locais-subtitle">Unidade Pediátrica A · Dados simulados para desenvolvimento</p>
      </div>

      <div className="dados-locais-grid">
        {/* 1) Principais patologias - BarChart horizontal com gradiente */}
        <section className="panel dados-locais-panel dados-locais-panel-chart">
          <div className="panel-header">
            <h2 className="panel-title">Principais patologias</h2>
            <span className="badge">Últimos 30 dias</span>
          </div>
          <div className="dados-locais-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={principaisPatologias}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 80, bottom: 8 }}
              >
                <defs>
                  {CORES_PATOLOGIAS.map((cor, i) => (
                    <linearGradient key={i} id={`patologia-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={cor} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={cor} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis type="category" dataKey="nome" width={76} tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="dados-locais-tooltip">
                        <div className="dados-locais-tooltip-title">{payload[0].payload.nomeCompleto}</div>
                        <div className="dados-locais-tooltip-row">
                          <span>Casos:</span> <strong>{payload[0].payload.casos}</strong>
                        </div>
                        <div className="dados-locais-tooltip-row">
                          <span>%:</span> <strong>{payload[0].payload.percentual}%</strong>
                        </div>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="casos" radius={[0, 6, 6, 0]} maxBarSize={28} isAnimationActive animationDuration={800}>
                  {principaisPatologias.map((_, i) => (
                    <Cell key={i} fill={`url(#patologia-${i})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 2) Padrão de germes - Pie + barras de resistência */}
        <section className="panel dados-locais-panel dados-locais-panel-chart">
          <div className="panel-header">
            <h2 className="panel-title">Padrão de germes e resistência</h2>
            <span className="badge">Cultura + antibiograma</span>
          </div>
          <div className="dados-locais-germes-layout">
            <div className="dados-locais-pie-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <defs>
                    {CORES_GRADIENTE.map((cor, i) => (
                      <linearGradient key={i} id={`germe-${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={cor} stopOpacity={1} />
                        <stop offset="100%" stopColor={cor} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={dadosPieGermes}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive
                    animationDuration={1000}
                  >
                    {dadosPieGermes.map((_, i) => (
                      <Cell key={i} fill={`url(#germe-${i})`} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="dados-locais-tooltip">
                          <div className="dados-locais-tooltip-title">{payload[0].payload.name}</div>
                          <div className="dados-locais-tooltip-row">
                            <span>Isolamentos:</span> <strong>{payload[0].payload.value}</strong>
                          </div>
                          <div className="dados-locais-tooltip-row">
                            <span>Padrão:</span> <strong>{payload[0].payload.padrao}</strong>
                          </div>
                          <div className="dados-locais-tooltip-row">
                            <span>Resistência:</span> <strong>{payload[0].payload.resistenciaPct}%</strong>
                          </div>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="dados-locais-resistencia-bars">
              {germesResistencia.map((g, i) => (
                <div key={i} className="dados-locais-resistencia-row">
                  <div className="dados-locais-resistencia-label">
                    <span className="dados-locais-resistencia-germe">{g.germe}</span>
                    <span className="dados-locais-resistencia-padrao">{g.padrao}</span>
                  </div>
                  <div className="dados-locais-resistencia-track">
                    <div
                      className="dados-locais-resistencia-fill"
                      style={{
                        width: `${g.resistenciaPct}%`,
                        background: `linear-gradient(90deg, ${CORES_GRADIENTE[i % CORES_GRADIENTE.length]}, ${CORES_GRADIENTE[(i + 1) % CORES_GRADIENTE.length]})`,
                        boxShadow: `0 0 12px ${CORES_GRADIENTE[i % CORES_GRADIENTE.length]}40`,
                      }}
                    />
                    <span className="dados-locais-resistencia-pct">{g.resistenciaPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3) Indicadores - Gauges radiais */}
        <section className="panel dados-locais-panel dados-locais-indicadores">
          <div className="panel-header">
            <h2 className="panel-title">Indicadores e taxas</h2>
            <span className="badge">Estimativa de risco e mortalidade</span>
          </div>
          <div className="dados-locais-kpi-grid">
            {indicadoresRadial.map((ind, i) => (
              <div key={i} className="dados-locais-gauge-card">
                <div className="dados-locais-gauge-wrap">
                  <ResponsiveContainer width="100%" height={140}>
                    <RadialBarChart
                      innerRadius="60%"
                      outerRadius="100%"
                      data={[{ ...ind, pct: ind.pct }]}
                      startAngle={180}
                      endAngle={0}
                    >
                      <RadialBar
                        background={{ fill: "#f1f5f9" }}
                        dataKey="pct"
                        cornerRadius={8}
                        fill={ind.cor}
                        isAnimationActive
                        animationDuration={1200}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="dados-locais-gauge-value">
                    <span className="dados-locais-gauge-num">{ind.valor}</span>
                    <span className="dados-locais-gauge-unit">{ind.unidade}</span>
                  </div>
                </div>
                <div className="dados-locais-gauge-label">{ind.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
