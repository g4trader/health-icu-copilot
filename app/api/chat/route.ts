import { NextResponse } from "next/server";
import {
  mockPatients,
  riskLevelFromScore,
  getSortedByMortalityRisk24h,
  getTopUnstablePatients,
  getPossibleNonRespondersToTherapy,
  type Patient
} from "@/lib/mockData";

interface RequestBody {
  message: string;
  focusedPatientId?: string | null;
}

const DISCLAIMER =
  "\n\n⚠️ **Lembrete importante**: Este é um protótipo com dados completamente fictícios e serve apenas como apoio à decisão, nunca substituindo a avaliação clínica.";

/**
 * Handler para intenção de priorização de pacientes.
 */
function handlePrioritizationIntent(message: string): { reply: string; topN: number } {
  // Extrair número da mensagem (padrão: 3)
  let topN = 3;
  const match = message.toLowerCase().match(/(\d+)/);
  if (match) {
    const parsed = parseInt(match[1], 10);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 10) {
      topN = parsed;
    }
  }

  const sorted = getSortedByMortalityRisk24h();
  const topPatients = sorted.slice(0, topN);

  const templates = [
    () => {
      const lines: string[] = [];
      lines.push(`Após acessar os prontuários eletrônicos e analisar os parâmetros de risco em tempo real, selecionando os ${topN} pacientes mais graves para as próximas 24 horas:`);
      lines.push("");
      topPatients.forEach((p, idx) => {
        const risco24 = (p.riscoMortality24h * 100).toFixed(0);
        lines.push(`${idx + 1}. **${p.leito} • ${p.nome}** (${p.idade} ${p.idade === 1 ? "ano" : "anos"})`);
        lines.push(`   Risco 24h: ${risco24}% • Diagnóstico: ${p.diagnosticoPrincipal}`);
        const detalhes: string[] = [];
        if (p.emVasopressor) detalhes.push("vasopressor");
        if (p.emVentilacaoMecanica) detalhes.push("VM");
        detalhes.push(`SOFA ${p.sofa}`, `lactato ${p.lactato.toFixed(1)} mmol/L`);
        lines.push(`   ${detalhes.join(" • ")} • ${p.diasDeUTI} dias de UTI`);
        lines.push("");
      });
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push(`Com base na análise de risco de mortalidade em 24h e instabilidade hemodinâmica, cruzando dados do prontuário eletrônico. Selecionando os ${topN} pacientes mais graves:`);
      lines.push("");
      lines.push(`**TOP ${topN} por prioridade de avaliação:**`);
      lines.push("");
      topPatients.forEach((p, idx) => {
        const risco24 = (p.riscoMortality24h * 100).toFixed(0);
        lines.push(`**${idx + 1}. ${p.leito}** — ${p.nome} (${p.idade} ${p.idade === 1 ? "ano" : "anos"})`);
        lines.push(`   ${p.diagnosticoPrincipal}`);
        lines.push(`   Risco ${risco24}% • ${p.emVentilacaoMecanica ? "VM" : "Sem VM"} • ${p.emVasopressor ? "vasoativo" : "sem vasoativo"}`);
        lines.push("");
      });
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push(`Consulta aos prontuários eletrônicos concluída. ${topN} ${topN === 1 ? "paciente requer" : "pacientes requerem"} atenção imediata:`);
      lines.push("");
      topPatients.forEach((p, idx) => {
        const risco24 = (p.riscoMortality24h * 100).toFixed(0);
        lines.push(`**${p.leito} — ${p.nome}** (${p.idade} ${p.idade === 1 ? "ano" : "anos"})`);
        lines.push(`Risco estimado: ${risco24}% em 24h | SOFA: ${p.sofa} | Lactato: ${p.lactato.toFixed(1)} mmol/L`);
        lines.push(`Diagnóstico: ${p.diagnosticoPrincipal}`);
        if (p.mapaPressaoMedia < 65) {
          lines.push(`⚠️ Hipotensão (MAP: ${p.mapaPressaoMedia} mmHg)`);
        }
        lines.push("");
      });
      return lines.join("\n");
    }
  ];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return { reply: template() + DISCLAIMER, topN };
}

/**
 * Handler para intenção de exames laboratoriais.
 */
function handleLaboratoryExamsIntent(): { reply: string; showIcuPanel: boolean } {
  const templates = [
    () => {
      const lactatoAlto = mockPatients.filter((p) => p.lactato >= 3).length;
      const pcrElevado = mockPatients.filter((p) => p.emAntibiotico && p.temperatura >= 38).length;
      const lines: string[] = [];
      lines.push("Acessando exames laboratoriais recentes no prontuário eletrônico...");
      lines.push("");
      lines.push("**Resumo de exames críticos (últimas 24h):**");
      lines.push("");
      lines.push(`• **Lactato elevado (≥3 mmol/L):** ${lactatoAlto} ${lactatoAlto === 1 ? "paciente" : "pacientes"}`);
      lines.push(`• **PCR muito elevada (associada a febre):** ${pcrElevado} ${pcrElevado === 1 ? "caso" : "casos"} em uso de antimicrobiano`);
      const piorou = mockPatients.filter((p) => p.tendenciaLactato === "subindo" && p.lactato >= 2.5).length;
      if (piorou > 0) {
        lines.push(`• **Piora laboratorial recente (lactato subindo):** ${piorou} ${piorou === 1 ? "paciente" : "pacientes"}`);
      }
      lines.push("");
      lines.push("Dados obtidos da integração com o laboratório. Recomendo revisão individual de cada prontuário para decisões clínicas.");
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Buscando exames laboratoriais recentes no sistema...");
      lines.push("");
      lines.push("**Análise de exames críticos:**");
      lines.push("");
      const comLactatoAlto = mockPatients.filter((p) => p.lactato >= 3);
      if (comLactatoAlto.length > 0) {
        lines.push(`• ${comLactatoAlto.length} ${comLactatoAlto.length === 1 ? "paciente com" : "pacientes com"} lactato ≥3 mmol/L:`);
        comLactatoAlto.forEach((p) => {
          lines.push(`  - ${p.leito} (${p.nome}): ${p.lactato.toFixed(1)} mmol/L — tendência: ${p.tendenciaLactato}`);
        });
        lines.push("");
      }
      const gasometria = mockPatients.filter((p) => p.emVentilacaoMecanica).length;
      lines.push(`• ${gasometria} ${gasometria === 1 ? "paciente em" : "pacientes em"} ventilação mecânica (gasometria arterial disponível no prontuário)`);
      lines.push("");
      lines.push("Todos os valores foram obtidos do prontuário eletrônico. Confirme sempre com os laudos oficiais.");
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Consultando banco de dados de exames laboratoriais...");
      lines.push("");
      lines.push("**Últimas atualizações laboratoriais:**");
      lines.push("");
      const sorted = getSortedByMortalityRisk24h().slice(0, 3);
      sorted.forEach((p) => {
        lines.push(`**${p.leito} — ${p.nome}:**`);
        lines.push(`• Lactato: ${p.lactato.toFixed(1)} mmol/L (${p.tendenciaLactato})`);
        lines.push(`• Temperatura: ${p.temperatura.toFixed(1)}°C`);
        if (p.emAntibiotico) {
          lines.push(`• Em uso de antimicrobiano há ${p.diasEmAntibioticoAtual} ${p.diasEmAntibioticoAtual === 1 ? "dia" : "dias"}`);
        }
        lines.push("");
      });
      lines.push("Dados extraídos do prontuário eletrônico. Verifique sempre os laudos completos antes de decisões clínicas.");
      return lines.join("\n");
    }
  ];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return { reply: template() + DISCLAIMER, showIcuPanel: false };
}

/**
 * Handler para intenção de exames de imagem.
 */
function handleImagingIntent(): { reply: string; showIcuPanel: boolean } {
  const templates = [
    () => {
      const lines: string[] = [];
      lines.push("Analisando exames de imagem dos últimos 30 dias no sistema de PACS...");
      lines.push("");
      lines.push("**Padrões identificados:**");
      lines.push("");
      const respiratorios = mockPatients.filter((p) => 
        p.diagnosticoPrincipal.toLowerCase().includes("pneumonia") || 
        p.diagnosticoPrincipal.toLowerCase().includes("bronquiolite") ||
        p.diagnosticoPrincipal.toLowerCase().includes("respiratória")
      ).length;
      lines.push(`• **Padrão de pneumonia/consolidação:** ${respiratorios} ${respiratorios === 1 ? "paciente" : "pacientes"} com laudos recentes compatíveis`);
      lines.push(`• **Derrame pleural:** ${mockPatients.filter((p) => p.tags.some(t => t.toLowerCase().includes("derrame"))).length} casos`);
      lines.push(`• **Padrão alveolar difuso:** identificado em pacientes com sepse respiratória`);
      lines.push("");
      lines.push("Análise baseada em histórico de exames de imagem do prontuário eletrônico. Recomendo revisão dos laudos oficiais para confirmação.");
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Buscando exames de imagem (radiografias, tomografias) dos últimos 30 dias...");
      lines.push("");
      lines.push("**Análise de padrões radiológicos:**");
      lines.push("");
      lines.push("Nos últimos 30 dias, aproximadamente 60% dos laudos de radiografia de tórax mostraram:");
      lines.push("• Consolidação pulmonar bilateral ou unilateral");
      lines.push("• Opacidades em vidro fosco (compatível com processo inflamatório)");
      lines.push("• Derrame pleural de pequeno a moderado volume");
      lines.push("");
      lines.push("Pacientes com sepse e bronquiolite mostraram maior incidência de consolidações bilaterais.");
      lines.push("");
      lines.push("Dados obtidos da integração com o sistema de imagens. Sempre revise os laudos oficiais.");
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Acessando banco de dados de exames de imagem...");
      lines.push("");
      lines.push("**Padrões radiológicos identificados (últimos 30 dias):**");
      lines.push("");
      const pacientesComPneumonia = mockPatients.filter((p) => 
        p.diagnosticoPrincipal.toLowerCase().includes("pneumonia")
      );
      if (pacientesComPneumonia.length > 0) {
        lines.push(`• **Consolidação lobar:** identificada em ${pacientesComPneumonia.length} ${pacientesComPneumonia.length === 1 ? "paciente" : "pacientes"}`);
        pacientesComPneumonia.forEach((p) => {
          lines.push(`  - ${p.leito} (${p.nome}): padrão consolidativo bilateral`);
        });
        lines.push("");
      }
      lines.push("• **Ultrassonografia abdominal:** múltiplos casos com padrão de espessamento de alça intestinal em pacientes sépticos");
      lines.push("");
      lines.push("Análise realizada via integração com PACS. Confirme sempre com os laudos oficiais do serviço de imagem.");
      return lines.join("\n");
    }
  ];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return { reply: template() + DISCLAIMER, showIcuPanel: false };
}

/**
 * Handler para intenção de prescrições e cálculos de dose.
 */
function handlePrescriptionIntent(): { reply: string; showIcuPanel: boolean } {
  const templates = [
    () => {
      const lines: string[] = [];
      lines.push("Revisando prescrições ativas e calculando doses pediátricas (mg/kg)...");
      lines.push("");
      lines.push("**Análise de prescrições:**");
      lines.push("");
      const emAntibiotico = mockPatients.filter((p) => p.emAntibiotico);
      if (emAntibiotico.length > 0) {
        lines.push(`• ${emAntibiotico.length} ${emAntibiotico.length === 1 ? "paciente em" : "pacientes em"} uso de antimicrobiano:`);
        emAntibiotico.forEach((p) => {
          lines.push(`  - ${p.leito} (${p.nome}, ${p.idade} ${p.idade === 1 ? "ano" : "anos"}): D${p.diasEmAntibioticoAtual}`);
          if (p.diasEmAntibioticoAtual >= 3 && p.temperatura >= 38) {
            lines.push(`    ⚠️ Atenção: febre persistente após ${p.diasEmAntibioticoAtual} dias — considerar reavaliação`);
          }
        });
        lines.push("");
      }
      const emVaso = mockPatients.filter((p) => p.emVasopressor);
      if (emVaso.length > 0) {
        lines.push(`• Vasopressores em uso: ${emVaso.length} ${emVaso.length === 1 ? "paciente" : "pacientes"}`);
        lines.push("  Recomendação: verificar doses ajustadas por peso e resposta hemodinâmica.");
        lines.push("");
      }
      lines.push("⚠️ **Importante:** Todas as doses devem ser calculadas por peso (mg/kg) e ajustadas para função renal/hepática. Este é apenas um alerta de apoio — a prescrição final é de responsabilidade médica.");
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Analisando prescrições ativas no prontuário eletrônico...");
      lines.push("");
      lines.push("**Revisão de doses pediátricas:**");
      lines.push("");
      lines.push("Conferindo cálculos de dose por peso (mg/kg) para todos os pacientes:");
      lines.push("");
      mockPatients.forEach((p) => {
        if (p.emAntibiotico || p.emVasopressor) {
          lines.push(`**${p.leito} — ${p.nome}** (${p.idade} ${p.idade === 1 ? "ano" : "anos"}):`);
          if (p.emAntibiotico) {
            lines.push(`  • Antimicrobiano: D${p.diasEmAntibioticoAtual} — tempo de uso monitorado`);
          }
          if (p.emVasopressor) {
            lines.push(`  • Vasopressor: dose ajustada por peso — revisar ajuste conforme resposta`);
          }
          lines.push("");
        }
      });
      lines.push("**Lembrete:** Em pediatria, todas as doses devem considerar peso, superfície corporal e função renal/hepática. Revisar periodicamente a necessidade de ajuste.");
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Consultando prescrições ativas e verificando adequação de doses...");
      lines.push("");
      const precisaRevisar = mockPatients.filter((p) => 
        p.emAntibiotico && p.diasEmAntibioticoAtual >= 3 && (p.temperatura >= 38 || p.tendenciaLactato === "subindo")
      );
      if (precisaRevisar.length > 0) {
        lines.push("**Prescrições que podem requerer reavaliação:**");
        lines.push("");
        precisaRevisar.forEach((p) => {
          lines.push(`• ${p.leito} (${p.nome}): antimicrobiano D${p.diasEmAntibioticoAtual}`);
          lines.push(`  - Motivo: ${p.temperatura >= 38 ? "febre persistente" : ""} ${p.temperatura >= 38 && p.tendenciaLactato === "subindo" ? "e " : ""}${p.tendenciaLactato === "subindo" ? "lactato em ascensão" : ""}`);
          lines.push(`  - Sugestão: considerar reavaliação do esquema antimicrobiano`);
          lines.push("");
        });
      }
      lines.push("**Atenção:** Este é um alerta de apoio. Toda prescrição deve ser revisada clinicamente, considerando peso, função renal/hepática e resposta ao tratamento.");
      return lines.join("\n");
    }
  ];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return { reply: template() + DISCLAIMER, showIcuPanel: false };
}

/**
 * Handler para intenção de perfil da unidade / casuística.
 */
function handleUnitProfileIntent(): { reply: string; showIcuPanel: boolean } {
  const templates = [
    () => {
      const lines: string[] = [];
      lines.push("Analisando perfil epidemiológico da UTI pediátrica (últimos 30 dias)...");
      lines.push("");
      lines.push("**Casuística da unidade:**");
      lines.push("");
      const respiratorios = mockPatients.filter((p) => 
        p.diagnosticoPrincipal.toLowerCase().includes("pneumonia") || 
        p.diagnosticoPrincipal.toLowerCase().includes("bronquiolite") ||
        p.diagnosticoPrincipal.toLowerCase().includes("respiratória")
      ).length;
      const sepse = mockPatients.filter((p) => 
        p.diagnosticoPrincipal.toLowerCase().includes("sepse")
      ).length;
      const cardiopatia = mockPatients.filter((p) => 
        p.diagnosticoPrincipal.toLowerCase().includes("cardiopatia")
      ).length;
      const trauma = mockPatients.filter((p) => 
        p.diagnosticoPrincipal.toLowerCase().includes("trauma")
      ).length;
      const total = mockPatients.length;
      lines.push(`• **Casos respiratórios (bronquiolite, pneumonia):** ${respiratorios}/${total} (${((respiratorios/total)*100).toFixed(0)}%)`);
      lines.push(`• **Sepse (diversos focos):** ${sepse}/${total} (${((sepse/total)*100).toFixed(0)}%)`);
      lines.push(`• **Cardiopatias congênitas:** ${cardiopatia}/${total} (${((cardiopatia/total)*100).toFixed(0)}%)`);
      lines.push(`• **Trauma:** ${trauma}/${total} (${((trauma/total)*100).toFixed(0)}%)`);
      lines.push("");
      lines.push("**Sazonalidade:** Observa-se maior incidência de casos respiratórios, compatível com sazonalidade de infecções virais na faixa etária pediátrica.");
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Gerando relatório de perfil da unidade baseado em dados dos últimos 30 dias...");
      lines.push("");
      lines.push("**Distribuição por tipo de caso:**");
      lines.push("");
      const diagnosticos = mockPatients.map(p => p.diagnosticoPrincipal);
      const categorias: Record<string, number> = {
        "Respiratórios": 0,
        "Sepse": 0,
        "Cardiopatias": 0,
        "Trauma": 0,
        "Outros": 0
      };
      diagnosticos.forEach(d => {
        const dLower = d.toLowerCase();
        if (dLower.includes("pneumonia") || dLower.includes("bronquiolite") || dLower.includes("respiratória")) {
          categorias["Respiratórios"]++;
        } else if (dLower.includes("sepse")) {
          categorias["Sepse"]++;
        } else if (dLower.includes("cardiopatia")) {
          categorias["Cardiopatias"]++;
        } else if (dLower.includes("trauma")) {
          categorias["Trauma"]++;
        } else {
          categorias["Outros"]++;
        }
      });
      Object.entries(categorias).forEach(([cat, count]) => {
        if (count > 0) {
          lines.push(`• ${cat}: ${count} ${count === 1 ? "caso" : "casos"}`);
        }
      });
      lines.push("");
      lines.push("**Observação:** Perfil típico de UTI pediátrica com predominância de casos respiratórios e infecciosos, seguidos de cardiopatias e trauma.");
      return lines.join("\n");
    },
    () => {
      const lines: string[] = [];
      lines.push("Consultando banco de dados epidemiológico da UTI pediátrica...");
      lines.push("");
      lines.push("**Perfil da casuística (últimos 30 dias):**");
      lines.push("");
      lines.push("Principais doenças atendidas:");
      lines.push("");
      mockPatients.forEach((p, idx) => {
        lines.push(`${idx + 1}. ${p.diagnosticoPrincipal} — ${p.idade} ${p.idade === 1 ? "ano" : "anos"}`);
      });
      lines.push("");
      lines.push("**Padrão sazonal:** Maior concentração de casos respiratórios e infecciosos, característico da faixa etária pediátrica e sazonalidade de infecções virais.");
      return lines.join("\n");
    }
  ];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return { reply: template() + DISCLAIMER, showIcuPanel: false };
}

/**
 * Handler para intenção de paciente específico.
 */
function handleFocusedPatientIntent(focusedPatientId: string): { reply: string; showIcuPanel: boolean } {
  const p = mockPatients.find((p) => p.id === focusedPatientId);
  if (!p) {
    return { reply: "Não encontrei o paciente selecionado. Tente selecionar novamente." + DISCLAIMER, showIcuPanel: false };
  }

  const risco24 = (p.riscoMortality24h * 100).toFixed(0);
  const risco7 = (p.riscoMortality7d * 100).toFixed(0);
  const riscoLevel = riskLevelFromScore(p.riscoMortality24h);

  const linhas: string[] = [];
  linhas.push(`**Resumo pediátrico completo — ${p.nome}, leito ${p.leito}:**`);
  linhas.push("");
  linhas.push(`**Dados demográficos:** ${p.idade} ${p.idade === 1 ? "ano" : "anos"} de idade`);
  linhas.push(`**Diagnóstico principal:** ${p.diagnosticoPrincipal}`);
  linhas.push(`**Dias de internação na UTI:** ${p.diasDeUTI} ${p.diasDeUTI === 1 ? "dia" : "dias"}`);
  linhas.push("");
  linhas.push(`**Risco estimado:** ${risco24}% em 24h (${riscoLevel}) • ${risco7}% em 7 dias`);
  linhas.push("");
  linhas.push("**Parâmetros atuais (dados do prontuário eletrônico):**");
  linhas.push(`• SOFA: ${p.sofa}`);
  linhas.push(`• Lactato: ${p.lactato.toFixed(1)} mmol/L (tendência: ${p.tendenciaLactato})`);
  linhas.push(`• Pressão arterial média: ${p.mapaPressaoMedia} mmHg`);
  linhas.push(`• Temperatura: ${p.temperatura.toFixed(1)}°C`);
  linhas.push(`• ${p.emVasopressor ? "Em uso de vasopressor" : "Sem vasopressor"}`);
  linhas.push(`• ${p.emVentilacaoMecanica ? "Em ventilação mecânica" : "Sem ventilação mecânica"}`);
  if (p.emAntibiotico) {
    linhas.push(`• Em uso de antimicrobiano há ${p.diasEmAntibioticoAtual} ${p.diasEmAntibioticoAtual === 1 ? "dia" : "dias"} (D${p.diasEmAntibioticoAtual})`);
  }
  linhas.push("");
  linhas.push("**Pontos de atenção:**");
  p.tags.forEach((t) => {
    linhas.push(`• ${t}`);
  });

  const alertas: string[] = [];
  if (p.tendenciaLactato === "subindo" && p.lactato >= 3) {
    alertas.push("Lactato em ascensão — monitorar de perto");
  }
  if (p.mapaPressaoMedia < 65) {
    alertas.push("Hipotensão (MAP < 65 mmHg)");
  }
  if (p.emAntibiotico && p.diasEmAntibioticoAtual >= 2 && p.temperatura >= 38) {
    alertas.push("Febre persistente após início de antimicrobiano — considerar reavaliação");
  }
  if (p.responseToTherapyScore < 0.5) {
    alertas.push("Resposta à terapia abaixo do esperado");
  }

  if (alertas.length > 0) {
    linhas.push("");
    linhas.push("**Alertas:**");
    alertas.forEach((a) => linhas.push(`⚠️ ${a}`));
  }

  linhas.push("");
  linhas.push("Dados obtidos do prontuário eletrônico. Use essas informações como apoio para sua avaliação clínica.");

  return { reply: linhas.join("\n") + DISCLAIMER, showIcuPanel: false };
}

/**
 * Handler fallback.
 */
function handleFallbackIntent(): { reply: string; showIcuPanel: boolean } {
  return {
    reply: (
      "Olá! Sou o **Health Copilot +**, um assistente de apoio à decisão para UTI pediátrica.\n\n" +
      "Posso ajudar com:\n\n" +
      "1. **Priorização de pacientes** por risco de mortalidade\n" +
      "2. **Análise de exames laboratoriais** recentes\n" +
      "3. **Padrões em exames de imagem** dos últimos 30 dias\n" +
      "4. **Revisão de prescrições e cálculos de dose** pediátrica\n" +
      "5. **Perfil epidemiológico da unidade** (casuística)\n" +
      "6. **Resumo completo de um paciente específico**\n\n" +
      "Tente perguntas como:\n" +
      "• 'Quais são os 3 pacientes com maior risco de mortalidade em 24h?'\n" +
      "• 'Me mostre os exames laboratoriais recentes'\n" +
      "• 'Estamos vendo muitos padrões de pneumonia nas imagens?'\n" +
      "• 'Preciso revisar as prescrições de antibióticos'\n" +
      "• 'Qual o perfil da unidade nos últimos 30 dias?'" +
      DISCLAIMER
    ),
    showIcuPanel: false
  };
}

/**
 * Detecta a intenção do usuário.
 */
function detectIntent(
  message: string,
  focusedPatientId: string | null
): "prioritization" | "laboratory" | "imaging" | "prescription" | "unit_profile" | "focused_patient" | "fallback" {
  const msg = message.toLowerCase();

  // Paciente específico (prioridade)
  if (
    focusedPatientId &&
    (msg.includes("esse paciente") ||
      msg.includes("este paciente") ||
      msg.includes("desse paciente") ||
      msg.includes("deste paciente") ||
      msg.includes("resumo") ||
      msg.includes("quadro") ||
      msg.includes("situação") ||
      msg.includes("como está"))
  ) {
    return "focused_patient";
  }

  // Priorização / Risco
  if (
    msg.includes("prioridade") ||
    msg.includes("priorizar") ||
    msg.includes("quem eu vejo primeiro") ||
    msg.includes("maior risco") ||
    msg.includes("pior paciente") ||
    msg.includes("mais grave") ||
    msg.includes("quem precisa") ||
    msg.includes("urgente") ||
    msg.includes("top") ||
    (msg.includes("maior") && msg.includes("risco"))
  ) {
    return "prioritization";
  }

  // Exames laboratoriais
  if (
    msg.includes("exame") ||
    msg.includes("exames") ||
    msg.includes("laboratorial") ||
    msg.includes("gasometria") ||
    msg.includes("lactato") ||
    msg.includes("hemograma") ||
    msg.includes("pcr") ||
    msg.includes("procalcitonina") ||
    msg.includes("laboratório")
  ) {
    return "laboratory";
  }

  // Imagens
  if (
    msg.includes("imagem") ||
    msg.includes("radiografia") ||
    msg.includes("raio-x") ||
    msg.includes("rx") ||
    msg.includes("tomografia") ||
    msg.includes("tc") ||
    msg.includes("ultrassom") ||
    msg.includes("padrão") ||
    msg.includes("padrões") ||
    (msg.includes("últimos") && msg.includes("30 dias")) ||
    (msg.includes("ultimos") && msg.includes("30 dias")) ||
    (msg.includes("pneumonia") && (msg.includes("imagem") || msg.includes("radiografia")))
  ) {
    return "imaging";
  }

  // Prescrições
  if (
    msg.includes("prescrição") ||
    msg.includes("prescrições") ||
    msg.includes("prescricao") ||
    msg.includes("prescricoes") ||
    msg.includes("dose") ||
    msg.includes("mg/kg") ||
    msg.includes("antibiótico") ||
    msg.includes("antibiotico") ||
    msg.includes("sedação") ||
    msg.includes("sedacao") ||
    msg.includes("vasopressor") ||
    msg.includes("rever prescrição") ||
    msg.includes("revisar prescrição")
  ) {
    return "prescription";
  }

  // Perfil da unidade
  if (
    msg.includes("perfil da unidade") ||
    msg.includes("principais doenças") ||
    msg.includes("tipos de doenças") ||
    msg.includes("casuística") ||
    msg.includes("casuistica") ||
    msg.includes("epidemiologia") ||
    (msg.includes("últimos") && (msg.includes("meses") || msg.includes("dias"))) ||
    (msg.includes("ultimos") && (msg.includes("meses") || msg.includes("dias")))
  ) {
    return "unit_profile";
  }

  // Paciente específico (fallback se há focusedPatientId)
  if (focusedPatientId) {
    return "focused_patient";
  }

  return "fallback";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const message = (body.message || "").trim();
    const focusedId = body.focusedPatientId ?? null;

    if (!message) {
      return NextResponse.json({
        reply: "Por favor, envie uma mensagem." + DISCLAIMER,
        showIcuPanel: false
      });
    }

    const intent = detectIntent(message, focusedId);
    let result: { reply: string; showIcuPanel: boolean; topN?: number };

    switch (intent) {
      case "prioritization": {
        const prioritizationResult = handlePrioritizationIntent(message);
        result = { ...prioritizationResult, showIcuPanel: true };
        break;
      }
      case "laboratory":
        result = handleLaboratoryExamsIntent();
        break;
      case "imaging":
        result = handleImagingIntent();
        break;
      case "prescription":
        result = handlePrescriptionIntent();
        break;
      case "unit_profile":
        result = handleUnitProfileIntent();
        break;
      case "focused_patient":
        if (!focusedId) {
          result = { reply: "Para obter um resumo de um paciente específico, selecione-o primeiro." + DISCLAIMER, showIcuPanel: false };
        } else {
          result = handleFocusedPatientIntent(focusedId);
        }
        break;
      default:
        result = handleFallbackIntent();
    }

    return NextResponse.json({ reply: result.reply, showIcuPanel: result.showIcuPanel, topN: result.topN });
  } catch (error) {
    return NextResponse.json(
      {
        reply: "Tive um problema temporário ao processar sua pergunta. Tente novamente em instantes." + DISCLAIMER,
        showIcuPanel: false
      },
      { status: 500 }
    );
  }
}
