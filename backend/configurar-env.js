// Script para configurar o arquivo .env
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function configurar() {
  console.log('🔧 Configuração do arquivo .env\n');
  console.log('Você precisa fornecer as informações do seu CockroachDB.\n');

  const databaseUrl = await question('Cole a DATABASE_URL completa do CockroachDB: ');
  
  if (!databaseUrl || !databaseUrl.trim()) {
    console.error('\n❌ DATABASE_URL não pode estar vazia!');
    rl.close();
    process.exit(1);
  }

  let jwtSecret = await question('\nJWT_SECRET (pressione Enter para gerar automaticamente): ');
  
  if (!jwtSecret || !jwtSecret.trim()) {
    // Gerar JWT_SECRET automaticamente
    const crypto = require('crypto');
    jwtSecret = crypto.randomBytes(64).toString('hex');
    console.log(`\n✅ JWT_SECRET gerado automaticamente: ${jwtSecret.substring(0, 20)}...`);
  }

  const port = await question('\nPORT (pressione Enter para usar 3001): ') || '3001';
  const nodeEnv = await question('\nNODE_ENV (pressione Enter para usar development): ') || 'development';

  // Garantir que DATABASE_URL tenha &schema=public se não tiver
  let finalDatabaseUrl = databaseUrl.trim();
  if (!finalDatabaseUrl.includes('&schema=public') && !finalDatabaseUrl.includes('?schema=public')) {
    if (finalDatabaseUrl.includes('?')) {
      finalDatabaseUrl += '&schema=public';
    } else {
      finalDatabaseUrl += '?schema=public';
    }
  }

  // Criar conteúdo do .env
  const envContent = `DATABASE_URL="${finalDatabaseUrl}"
JWT_SECRET="${jwtSecret.trim()}"
PORT=${port}
NODE_ENV=${nodeEnv}
`;

  const envPath = path.join(__dirname, '.env');
  
  // Fazer backup se o arquivo já existir
  if (fs.existsSync(envPath)) {
    const backupPath = path.join(__dirname, '.env.backup');
    fs.copyFileSync(envPath, backupPath);
    console.log(`\n📦 Backup criado: .env.backup`);
  }

  // Escrever arquivo
  fs.writeFileSync(envPath, envContent, 'utf-8');
  
  console.log('\n✅ Arquivo .env criado com sucesso!');
  console.log('\n📄 Conteúdo:');
  console.log('─'.repeat(50));
  console.log(envContent);
  console.log('─'.repeat(50));
  
  // Mascarar URL para exibição
  const urlDisplay = finalDatabaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  console.log(`\n🔗 DATABASE_URL: ${urlDisplay}`);
  console.log(`🔑 JWT_SECRET: ${jwtSecret.substring(0, 20)}...`);
  console.log(`🚪 PORT: ${port}`);
  console.log(`🌍 NODE_ENV: ${nodeEnv}`);
  
  rl.close();
  
  console.log('\n📋 Próximo passo:');
  console.log('   Execute: node criar-tabelas-forcado.js');
}

configurar().catch(error => {
  console.error('❌ Erro:', error);
  rl.close();
  process.exit(1);
});





