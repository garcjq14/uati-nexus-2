// Script para aplicar a migration de milestones manualmente
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'prisma/migrations/20250125000000_add_project_milestones/migration.sql'),
      'utf8'
    );

    // Execute the migration SQL
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ Migration aplicada com sucesso!');
    console.log('Agora execute: npx prisma generate');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  A tabela milestones já existe. Tudo certo!');
    } else {
      console.error('❌ Erro ao aplicar migration:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();





