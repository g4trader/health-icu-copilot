export type SpecialistKey = 'general' | 'cardiology' | 'pneumology' | 'neurology';

/**
 * Pareceres mockados dos especialistas para cada paciente
 * IDs dos pacientes: p1, p2, p3, ..., p10 (correspondendo a UTI 01, UTI 02, etc.)
 */
export const specialistOpinions: Record<SpecialistKey, Record<string, string>> = {
  general: {
    'p1': `
Parecer do Assistente Geral — UTI 01 • Sophia

Criança de 3 anos com bronquiolite viral aguda em insuficiência respiratória grave, em ventilação mecânica e uso de vasopressor. Hemodinâmica limítrofe, lactato discretamente elevado e risco de deterioração nas próximas horas.  
Priorize reavaliações seriadas da perfusão periférica, balanço hídrico e resposta ao suporte ventilatório.  
Sugiro manter metas claras de SpO₂, pressão arterial média e revisar prescrição analgésica/sedativa para evitar assincronia com o ventilador.
    `.trim(),

    'p2': `
Parecer do Assistente Geral — UTI 02 • Gabriel

Paciente de 8 anos com pneumonia bacteriana grave com derrame pleural, em suporte ventilatório invasivo, porém com estabilidade hemodinâmica moderada.  
O quadro ainda exige vigilância de sepse, mas há sinais de resposta parcial à antibioticoterapia.  
Recomendo acompanhar tendência de PCR, lactato e função renal, além de revisar diariamente possibilidade de desmame ventilatório conforme melhora de radiografia e mecânica respiratória.
    `.trim(),

    'p3': `
Parecer do Assistente Geral — UTI 03 • Isabella

Criança de 6 anos com sepse de foco abdominal no pós-operatório de apendicite complicada.  
Risco de disfunção orgânica ainda presente, especialmente no eixo hemodinâmico e renal.  
Sugiro monitorização rigorosa de débito urinário, balanço hídrico e sinais de dor/desconforto, além de reavaliação diária do esquema antimicrobiano conforme cultura e perfil de germes da unidade.
    `.trim(),

    'p4': `
Parecer do Assistente Geral — UTI 04 • Lucas

Paciente de 12 anos com trauma cranioencefálico grave pós-acidente, em observação neurológica intensiva.  
Hemodinâmica razoavelmente estável, porém qualquer queda de pressão ou hipoxemia pode piorar o prognóstico neurológico.  
Reforço a importância de metas de pressão arterial, saturação e controle estrito de CO₂, além de protocolo de sedação para evitar agitação e aumentos de pressão intracraniana.
    `.trim(),

    'p5': `
Parecer do Assistente Geral — UTI 05 • Maria Eduarda

Portadora de cardiopatia congênita descompensada, em uso de droga vasoativa e suporte ventilatório.  
Quadro frágil, com risco intermediário a alto de instabilidade súbita.  
Recomendo manter vigilância contínua de perfusão periférica, lactato e diurese, além de revisar prescrição de inotrópicos e diuréticos junto à cardiologia pediátrica.
    `.trim(),

    'p6': `
Parecer do Assistente Geral — UTI 06 • João Pedro

Criança em pós-operatório de cirurgia torácica/abdominal (mock), com suporte ventilatório invasivo e parâmetros relativamente estáveis.  
O foco aqui é evitar complicações infecciosas e respiratórias, além de controlar adequadamente a dor.  
Sugiro checar diariamente integridade de drenos, balanço hídrico, padrão de secreções e manter protocolo de analgesia multimodal.
    `.trim(),

    'p7': `
Parecer do Assistente Geral — UTI 07 • Ana Clara

Paciente em choque séptico respiratório em fase de estabilização, já com vasopressor em doses moderadas e melhora progressiva de saturação.  
Ainda há risco considerável de falência de múltiplos órgãos caso haja nova piora.  
Acompanhe rigorosamente diurese, função renal e tendência de lactato, ajustando volume e vasopressor conforme resposta clínica.
    `.trim(),

    'p8': `
Parecer do Assistente Geral — UTI 08 • Rafael

Paciente crítico com pneumonia grave e alto risco em 24h, porém com sinais de resposta parcial ao tratamento.  
Sugiro reforçar bundle de sepse (reanálise de antibiótico, controle de foco, metas hemodinâmicas) e manter comunicação estreita com a família sobre a evolução diária.  
Importante planejar cedo estratégia de desmame ventilatório ou eventual necessidade de suporte prolongado.
    `.trim(),

    'p9': `
Parecer do Assistente Geral — UTI 09 • Laura

Criança em ventilação mecânica por bronquiolite grave, sem uso atual de vasopressor e com risco moderado.  
O foco é evitar fadiga respiratória, atelectasias e sobrecarga hídrica.  
Acompanhe curva de pressão-volume, complacência e necessidade real de fluidos, ajustando suporte de forma conservadora.
    `.trim(),

    'p10': `
Parecer do Assistente Geral — UTI 10 • Enzo

Paciente em observação por insuficiência respiratória de causa viral/bacteriana (mock), com parâmetros relativamente controlados.  
Há risco de piora se houver nova sobrecarga hídrica ou infecção associada a cateter ou ventilador.  
Sugiro reforçar cuidados com dispositivos invasivos, higiene das mãos e checagem sistemática de critérios para reduzir sedação e iniciar desmame ventilatório assim que possível.
    `.trim(),
  },

  cardiology: {
    'p1': `
Cardiologia Pediátrica — UTI 01 • Sophia

MAP limítrofe, FC elevada e uso de vasopressor sugerem instabilidade hemodinâmica ainda significativa.  
Recomendo revisar meta de PAM em função da idade, avaliar necessidade de titulação fina da noradrenalina e considerar ecocardiograma à beira-leito para estimar função ventricular.  
Manter atenção para sinais de sobrecarga de volume (crepitações, hepatomegalia) e ajustar diurético conforme balanço hídrico das últimas 24h.
    `.trim(),

    'p2': `
Cardiologia Pediátrica — UTI 02 • Gabriel

Paciente sem vasopressor no momento, com PAM aceitável e frequência cardíaca compatível com quadro infeccioso.  
Não há sinais claros de choque cardiogênico, mas sepse grave pode mascarar disfunção miocárdica.  
Sugiro ecocardiograma se houver dificuldade em reduzir fluidos ou aparecer necessidade de vasopressor, além de monitorar troponina se disponível.
    `.trim(),

    'p3': `
Cardiologia Pediátrica — UTI 03 • Isabella

Sepse abdominal com risco de disfunção miocárdica secundária à resposta inflamatória sistêmica.  
Observe atentamente tendência de PAM, FC e lactato após ajustes de volume e vasopressor.  
Se houver instabilidade persistente, ecocardiograma e avaliação de fração de ejeção podem ajudar a diferenciar componente distributivo de eventual componente cardiogênico.
    `.trim(),

    'p4': `
Cardiologia Pediátrica — UTI 04 • Lucas

No TCE grave, é fundamental evitar hipotensão e hipoxemia, pois ambos pioram desfecho neurológico.  
Recomendo manter PAM em faixa alvo superior ao mínimo aceitável para idade, com uso precoce de vasopressor se necessário.  
Monitorar ECG para arritmias relacionadas a distúrbios hidroeletrolíticos e revisar correção de sódio/potássio/calcio.
    `.trim(),

    'p5': `
Cardiologia Pediátrica — UTI 05 • Maria Eduarda

Cardiopatia congênita descompensada em uso de vasopressor e possivelmente diurético.  
Sugiro metas claras de pressão arterial, saturação sistêmica e saturação venosa central se disponível.  
Ecocardiograma seriado pode guiar ajuste de inotrópico/vasodilatador, e o balanço hídrico deve ser cuidadosamente negativo, sem comprometer perfusão renal.
    `.trim(),

    'p6': `
Cardiologia Pediátrica — UTI 06 • João Pedro

Pós-operatório com risco de instabilidade hemodinâmica nas primeiras 24–48h.  
Sugiro mapa de metas: PAM mínima por idade, diurese > 1 ml/kg/h e lactato em queda.  
Se houver taquicardia desproporcional ou dificuldade em retirar drogas vasoativas, ecocardiograma precoce é recomendado.
    `.trim(),

    'p7': `
Cardiologia Pediátrica — UTI 07 • Ana Clara

Quadro séptico com necessidade de vasopressor em dose moderada.  
Recomendo titulação guiada por PAM e perfusão periférica, evitando excesso de volume.  
Avaliar marcadores de disfunção miocárdica se houver sinais de congestão pulmonar ou hepatomegalia progressiva.
    `.trim(),

    'p8': `
Cardiologia Pediátrica — UTI 08 • Rafael

Pneumonia grave com uso de suporte hemodinâmico intermitente (mock).  
Importante diferenciar taquicardia por febre/hipoxemia de taquicardia por baixo débito.  
Se a resposta à fluidoterapia estiver limitada, indicar ecocardiograma e considerar uso de inotrópico específico.
    `.trim(),

    'p9': `
Cardiologia Pediátrica — UTI 09 • Laura

Bronquiolite em ventilação mecânica, sem droga vasoativa.  
Do ponto de vista cardiológico, o foco é monitorar sobrecarga de pressão intratorácica e risco de diminuição de retorno venoso por PEEP elevada.  
Rever metas de PEEP, volume corrente e balanço hídrico, principalmente se houver hipotensão pós-ajuste ventilatório.
    `.trim(),

    'p10': `
Cardiologia Pediátrica — UTI 10 • Enzo

Paciente com quadro respiratório moderado e hemodinâmica razoavelmente estável.  
Sugiro apenas vigilância dos sinais vitais, avaliação de sopros cardíacos novos e monitorização de ECG se forem necessárias drogas que possam prolongar QT.  
Sem indicação imediata de investigação avançada, salvo se surgirem sinais de choque ou arritmias.
    `.trim(),
  },

  pneumology: {
    'p1': `
Pneumologia Pediátrica — UTI 01 • Sophia

Bronquiolite viral grave em ventilação mecânica com alto risco de piora rápida.  
Recomendo estratégias de ventilação protetora, volumes baixos e atenção redobrada a auto-PEEP.  
Fisioterapia respiratória frequente, aspiração adequada e avaliação seriada de radiografia ajudam a evitar atelectasias extensas.
    `.trim(),

    'p2': `
Pneumologia Pediátrica — UTI 02 • Gabriel

Pneumonia bacteriana com derrame pleural.  
Sugiro revisar imagem (RX ou TC) para avaliar volume do derrame e posicionamento de dreno, se houver.  
Ventilação deve ser ajustada para minimizar volutrauma, e pode ser interessante monitorar driving pressure quando possível.
    `.trim(),

    'p3': `
Pneumologia Pediátrica — UTI 03 • Isabella

Sepse abdominal em paciente ventilado, com risco de edema pulmonar e atelectasias basais.  
Recomendo metas de ventilação protetora, fisioterapia respiratória complementar e avaliação de necessidade de PEEP um pouco mais elevada.  
Acompanhar estreitamente secreção brônquica e padrão radiológico.
    `.trim(),

    'p4': `
Pneumologia Pediátrica — UTI 04 • Lucas

TCE grave com ventilação mecânica obrigatória para controle de CO₂.  
Sugiro manter PaCO₂ em faixa alvo definida pelo time neuro, evitando tanto hipercapnia quanto hipocapnia acentuada.  
Evitar altas pressões de pico que possam elevar pressão intracraniana.
    `.trim(),

    'p5': `
Pneumologia Pediátrica — UTI 05 • Maria Eduarda

Cardiopata descompensada em ventilação mecânica.  
Ajustar PEEP e FiO₂ visando boa oxigenação sem aumentar demais pós-carga do ventrículo direito.  
Avaliar possibilidade de usar modos que facilitem sincronização, reduzindo consumo de oxigênio e trabalho respiratório.
    `.trim(),

    'p6': `
Pneumologia Pediátrica — UTI 06 • João Pedro

Pós-operatório com maior risco de atelectasias segmentares.  
Sugiro manobras de recrutamento suaves, fisioterapia ativa e incentivo à mobilização precoce quando seguro.  
Monitorar dor, pois controle inadequado leva à respiração superficial e piora o padrão ventilatório.
    `.trim(),

    'p7': `
Pneumologia Pediátrica — UTI 07 • Ana Clara

Choque séptico de foco respiratório em ventilação invasiva.  
Mantenha volume corrente baixo, PEEP adequadamente titulada e atenção à complacência.  
Ajustes de FiO₂ devem ser feitos progressivamente, com metas de saturação claras para evitar hiperóxia desnecessária.
    `.trim(),

    'p8': `
Pneumologia Pediátrica — UTI 08 • Rafael

Pneumonia grave com risco de SDRA.  
Recomendo protocolarmente checar relação PaO₂/FiO₂, posição de decúbito (inclusive prono se necessário) e uso de estratégias de ventilação protetora estrita.  
Fisioterapia intensiva e manejo adequado de secreções são cruciais.
    `.trim(),

    'p9': `
Pneumologia Pediátrica — UTI 09 • Laura

Bronquiolite em ventilação mecânica, padrão clássico de hiperinsuflação.  
Sugiro tempos expiratórios mais longos, monitorização de auto-PEEP e volumes correntes baixos.  
Fisioterapia respiratória e aspiração frequente ajudam a reduzir tampões de muco e necessidade de altas pressões.
    `.trim(),

    'p10': `
Pneumologia Pediátrica — UTI 10 • Enzo

Paciente com quadro respiratório moderado, podendo estar em ventilação não invasiva ou alto fluxo (mock).  
Ajustar suporte conforme esforço respiratório e saturação, evitando fadiga.  
Reforço a importância da monitorização contínua, principalmente nas primeiras horas de admissão.
    `.trim(),
  },

  neurology: {
    'p1': `
Neurologia Pediátrica — UTI 01 • Sophia

Apesar de o foco ser respiratório, é importante monitorar sedação e analgesia para evitar agitação e assincronia.  
Sugiro objetivos de sedação claros, com escalas apropriadas para idade, e pausas diárias sempre que clinicamente seguro.  
Monitorar possíveis mioclonias, convulsões subclínicas ou alterações de pupila durante a evolução.
    `.trim(),

    'p2': `
Neurologia Pediátrica — UTI 02 • Gabriel

Infecção pulmonar grave, mas sem lesão neurológica conhecida.  
O principal cuidado é evitar delirium e agitação prolongada, ajustando sedação e promovendo ciclos sono-vigília quando possível.  
A presença de febre alta recorrente também deve motivar exame neurológico completo diário.
    `.trim(),

    'p3': `
Neurologia Pediátrica — UTI 03 • Isabella

Sepse abdominal com risco de encefalopatia séptica.  
Se houver rebaixamento de nível de consciência desproporcional à sedação, considerar EEG e neuroimagem.  
Ajustar drogas sedativas para evitar acumulação em paciente potencialmente com função hepatorrenal comprometida.
    `.trim(),

    'p4': `
Neurologia Pediátrica — UTI 04 • Lucas

TCE grave em vigilância neurológica intensiva.  
Sugiro protocolo rígido de avaliação de pupilas, resposta motora e Glasgow seriado, bem como metas hemodinâmicas que evitem hipotensão e hipoxemia.  
Monitorização de PIC, quando disponível, é altamente desejável, com sedação otimizada para controle de agitação.
    `.trim(),

    'p5': `
Neurologia Pediátrica — UTI 05 • Maria Eduarda

Cardiopatia descompensada com risco de hipoxemia e hipotensão, ambos nocivos ao sistema nervoso central.  
Recomendo exame neurológico diário, atenção a sinais de encefalopatia e vigilância para delirium em fases de melhora clínica.  
Sedação deve ser a mínima necessária para manter segurança e conforto.
    `.trim(),

    'p6': `
Neurologia Pediátrica — UTI 06 • João Pedro

Pós-operatório de grande porte, com provável uso de sedação por tempo limitado.  
Fazer desmame progressivo assim que o quadro hemodinâmico e respiratório permitir, observando sinais de delirium emergente.  
Engajar a família em estímulos afetivos e cognitivos simples melhora a recuperação.
    `.trim(),

    'p7': `
Neurologia Pediátrica — UTI 07 • Ana Clara

Choque séptico com possíveis repercussões neurológicas (encefalopatia séptica, delirium).  
Monitorar nível de consciência, padrão de sono e necessidade real de sedação contínua.  
Se surgir assimetria de pupilas, crises convulsivas ou rigidez, indicar avaliação neurológica e neuroimagem de urgência.
    `.trim(),

    'p8': `
Neurologia Pediátrica — UTI 08 • Rafael

Pneumonia grave em suporte ventilatório, sedado.  
Sugiro planejar desde cedo janela de despertar diário, sempre que a condição respiratória permitir, para reavaliar estado neurológico.  
Observar agitação pós-desmame como possível sinal de dor, delirium ou hipóxia.
    `.trim(),

    'p9': `
Neurologia Pediátrica — UTI 09 • Laura

Bronquiolite ventilada, em geral com boa reserva neurológica, mas sujeita a sedação prolongada.  
O objetivo é evitar super-sedação, que atrasa desmame ventilatório, e sub-sedação, que causa agitação e risco de extubação acidental.  
Planejar transição para sedação mais leve assim que houver estabilidade respiratória.
    `.trim(),

    'p10': `
Neurologia Pediátrica — UTI 10 • Enzo

Quadro respiratório moderado com potencial necessidade de sedação leve apenas para procedimentos.  
Sugiro evitar benzodiazepínicos prolongados sempre que possível, dando preferência a esquemas que causem menos delirium.  
Exame neurológico completo a cada plantão é suficiente, salvo surgimento de novas queixas.
    `.trim(),
  },
};



