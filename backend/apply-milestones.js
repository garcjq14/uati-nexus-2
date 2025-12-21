// Script Node.js para aplicar a migration de milestones
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migration de milestones...');
    
    // SQL para criar a tabela (SQLite usa INTEGER para boolean)
    // Dividindo em comandos separados para melhor compatibilidade
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "milestones" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "completed" INTEGER NOT NULL DEFAULT 0,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;

    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS "milestones_projectId_idx" ON "milestones"("projectId");
    `;

    // Execute the migration SQL
    await prisma.$executeRawUnsafe(createTableSQL);
    await prisma.$executeRawUnsafe(createIndexSQL);
    
    console.log('✅ Migration aplicada com sucesso!');
    console.log('🔄 Regenerando Prisma Client...');
    
    // Generate Prisma Client
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Tudo pronto! Você pode usar os marcos agora.');
    } catch (genError) {
      console.log('⚠️  Não foi possível regenerar o Prisma Client automaticamente.');
      console.log('ℹ️  Isso geralmente acontece quando o servidor backend está rodando.');
      console.log('📝 Por favor, pare o servidor backend e execute:');
      console.log('   npx prisma generate');
      console.log('✅ A tabela milestones foi criada com sucesso!');
    }
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate') || error.message.includes('UNIQUE constraint')) {
      console.log('ℹ️  A tabela milestones já existe. Regenerando Prisma Client...');
      const { execSync } = require('child_process');
      try {
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log('✅ Prisma Client regenerado!');
      } catch (genError) {
        console.error('⚠️  Erro ao regenerar Prisma Client:', genError.message);
      }
    } else {
      console.error('❌ Erro ao aplicar migration:', error.message);
      console.error('Detalhes:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
