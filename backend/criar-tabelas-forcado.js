// Script para criar tabelas forçando a DATABASE_URL
// Este script lê o .env e passa a variável diretamente para o Prisma

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🚀 Criando tabelas no CockroachDB...\n');

// Função para ler .env manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env não encontrado!');
    console.log('\n📝 Crie um arquivo .env com:');
    console.log('DATABASE_URL="postgresql://usuario:senha@host:port/defaultdb?sslmode=require&schema=public"');
    process.exit(1);
  }

  const env = {};
  const content = fs.readFileSync(envPath, 'utf-8');
  
  content.split('\n').forEach(line => {
    line = line.trim();
    // Ignorar comentários e linhas vazias
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      
      // Remover aspas
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  });
  
  return env;
}

const env = loadEnv();

if (!env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no arquivo .env!');
  console.log('\nVerifique se o arquivo .env contém:');
  console.log('DATABASE_URL="postgresql://..."');
  process.exit(1);
}

// Mostrar URL mascarada
const urlDisplay = env.DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
console.log('✅ DATABASE_URL encontrada:', urlDisplay);
console.log('');

// Criar objeto de ambiente com todas as variáveis
const processEnv = {
  ...process.env,
  DATABASE_URL: env.DATABASE_URL
};

// Adicionar outras variáveis do .env se existirem
Object.keys(env).forEach(key => {
  processEnv[key] = env[key];
});

console.log('📦 Gerando Prisma Client...');
try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: processEnv,
    cwd: __dirname
  });
  console.log('✅ Prisma Client gerado\n');
} catch (error) {
  console.error('❌ Erro ao gerar Prisma Client');
  process.exit(1);
}

console.log('🗄️  Aplicando migrações...');
try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: processEnv,
    cwd: __dirname
  });
  console.log('\n✅ Migrações aplicadas com sucesso!');
} catch (error) {
  console.log('\n⚠️  Erro com migrate deploy, tentando db push...\n');
  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: processEnv,
      cwd: __dirname
    });
    console.log('\n✅ Tabelas criadas usando db push');
  } catch (error2) {
    console.error('\n❌ Erro ao criar tabelas');
    console.error('\nVerifique:');
    console.error('  1. DATABASE_URL está correta');
    console.error('  2. Banco de dados está acessível');
    console.error('  3. Credenciais estão corretas');
    console.error('\nErro:', error2.message);
    process.exit(1);
  }
}

console.log('\n📋 Próximos passos:');
console.log('   1. Verificar: npx prisma studio');
console.log('   2. Popular dados: npm run prisma:seed');
console.log('   3. Iniciar servidor: npm run dev');





