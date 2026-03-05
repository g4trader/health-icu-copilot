"use client";

import "./DadosLocaisDashboard.css";

/**
 * Dashboard "Dados locais da UTI" – apenas na rota /iatron-fut.
 * Dados simulados: principais patologias, padrão de germes/resistência, indicadores e taxas.
 */
export function DadosLocaisDashboard() {
  const principaisPatologias = [
    { nome: "Pneumonia associada à ventilação (PAV)", casos: 4, percentual: 28 },
    { nome: "Sepse / choque séptico", casos: 3, percentual: 21 },
    { nome: "Pós-operatório cardiovascular", casos: 2, percentual: 14 },
    { nome: "Bronquiolite / insuficiência respiratória", casos: 2, percentual: 14 },
    { nome: "Trauma / pós-cirúrgico", casos: 2, percentual: 14 },
    { nome: "Outros", casos: 1, percentual: 9 },
  ];

  const germesResistencia = [
    { germe: "Klebsiella pneumoniae", padrao: "ESBL+", isolamentos: 5, resistencia: "Ceftriaxona 80%, Meropenem 20%" },
    { germe: "Pseudomonas aeruginosa", padrao: "Multirresistente", isolamentos: 3, resistencia: "Piperacilina-tazobactam 33%, Meropenem 33%" },
    { germe: "Staphylococcus aureus", padrao: "MRSA", isolamentos: 2, resistencia: "Oxacilina 100%" },
    { germe: "E. coli", padrao: "ESBL+", isolamentos: 4, resistencia: "Ciprofloxacino 75%, Ceftriaxona 100%" },
    { germe: "Acinetobacter spp.", padrao: "Carbapenem-resistente", isolamentos: 1, resistencia: "Meropenem 100%" },
  ];

  const indicadores = [
    { label: "Risco médio estimado (24h)", valor: "18%", descricao: "Média ponderada dos pacientes internados" },
    { label: "Taxa de mortalidade estimada (24h)", valor: "4,2%", descricao: "Baseada em escore de gravidade (ex. PIM, SOFA)" },
    { label: "Pacientes em alto risco (≥30%)", valor: "3", descricao: "Últimas 24 horas" },
    { label: "Ocupação", valor: "100%", descricao: "10/10 leitos" },
  ];

  return (
    <div className="dados-locais-dashboard">
      <div className="dados-locais-header">
        <h1 className="dados-locais-title">Dados locais da UTI</h1>
        <p className="dados-locais-subtitle">Unidade Pediátrica A · Dados simulados para desenvolvimento</p>
      </div>

      <div className="dados-locais-grid">
        {/* 1) Principais patologias */}
        <section className="panel dados-locais-panel">
          <div className="panel-header">
            <h2 className="panel-title">Principais patologias</h2>
            <span className="badge">Últimos 30 dias</span>
          </div>
          <div className="dados-locais-table-wrap">
            <table className="dados-locais-table">
              <thead>
                <tr>
                  <th>Patologia</th>
                  <th className="dados-locais-th-num">Casos</th>
                  <th className="dados-locais-th-num">%</th>
                </tr>
              </thead>
              <tbody>
                {principaisPatologias.map((row, i) => (
                  <tr key={i}>
                    <td>{row.nome}</td>
                    <td className="dados-locais-td-num">{row.casos}</td>
                    <td className="dados-locais-td-num">{row.percentual}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2) Padrão de germes e resistência */}
        <section className="panel dados-locais-panel">
          <div className="panel-header">
            <h2 className="panel-title">Padrão de germes e resistência</h2>
            <span className="badge">Cultura + antibiograma</span>
          </div>
          <div className="dados-locais-table-wrap">
            <table className="dados-locais-table dados-locais-table-wide">
              <thead>
                <tr>
                  <th>Germe</th>
                  <th>Padrão</th>
                  <th className="dados-locais-th-num">Isolamentos</th>
                  <th>Resistência (exemplos)</th>
                </tr>
              </thead>
              <tbody>
                {germesResistencia.map((row, i) => (
                  <tr key={i}>
                    <td>{row.germe}</td>
                    <td><span className="dados-locais-tag">{row.padrao}</span></td>
                    <td className="dados-locais-td-num">{row.isolamentos}</td>
                    <td className="dados-locais-small">{row.resistencia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3) Indicadores e taxas */}
        <section className="panel dados-locais-panel dados-locais-indicadores">
          <div className="panel-header">
            <h2 className="panel-title">Indicadores e taxas</h2>
            <span className="badge">Estimativa de risco e mortalidade</span>
          </div>
          <div className="dados-locais-kpi-grid">
            {indicadores.map((item, i) => (
              <div key={i} className="detail-card dados-locais-kpi-card">
                <div className="dados-locais-kpi-label">{item.label}</div>
                <div className="dados-locais-kpi-value">{item.valor}</div>
                <div className="dados-locais-kpi-desc">{item.descricao}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
