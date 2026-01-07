# Assets do VIC

## Arquivos SVG Criados

- `public/logo-vic.svg` - Logo principal (texto "VIC")
- `public/logo-vic-white.svg` - Logo para fundos escuros
- `public/favicon-vic.svg` - Favicon SVG (32x32)
- `public/icon-vic.svg` - Ícone para app (64x64)

## Gerar PNGs

Para gerar versões PNG dos assets:

1. Instale sharp:
```bash
npm install sharp --save-dev
```

2. Execute o script:
```bash
node scripts/generate-png-assets.js
```

Isso gerará:
- `favicon-vic.png` (32x32) - Favicon padrão
- `favicon-vic-16.png`, `favicon-vic-32.png`, `favicon-vic-48.png`, `favicon-vic-64.png`
- `icon-vic-64.png`, `icon-vic-128.png`, `icon-vic-256.png`, `icon-vic-512.png`
- `logo-vic-100.png`, `logo-vic-200.png`, `logo-vic-400.png`

## Alternativa: Conversão Online

Se não quiser instalar sharp, use:
- https://convertio.co/svg-png/
- https://cloudconvert.com/svg-to-png/

## Personalidade do VIC

- **Calmo** - Sem alarmismo
- **Objetivo** - Direto ao ponto
- **Confiável** - Sempre presente
- **Avisa, não manda** - Informa, não decide

## Tom de Voz

✅ "Risco crescente detectado."
✅ "Mudança de padrão nos últimos 12 minutos."
✅ "Sugiro revisão do leito 4."

❌ "Recomendo fortemente..."
❌ "Você deveria..."
❌ "Isso é crítico!"
❌ "Atenção!!!"

