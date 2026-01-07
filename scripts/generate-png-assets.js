/**
 * Script para gerar PNGs a partir dos SVGs do VIC
 * Requer: npm install sharp
 * Uso: node scripts/generate-png-assets.js
 */

const fs = require('fs');
const path = require('path');

// Se sharp não estiver disponível, apenas loga instruções
try {
  const sharp = require('sharp');
  
  const sizes = {
    'favicon': [16, 32, 48, 64],
    'icon': [64, 128, 256, 512],
    'logo': [100, 200, 400]
  };

  async function generatePNGs() {
    const publicDir = path.join(__dirname, '..', 'public');
    
    // Favicon
    const faviconSvg = path.join(publicDir, 'favicon-vic.svg');
    if (fs.existsSync(faviconSvg)) {
      for (const size of sizes.favicon) {
        await sharp(faviconSvg)
          .resize(size, size)
          .png()
          .toFile(path.join(publicDir, `favicon-vic-${size}.png`));
        console.log(`✓ Generated favicon-vic-${size}.png`);
      }
      // Favicon padrão (32x32)
      await sharp(faviconSvg)
        .resize(32, 32)
        .png()
        .toFile(path.join(publicDir, 'favicon-vic.png'));
      console.log(`✓ Generated favicon-vic.png (default)`);
    }

    // Icon
    const iconSvg = path.join(publicDir, 'icon-vic.svg');
    if (fs.existsSync(iconSvg)) {
      for (const size of sizes.icon) {
        await sharp(iconSvg)
          .resize(size, size)
          .png()
          .toFile(path.join(publicDir, `icon-vic-${size}.png`));
        console.log(`✓ Generated icon-vic-${size}.png`);
      }
    }

    // Logo
    const logoSvg = path.join(publicDir, 'logo-vic.svg');
    if (fs.existsSync(logoSvg)) {
      for (const size of sizes.logo) {
        const height = Math.round(size * 0.3); // Proporção 3:1
        await sharp(logoSvg)
          .resize(size, height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toFile(path.join(publicDir, `logo-vic-${size}.png`));
        console.log(`✓ Generated logo-vic-${size}.png`);
      }
    }

    console.log('\n✅ All PNG assets generated successfully!');
  }

  generatePNGs().catch(console.error);
} catch (e) {
  console.log(`
⚠️  Sharp não está instalado. Para gerar PNGs:

1. Instale sharp: npm install sharp --save-dev
2. Execute: node scripts/generate-png-assets.js

Ou use uma ferramenta online como:
- https://convertio.co/svg-png/
- https://cloudconvert.com/svg-to-png

Tamanhos necessários:
- favicon: 16x16, 32x32, 48x48, 64x64
- icon: 64x64, 128x128, 256x256, 512x512
- logo: 100px, 200px, 400px (largura)
  `);
}

