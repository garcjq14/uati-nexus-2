// Script Node.js para criar tabelas no CockroachDB
// Uso: node criar-tabelas-node.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Criando tabelas no CockroachDB...\n');

// Verificar se o arquivo .env existe
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env não encontrado!');
  console.log('\n📝 Por favor, crie um arquivo .env com a seguinte configuração:');
  console.log('\nDATABASE_URL="postgresql://usuario:senha@host:port/defaultdb?sslmode=require&schema=public"');
  console.log('JWT_SECRET="sua-chave-secreta-jwt"');
  console.log('\nConsulte o arquivo CRIAR_TABELAS_COCKROACHDB.md para mais detalhes.');
  process.exit(1);
}

// Carregar variáveis de ambiente usando dotenv
require('dotenv').config();

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no arquivo .env!');
  console.log('Verifique se o arquivo .env contém DATABASE_URL no formato correto.');
  process.exit(1);
}

// Mostrar parte da URL para debug (mascarando senha)
const urlForDisplay = process.env.DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
console.log('✅ DATABASE_URL encontrada:', urlForDisplay);
console.log('');

// Gerar Prisma Client
console.log('📦 Gerando Prisma Client...');
try {
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Prisma Client gerado com sucesso\n');
} catch (error) {
  console.error('❌ Erro ao gerar Prisma Client');
  process.exit(1);
}

// Aplicar migrações
console.log('🗄️  Aplicando migrações...');
try {
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('\n✅ Migrações aplicadas com sucesso!');
} catch (error) {
  console.log('\n⚠️  Erro ao aplicar migrações com migrate deploy');
  console.log('🔄 Tentando alternativa: prisma db push...\n');
  
  try {
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('\n✅ Tabelas criadas usando db push');
  } catch (error2) {
    console.error('\n❌ Erro ao aplicar migrações:');
    console.error('\nVerifique:');
    console.error('  1. Se a DATABASE_URL está correta no arquivo .env');
    console.error('  2. Se o banco de dados está acessível');
    console.error('  3. Se as credenciais estão corretas');
    process.exit(1);
  }
}

console.log('\n📋 Próximos passos:');
console.log('   1. Verificar tabelas: npx prisma studio');
console.log('   2. Popular dados iniciais: npm run prisma:seed');
console.log('   3. Iniciar servidor: npm run dev');





