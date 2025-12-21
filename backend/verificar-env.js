// Script para diagnosticar problemas com .env
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosticando arquivo .env...\n');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env NÃO existe!');
  process.exit(1);
}

console.log('✅ Arquivo .env existe\n');

const content = fs.readFileSync(envPath, 'utf-8');
console.log('📄 Conteúdo do arquivo .env:');
console.log('─'.repeat(50));
console.log(content);
console.log('─'.repeat(50));
console.log('');

// Verificar encoding
const lines = content.split('\n');
console.log(`📊 Total de linhas: ${lines.length}\n`);

// Procurar DATABASE_URL
let found = false;
lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed.includes('DATABASE_URL')) {
    found = true;
    console.log(`✅ Linha ${index + 1} contém DATABASE_URL:`);
    console.log(`   "${line}"`);
    console.log(`   Tamanho: ${line.length} caracteres`);
    console.log(`   Começa com #? ${trimmed.startsWith('#')}`);
    console.log(`   Tem = ? ${trimmed.includes('=')}`);
    
    const match = trimmed.match(/DATABASE_URL\s*=\s*(.+)/);
    if (match) {
      const value = match[1].trim();
      console.log(`   Valor encontrado: ${value.substring(0, 50)}...`);
      console.log(`   Tamanho do valor: ${value.length} caracteres`);
    } else {
      console.log(`   ⚠️  Não conseguiu extrair o valor após =`);
    }
    console.log('');
  }
});

if (!found) {
  console.error('❌ DATABASE_URL NÃO encontrada no arquivo!');
  console.log('\nO arquivo deve conter uma linha como:');
  console.log('DATABASE_URL="postgresql://usuario:senha@host:port/defaultdb?sslmode=require&schema=public"');
}

// Tentar carregar com dotenv
console.log('\n🔧 Testando carregamento com dotenv...');
try {
  require('dotenv').config();
  if (process.env.DATABASE_URL) {
    const urlDisplay = process.env.DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    console.log('✅ dotenv carregou DATABASE_URL:');
    console.log(`   ${urlDisplay}`);
  } else {
    console.error('❌ dotenv NÃO conseguiu carregar DATABASE_URL');
  }
} catch (error) {
  console.error('❌ Erro ao carregar dotenv:', error.message);
}





