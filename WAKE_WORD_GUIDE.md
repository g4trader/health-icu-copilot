# Guia de Wake Words - Health ICU Copilot

## Palavras-chave suportadas

O sistema detecta as seguintes palavras-chave para iniciar gravação de voz automaticamente:

### 1. "virtus" (ou "virtude")

**Fonética em português brasileiro:**
- Pronúncia: **/ˈviʁ.tus/** ou **/ˈviʁ.tu.de/**
- Pronúncia aproximada: **"VIR-tus"** ou **"VIR-tu-de"**
- Pronúncia coloquial: **"VIR-tuz"** ou **"VIR-tu-dez"**

**Variações aceitas:**
- "virtus" (pronúncia latina)
- "virtude" (português)
- "virtu" (abreviação)
- "virtuz" (com 'z' no final)
- "birtus" / "birtuz" (variação com 'b')
- "firtus" / "firtuz" (variação com 'f')

### 2. "doctor" (ou "doutor")

**Fonética em português brasileiro:**
- Pronúncia: **/dokˈtoʁ/** ou **/doˈtoʁ/**
- Pronúncia aproximada: **"dok-TOR"** ou **"do-TOR"**
- Pronúncia coloquial: **"doutor"** (português)

**Variações aceitas:**
- "doctor" (inglês)
- "doutor" (português)
- "dotor" (sem 'u')
- "doktor" (com 'k')

## Como usar

1. **Aguarde o indicador verde** aparecer ao lado do botão de microfone (isso significa que o sistema está ouvindo)

2. **Diga claramente uma das palavras-chave:**
   - "virtus" ou "virtude"
   - "doctor" ou "doutor"

3. **O sistema irá:**
   - Tocar um beep de confirmação
   - Mudar o placeholder do input para "Ouvindo… fale seu comando ou parecer clínico"
   - Iniciar a gravação automaticamente

4. **Fale seu comando ou parecer clínico:**
   - Exemplo: "virtus, ver paciente 3"
   - Exemplo: "doctor, atualizar parecer do paciente do leito 8"

5. **Para parar a gravação:**
   - Clique no botão de microfone (que estará pulsando em vermelho)

## Dicas para melhor detecção

- **Fale claramente** e em volume normal
- **Aguarde 1-2 segundos** após dizer a palavra-chave antes de continuar
- **Use um ambiente silencioso** quando possível
- **Verifique se o microfone está funcionando** (o indicador verde deve aparecer)

## Troubleshooting

### O indicador verde não aparece
- Verifique se o navegador tem permissão para usar o microfone
- Recarregue a página e permita o acesso ao microfone quando solicitado

### A palavra-chave não é detectada
- Tente pronunciar mais claramente
- Tente usar "doutor" em vez de "doctor" (ou vice-versa)
- Verifique no console do navegador (F12) se há mensagens de erro
- Tente falar um pouco mais alto

### O sistema não inicia a gravação após detectar
- Verifique se não há outra gravação em andamento
- Recarregue a página e tente novamente

## Logs de debug

Abra o console do navegador (F12) para ver logs detalhados:
- `[useWakeWord] Transcript recebido:` - mostra o que foi reconhecido
- `[useWakeWord] ✅ Wake word detectado:` - confirma quando detectou
- `[useWakeWord] Erro no reconhecimento de voz:` - mostra erros

