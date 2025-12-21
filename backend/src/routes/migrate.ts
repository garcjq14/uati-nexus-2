import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Endpoint simples para adicionar coluna currentCourseId faltante
// GET https://seu-backend.onrender.com/api/migrate
router.get('/', async (_req, res: Response) => {
  try {
    console.log('🔄 Iniciando migração: adicionando coluna currentCourseId...');
    
    // Verificar se a coluna existe
    const result = await prisma.$queryRaw<Array<{column_name: string}>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'currentCourseId';
    `;
    
    if (result.length > 0) {
      console.log('✅ Coluna currentCourseId já existe');
      return res.json({ 
        message: 'Column currentCourseId already exists',
        status: 'ok'
      });
    }
    
    // Adicionar a coluna
    console.log('📝 Adicionando coluna currentCourseId...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN "currentCourseId" TEXT;`);
    console.log('✅ Coluna currentCourseId adicionada com sucesso!');
    
    // Verificar se a tabela courses existe, se não, criar
    try {
      await prisma.$queryRaw`SELECT 1 FROM "courses" LIMIT 1`;
      console.log('✅ Tabela courses já existe');
    } catch {
      console.log('📝 Criando tabela courses...');
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "courses" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "courses_userId_idx" ON "courses"("userId");`);
      console.log('✅ Tabela courses criada');
    }
    
    // Adicionar foreign key se não existir
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" 
        ADD CONSTRAINT "users_currentCourseId_fkey" 
        FOREIGN KEY ("currentCourseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `);
      console.log('✅ Foreign key adicionada');
    } catch (fkError: any) {
      if (fkError.message?.includes('already exists') || fkError.code === '42710') {
        console.log('✅ Foreign key já existe');
      } else {
        console.warn('⚠️  Aviso ao adicionar foreign key:', fkError.message);
      }
    }
    
    return res.json({ 
      message: 'Migration completed successfully',
      added: ['currentCourseId column', 'courses table (if needed)', 'foreign key (if needed)'],
      status: 'ok'
    });
  } catch (error: any) {
    console.error('❌ Erro na migração:', error);
    return res.status(500).json({ 
      error: 'Migration failed',
      message: error.message,
      code: error.code,
      hint: 'Make sure the users table exists and you have ALTER TABLE permissions'
    });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;

