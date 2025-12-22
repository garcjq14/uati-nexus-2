import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Endpoint para criar as tabelas do banco de dados
// Pode ser chamado via HTTP: GET https://seu-backend.onrender.com/api/setup-db
router.get('/', async (_req, res: Response) => {
  try {
    console.log('🔄 Verificando conexão com banco de dados...');
    console.log('📁 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado' : 'NÃO CONFIGURADO');
    
    // Primeiro, verificar se consegue conectar ao banco
    try {
      await prisma.$connect();
      console.log('✅ Conexão com banco estabelecida');
    } catch (connectError: any) {
      console.error('❌ Erro ao conectar ao banco:', connectError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        message: connectError.message,
        hint: 'Verify DATABASE_URL environment variable'
      });
    }

    // Verificar se as tabelas já existem
    let tablesExist = false;
    try {
      await prisma.$queryRaw`SELECT 1 FROM "users" LIMIT 1`;
      tablesExist = true;
      console.log('✅ Tabela users existe - verificando e adicionando colunas faltantes...');
    } catch (error: any) {
      console.log('ℹ️  Tabela users não existe ou erro ao verificar:', error.message);
      // Verificar se é erro de tabela não existir ou outro erro
      const isTableNotFound = 
        error.message?.includes('does not exist') || 
        error.code === '42P01' ||
        error.message?.includes('relation') ||
        error.message?.includes('no such table');
      
      if (!isTableNotFound) {
        // Se não for erro de tabela não existir, pode ser problema de conexão/permissão
        console.error('❌ Erro inesperado ao verificar tabela:', error);
        return res.status(500).json({ 
          error: 'Error checking database',
          message: error.message,
          code: error.code
        });
      }
      console.log('📝 Tabela users não existe - criando todas as tabelas...');
    }

    // Criar tabela users (com todas as colunas do schema atual)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'STUDENT',
        "avatar" TEXT,
        "portfolio" TEXT,
        "linkedin" TEXT,
        "github" TEXT,
        "twitter" TEXT,
        "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
        "currentCourseId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );
    `);

    // SEMPRE adicionar coluna currentCourseId se não existir (mesmo se tabela já existir)
    console.log('🔍 Verificando se coluna currentCourseId existe em users...');
    try {
      // Verificar se a coluna existe usando query direta
      const result = await prisma.$queryRaw<Array<{column_name: string}>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'currentCourseId';
      `;
      
      if (result.length === 0) {
        console.log('📝 Coluna currentCourseId NÃO existe - adicionando...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN "currentCourseId" TEXT;`);
        console.log('✅ Coluna currentCourseId adicionada com sucesso!');
      } else {
        console.log('✅ Coluna currentCourseId já existe em users');
      }
    } catch (alterError: any) {
      // Se der erro de coluna já existe, tudo bem
      if (alterError.message?.includes('already exists') || 
          alterError.message?.includes('duplicate column') ||
          alterError.code === '42701') {
        console.log('✅ Coluna currentCourseId já existe (erro esperado)');
      } else {
        // Se for outro erro, tentar adicionar mesmo assim
        console.error('⚠️  Erro ao verificar/adicionar currentCourseId:', alterError.message);
        console.log('🔄 Tentando adicionar diretamente...');
        try {
          await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN "currentCourseId" TEXT;`);
          console.log('✅ Coluna currentCourseId adicionada (tentativa direta)');
        } catch (directError: any) {
          if (directError.message?.includes('already exists') || 
              directError.message?.includes('duplicate column') ||
              directError.code === '42701') {
            console.log('✅ Coluna currentCourseId já existe');
          } else {
            console.error('❌ Erro ao adicionar currentCourseId:', directError.message);
            throw directError; // Relançar se for erro diferente
          }
        }
      }
    }

    // Criar tabelas de domínio (domains, domain_fields e domain_plugins)
    console.log('📝 Criando tabela domains...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "domains" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "icon" TEXT,
        "color" TEXT,
        "config" TEXT NOT NULL DEFAULT '{}',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );
    `);

    console.log('📝 Criando tabela domain_fields...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "domain_fields" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "domainId" TEXT NOT NULL,
        "entity" TEXT NOT NULL,
        "fieldName" TEXT NOT NULL,
        "fieldType" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "required" BOOLEAN NOT NULL DEFAULT false,
        "options" TEXT,
        "defaultValue" TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "domain_fields_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('📝 Criando tabela domain_plugins...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "domain_plugins" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "domainId" TEXT NOT NULL,
        "pluginKey" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "config" TEXT NOT NULL DEFAULT '{}',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "domain_plugins_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Criar tabela courses (depois de users/domains, pois courses referencia os dois)
    if (!tablesExist) {
      console.log('📝 Criando tabela courses...');
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "courses" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "domainId" TEXT,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "courses_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
      `);
    } else {
      console.log('📝 Verificando se tabela courses existe...');
      try {
        await prisma.$queryRaw`SELECT 1 FROM "courses" LIMIT 1`;
        console.log('✅ Tabela courses já existe');
      } catch {
        console.log('📝 Criando tabela courses...');
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "courses" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "domainId" TEXT,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "courses_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE SET NULL ON UPDATE CASCADE
          );
        `);
      }
    }

    // Garantir coluna domainId em courses
    try {
      // Primeiro, verificar se a coluna existe
      const columnCheck = await prisma.$queryRaw<Array<{column_name: string}>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'domainId';
      `;
      
      if (columnCheck.length === 0) {
        // Adicionar coluna primeiro
        await prisma.$executeRawUnsafe(`ALTER TABLE "courses" ADD COLUMN "domainId" TEXT;`);
        console.log('✅ Coluna domainId adicionada em courses');
        
        // Depois, verificar se a constraint já existe antes de criar
        const constraintCheck = await prisma.$queryRaw<Array<{constraint_name: string}>>`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_schema = 'public' 
            AND table_name = 'courses' 
            AND constraint_name = 'courses_domainId_fkey';
        `;
        
        if (constraintCheck.length === 0) {
          // Verificar se a tabela domains existe antes de criar a constraint
          const domainsCheck = await prisma.$queryRaw<Array<{table_name: string}>>`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = 'domains';
          `;
          
          if (domainsCheck.length > 0) {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "courses"
              ADD CONSTRAINT "courses_domainId_fkey"
              FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            `);
            console.log('✅ Constraint domainId_fkey adicionada em courses');
          } else {
            console.warn('⚠️  Tabela domains não existe ainda, pulando constraint domainId_fkey');
          }
        }
      } else {
        console.log('✅ Coluna domainId já existe em courses');
      }
    } catch (err: any) {
      if (!err.message?.includes('already exists') && !err.message?.includes('duplicate') && !err.message?.includes('does not exist')) {
        console.warn('⚠️  Aviso ao adicionar domainId em courses:', err.message);
      }
    }

    // Adicionar foreign key para currentCourseId após criar a tabela courses
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'users_currentCourseId_fkey'
          ) THEN
            ALTER TABLE "users" 
            ADD CONSTRAINT "users_currentCourseId_fkey" 
            FOREIGN KEY ("currentCourseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Foreign key currentCourseId adicionada');
    } catch (fkError: any) {
      // Tentar método alternativo
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "users" 
          ADD CONSTRAINT "users_currentCourseId_fkey" 
          FOREIGN KEY ("currentCourseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        `);
        console.log('✅ Foreign key currentCourseId adicionada (método alternativo)');
      } catch (altFkError: any) {
        if (!altFkError.message?.includes('already exists') && !altFkError.message?.includes('duplicate')) {
          console.warn('⚠️  Aviso ao adicionar foreign key currentCourseId:', altFkError.message);
        }
      }
    }

    // Criar índice para courses
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "courses_userId_idx" ON "courses"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "courses_domainId_idx" ON "courses"("domainId");`);

    // Criar tabela projects (precisa vir antes de curriculum por causa da foreign key)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "courseId" TEXT,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "requirements" TEXT,
        "technologies" TEXT NOT NULL DEFAULT '[]',
        "deadline" TIMESTAMP(3),
        "repository" TEXT,
        "type" TEXT NOT NULL DEFAULT 'Dev',
        "status" TEXT NOT NULL DEFAULT 'em_progresso',
        "progress" INTEGER NOT NULL DEFAULT 0,
        "priority" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "projects_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Adicionar courseId em projects se não existir
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'courseId'
          ) THEN
            ALTER TABLE "projects" ADD COLUMN "courseId" TEXT;
            ALTER TABLE "projects" 
            ADD CONSTRAINT "projects_courseId_fkey" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Coluna courseId em projects verificada/adicionada');
    } catch (err: any) {
      console.warn('⚠️  Aviso ao adicionar courseId em projects:', err.message);
    }

    // Criar tabela notes (precisa vir antes de topics por causa da foreign key)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "notes" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "courseId" TEXT,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "connections" TEXT NOT NULL DEFAULT '[]',
        "tags" TEXT NOT NULL DEFAULT '[]',
        "references" TEXT NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "notes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Adicionar courseId em notes se não existir
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notes' AND column_name = 'courseId'
          ) THEN
            ALTER TABLE "notes" ADD COLUMN "courseId" TEXT;
            ALTER TABLE "notes" 
            ADD CONSTRAINT "notes_courseId_fkey" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Coluna courseId em notes verificada/adicionada');
    } catch (err: any) {
      console.warn('⚠️  Aviso ao adicionar courseId em notes:', err.message);
    }

    // Criar tabela curriculum
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "curriculum" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "courseId" TEXT,
        "code" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "syllabus" TEXT,
        "order" INTEGER NOT NULL,
        "progress" INTEGER NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'locked',
        "block" TEXT,
        "milestones" TEXT NOT NULL DEFAULT '[]',
        "customFields" TEXT NOT NULL DEFAULT '{}',
        "powId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "curriculum_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "curriculum_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "curriculum_powId_fkey" FOREIGN KEY ("powId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    // Adicionar courseId em curriculum se não existir
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'curriculum' AND column_name = 'courseId'
          ) THEN
            ALTER TABLE "curriculum" ADD COLUMN "courseId" TEXT;
            ALTER TABLE "curriculum" 
            ADD CONSTRAINT "curriculum_courseId_fkey" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Coluna courseId em curriculum verificada/adicionada');
    } catch (err: any) {
      console.warn('⚠️  Aviso ao adicionar courseId em curriculum:', err.message);
    }

    // Adicionar customFields em curriculum se não existir
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'curriculum' AND column_name = 'customFields'
          ) THEN
            ALTER TABLE "curriculum" ADD COLUMN "customFields" TEXT NOT NULL DEFAULT '{}';
          END IF;
        END $$;
      `);
      console.log('✅ Coluna customFields em curriculum verificada/adicionada');
    } catch (err: any) {
      console.warn('⚠️  Aviso ao adicionar customFields em curriculum:', err.message);
    }

    // Criar tabela topics
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "topics" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "curriculumId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "content" TEXT,
        "order" INTEGER NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'not_read',
        "noteId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "topics_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "topics_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    // Criar tabela tasks
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'todo',
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Criar tabela milestones
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "milestones" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Criar tabela flashcards
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "flashcards" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "courseId" TEXT,
        "deck" TEXT NOT NULL,
        "front" TEXT NOT NULL,
        "back" TEXT NOT NULL,
        "lastReview" TIMESTAMP(3),
        "nextReview" TIMESTAMP(3),
        "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
        "interval" INTEGER NOT NULL DEFAULT 1,
        "repetitions" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "flashcards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "flashcards_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Adicionar courseId em flashcards se não existir
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'flashcards' AND column_name = 'courseId'
          ) THEN
            ALTER TABLE "flashcards" ADD COLUMN "courseId" TEXT;
            ALTER TABLE "flashcards" 
            ADD CONSTRAINT "flashcards_courseId_fkey" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Coluna courseId em flashcards verificada/adicionada');
    } catch (err: any) {
      console.warn('⚠️  Aviso ao adicionar courseId em flashcards:', err.message);
    }

    // Criar tabela resources
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "resources" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "courseId" TEXT,
        "topicId" TEXT,
        "title" TEXT NOT NULL,
        "author" TEXT,
        "format" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'a_fazer',
        "url" TEXT,
        "description" TEXT,
        "notes" TEXT,
        "progress" INTEGER NOT NULL DEFAULT 0,
        "tags" TEXT NOT NULL DEFAULT '[]',
        "estimatedChapters" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "resources_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "resources_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "resources_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    // Adicionar courseId em resources se não existir
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'resources' AND column_name = 'courseId'
          ) THEN
            ALTER TABLE "resources" ADD COLUMN "courseId" TEXT;
            ALTER TABLE "resources" 
            ADD CONSTRAINT "resources_courseId_fkey" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Coluna courseId em resources verificada/adicionada');
    } catch (err: any) {
      console.warn('⚠️  Aviso ao adicionar courseId em resources:', err.message);
    }

    // Criar tabela resource_annotations
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "resource_annotations" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "resourceId" TEXT NOT NULL,
        "chapter" TEXT,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "resource_annotations_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Criar tabela diary_entries
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "diary_entries" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "tags" TEXT NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "diary_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Criar tabela knowledge_nodes
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "knowledge_nodes" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "courseId" TEXT,
        "label" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'concept',
        "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "knowledge_nodes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "knowledge_nodes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Adicionar courseId em knowledge_nodes se não existir
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'knowledge_nodes' AND column_name = 'courseId'
          ) THEN
            ALTER TABLE "knowledge_nodes" ADD COLUMN "courseId" TEXT;
            ALTER TABLE "knowledge_nodes" 
            ADD CONSTRAINT "knowledge_nodes_courseId_fkey" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Coluna courseId em knowledge_nodes verificada/adicionada');
    } catch (err: any) {
      console.warn('⚠️  Aviso ao adicionar courseId em knowledge_nodes:', err.message);
    }

    // Criar tabela node_connections
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "node_connections" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "fromNodeId" TEXT NOT NULL,
        "toNodeId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "node_connections_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "node_connections_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Criar tabela study_sessions
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "study_sessions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "courseId" TEXT,
        "duration" INTEGER NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'pomodoro',
        "audio" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "study_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "study_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Adicionar courseId em study_sessions se não existir
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'study_sessions' AND column_name = 'courseId'
          ) THEN
            ALTER TABLE "study_sessions" ADD COLUMN "courseId" TEXT;
            ALTER TABLE "study_sessions" 
            ADD CONSTRAINT "study_sessions_courseId_fkey" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Coluna courseId em study_sessions verificada/adicionada');
    } catch (err: any) {
      console.warn('⚠️  Aviso ao adicionar courseId em study_sessions:', err.message);
    }

    // Criar tabela activities
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "activities" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "courseId" TEXT,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "activities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Adicionar courseId em activities se não existir
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'activities' AND column_name = 'courseId'
          ) THEN
            ALTER TABLE "activities" ADD COLUMN "courseId" TEXT;
            ALTER TABLE "activities" 
            ADD CONSTRAINT "activities_courseId_fkey" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Coluna courseId em activities verificada/adicionada');
    } catch (err: any) {
      console.warn('⚠️  Aviso ao adicionar courseId em activities:', err.message);
    }

    // Criar tabela notifications
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "link" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Criar tabela weekly_schedules
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "weekly_schedules" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "courseId" TEXT,
        "title" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "day" TEXT NOT NULL,
        "time" TEXT,
        "description" TEXT,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "weekStart" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "weekly_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "weekly_schedules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Adicionar courseId em weekly_schedules se não existir
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'weekly_schedules' AND column_name = 'courseId'
          ) THEN
            ALTER TABLE "weekly_schedules" ADD COLUMN "courseId" TEXT;
            ALTER TABLE "weekly_schedules" 
            ADD CONSTRAINT "weekly_schedules_courseId_fkey" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Coluna courseId em weekly_schedules verificada/adicionada');
    } catch (err: any) {
      console.warn('⚠️  Aviso ao adicionar courseId em weekly_schedules:', err.message);
    }

    // Criar tabela manual_competencies
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "manual_competencies" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "courseId" TEXT,
        "name" TEXT NOT NULL,
        "strength" INTEGER NOT NULL DEFAULT 0,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "manual_competencies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "manual_competencies_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Adicionar courseId em manual_competencies se não existir
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'manual_competencies' AND column_name = 'courseId'
          ) THEN
            ALTER TABLE "manual_competencies" ADD COLUMN "courseId" TEXT;
            ALTER TABLE "manual_competencies" 
            ADD CONSTRAINT "manual_competencies_courseId_fkey" 
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Coluna courseId em manual_competencies verificada/adicionada');
    } catch (err: any) {
      console.warn('⚠️  Aviso ao adicionar courseId em manual_competencies:', err.message);
    }

    // Criar índices
    console.log('📊 Criando índices...');
    
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "domains_code_idx" ON "domains"("code");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "domain_fields_domainId_entity_idx" ON "domain_fields"("domainId", "entity");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "domain_plugins_domainId_pluginKey_idx" ON "domain_plugins"("domainId", "pluginKey");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "curriculum_userId_idx" ON "curriculum"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "curriculum_courseId_idx" ON "curriculum"("courseId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "topics_curriculumId_idx" ON "topics"("curriculumId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "notes_userId_idx" ON "notes"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "notes_courseId_idx" ON "notes"("courseId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "projects_userId_idx" ON "projects"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "projects_courseId_idx" ON "projects"("courseId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "tasks_projectId_idx" ON "tasks"("projectId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "milestones_projectId_idx" ON "milestones"("projectId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "flashcards_userId_idx" ON "flashcards"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "flashcards_courseId_idx" ON "flashcards"("courseId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "flashcards_deck_idx" ON "flashcards"("deck");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "flashcards_nextReview_idx" ON "flashcards"("nextReview");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "resources_userId_idx" ON "resources"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "resources_courseId_idx" ON "resources"("courseId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "resources_format_idx" ON "resources"("format");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "resources_topicId_idx" ON "resources"("topicId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "resource_annotations_resourceId_idx" ON "resource_annotations"("resourceId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "diary_entries_projectId_idx" ON "diary_entries"("projectId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "diary_entries_createdAt_idx" ON "diary_entries"("createdAt");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "knowledge_nodes_userId_idx" ON "knowledge_nodes"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "knowledge_nodes_courseId_idx" ON "knowledge_nodes"("courseId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "node_connections_fromNodeId_idx" ON "node_connections"("fromNodeId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "node_connections_toNodeId_idx" ON "node_connections"("toNodeId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "study_sessions_userId_idx" ON "study_sessions"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "study_sessions_courseId_idx" ON "study_sessions"("courseId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "activities_userId_idx" ON "activities"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "activities_courseId_idx" ON "activities"("courseId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "activities_createdAt_idx" ON "activities"("createdAt");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "activities_type_idx" ON "activities"("type");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "weekly_schedules_userId_idx" ON "weekly_schedules"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "weekly_schedules_courseId_idx" ON "weekly_schedules"("courseId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "weekly_schedules_weekStart_idx" ON "weekly_schedules"("weekStart");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "weekly_schedules_day_idx" ON "weekly_schedules"("day");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "manual_competencies_userId_idx" ON "manual_competencies"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "manual_competencies_courseId_idx" ON "manual_competencies"("courseId");`);

    console.log('✅ Tabelas criadas com sucesso!');
    
    // Verificar se as tabelas foram criadas corretamente
    try {
      await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "users"`;
      console.log('✅ Verificação: Tabela users está acessível');
    } catch (verifyError: any) {
      console.error('⚠️  Aviso: Erro ao verificar tabela após criação:', verifyError.message);
    }
    
    return res.json({ 
      message: 'Database tables created successfully',
      tables: [
        'users', 'domains', 'domain_fields', 'domain_plugins', 'courses',
        'projects', 'notes', 'curriculum', 'topics', 
        'tasks', 'milestones', 'flashcards', 'resources', 
        'resource_annotations', 'diary_entries', 'knowledge_nodes',
        'node_connections', 'study_sessions', 'activities',
        'notifications', 'weekly_schedules', 'manual_competencies'
      ],
      nextStep: 'Call /api/init to create initial users',
      databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'NÃO CONFIGURADO'
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar tabelas:', error);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Mensagem do erro:', error.message);
    return res.status(500).json({ 
      error: 'Failed to create database tables',
      message: error.message,
      code: error.code,
      hint: 'Verify DATABASE_URL is correct and the database is accessible',
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;
