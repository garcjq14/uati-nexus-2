import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// Endpoint para inicializar o banco de dados (seed)
// Pode ser chamado via HTTP: GET https://seu-backend.onrender.com/api/init
router.get('/', async (_req, res: Response) => {
  try {
    console.log('🔄 Inicializando banco de dados...');
    console.log('📁 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado' : 'NÃO CONFIGURADO');

    // Primeiro, verificar conexão com banco
    try {
      await prisma.$connect();
      console.log('✅ Conexão com banco estabelecida');
    } catch (connectError: any) {
      console.error('❌ Erro ao conectar ao banco:', connectError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        message: connectError.message,
        hint: 'Verify DATABASE_URL environment variable is correctly set in Render'
      });
    }

    // Verificar se as tabelas existem
    try {
      await prisma.$queryRaw`SELECT 1 FROM "users" LIMIT 1`;
      console.log('✅ Tabelas existem');
    } catch (tableError: any) {
      const isTableNotFound = 
        tableError.message?.includes('does not exist') || 
        tableError.code === '42P01' ||
        tableError.message?.includes('relation') ||
        tableError.message?.includes('no such table');
      
      if (isTableNotFound) {
        console.error('❌ Tabelas não existem.');
        return res.status(500).json({ 
          error: 'Database tables do not exist',
          message: 'Please call /api/setup-db first to create the tables',
          solution: 'Access your-backend-url.onrender.com/api/setup-db in your browser, then call /api/init again',
          hint: 'The buildCommand should include: npx prisma db push. If it failed, use /api/setup-db as a fallback.'
        });
      }
      // Se não for erro de tabela não existir, pode ser outro problema
      console.error('❌ Erro ao verificar tabelas:', tableError);
      return res.status(500).json({ 
        error: 'Error checking database tables',
        message: tableError.message,
        code: tableError.code
      });
    }

    // Verificar e adicionar coluna currentCourseId se não existir (antes de usar Prisma Client)
    try {
      const columnCheck = await prisma.$queryRaw<Array<{column_name: string}>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'currentCourseId';
      `;
      
      if (columnCheck.length === 0) {
        console.log('⚠️  Coluna currentCourseId não existe - adicionando...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN "currentCourseId" TEXT;`);
        console.log('✅ Coluna currentCourseId adicionada');
        
        // Criar tabela courses se não existir
        try {
          await prisma.$queryRaw`SELECT 1 FROM "courses" LIMIT 1`;
        } catch {
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
        }
      }
    } catch (migrateError: any) {
      console.warn('⚠️  Aviso ao verificar/adicionar currentCourseId:', migrateError.message);
      // Continuar mesmo se falhar - pode ser que a coluna já exista
    }

    // Verificar se já existe algum usuário
    let existingUser;
    try {
      existingUser = await prisma.user.findFirst();
    } catch (dbError: any) {
      console.error('❌ Erro ao buscar usuários:', dbError);
      return res.status(500).json({ 
        error: 'Error querying database',
        message: dbError.message,
        code: dbError.code
      });
    }
    if (existingUser) {
      console.log('ℹ️  Banco de dados já possui usuários. Pulando seed.');
      return res.json({ 
        message: 'Database already initialized',
        usersCount: await prisma.user.count()
      });
    }

    // Criar usuário de teste
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'alexandre@uati.com' },
      update: {},
      create: {
        email: 'alexandre@uati.com',
        name: 'Alexandre N.',
        password: hashedPassword,
        role: 'STUDENT',
        avatar: 'https://ui-avatars.com/api/?name=Alexandre+N&background=A31F34&color=fff',
      },
    });

    const anaPassword = await bcrypt.hash('AnaGarcia@UATI2024!Secure', 10);
    await prisma.user.upsert({
      where: { email: 'anegarcia@uati.com' },
      update: {
        password: anaPassword,
      },
      create: {
        email: 'anegarcia@uati.com',
        name: 'Ana Garcia',
        password: anaPassword,
        role: 'STUDENT',
        avatar: 'https://ui-avatars.com/api/?name=Ana+Garcia&background=C11E3D&color=fff',
      },
    });

    // Criar curriculum básico
    const csCurriculum = [
      { code: 'CS101', title: 'Fundamentos da Computação', order: 1, progress: 100, status: 'completed', syllabus: 'Introdução aos conceitos fundamentais de computação, arquitetura de computadores, sistemas operacionais e redes básicas.' },
      { code: 'CS102', title: 'Algoritmos e Estruturas', order: 2, progress: 65, status: 'active', syllabus: 'Estruturas de dados, algoritmos de ordenação e busca, complexidade algorítmica, árvores e grafos.' },
      { code: 'CS201', title: 'Arquitetura de Sistemas', order: 3, progress: 0, status: 'locked', syllabus: 'Arquitetura de software, padrões de design, microserviços, APIs RESTful e GraphQL.' },
    ];

    for (const module of csCurriculum) {
      await prisma.curriculum.create({
        data: {
          userId: user.id,
          code: module.code,
          title: module.title,
          syllabus: module.syllabus,
          order: module.order,
          progress: module.progress,
          status: module.status,
        } as any,
      });
    }

    console.log('✅ Banco de dados inicializado com sucesso!');
    
    return res.json({ 
      message: 'Database initialized successfully',
      users: [
        { email: 'alexandre@uati.com', password: 'password123' },
        { email: 'anegarcia@uati.com', password: 'AnaGarcia@UATI2024!Secure' }
      ],
      databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'NÃO CONFIGURADO'
    });
  } catch (error: any) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Mensagem do erro:', error.message);
    return res.status(500).json({ 
      error: 'Failed to initialize database',
      message: error.message,
      code: error.code,
      hint: 'Make sure /api/setup-db was called successfully first',
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;

