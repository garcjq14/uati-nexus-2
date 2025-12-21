/**
 * Script para aplicar a migration de cursos manualmente
 * Execute: node backend/apply-migration.js
 * 
 * IMPORTANTE: Certifique-se de que o DATABASE_URL está configurado no .env
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('📦 Aplicando migration de cursos...');
    
    // Ler o arquivo de migration
    const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20250127000000_add_courses_support', 'migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Dividir em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command) {
        try {
          await prisma.$executeRawUnsafe(command);
          console.log(`✅ Comando ${i + 1}/${commands.length} executado`);
        } catch (error) {
          // Ignorar erros de "já existe" para tabelas/colunas
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('relation') && error.message.includes('already exists')) {
            console.log(`⚠️  Comando ${i + 1}/${commands.length} ignorado (já existe)`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration aplicada com sucesso!');
    
    // Marcar migration como aplicada
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
        VALUES (
          gen_random_uuid()::text,
          '',
          NOW(),
          '20250127000000_add_courses_support',
          NOW(),
          1
        )
        ON CONFLICT DO NOTHING;
      `);
      console.log('✅ Migration registrada no histórico');
    } catch (error) {
      console.log('⚠️  Não foi possível registrar a migration (pode já estar registrada)');
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log('🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });



