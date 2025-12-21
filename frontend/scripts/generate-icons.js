import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svgPath = join(__dirname, '../public/icon.svg');
const output192 = join(__dirname, '../public/icon-192.png');
const output512 = join(__dirname, '../public/icon-512.png');

async function generateIcons() {
  try {
    if (!existsSync(svgPath)) {
      console.error('Erro: icon.svg não encontrado em', svgPath);
      process.exit(1);
    }

    console.log('Gerando ícones PNG a partir do SVG...');
    console.log('SVG:', svgPath);
    
    await sharp(svgPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 163, g: 31, b: 52, alpha: 1 }
      })
      .png()
      .toFile(output192);
    
    console.log('✓ icon-192.png criado');
    
    await sharp(svgPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 163, g: 31, b: 52, alpha: 1 }
      })
      .png()
      .toFile(output512);
    
    console.log('✓ icon-512.png criado');
    console.log('✅ Ícones gerados com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar ícones:', error);
    process.exit(1);
  }
}

generateIcons();

