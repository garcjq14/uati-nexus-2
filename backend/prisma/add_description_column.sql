-- Script para adicionar as colunas description e estimatedChapters à tabela resources
-- Execute este script no banco de dados SQLite se as colunas não existirem

-- Adiciona a coluna description (pode falhar se já existir, mas isso é OK)
ALTER TABLE "resources" ADD COLUMN "description" TEXT;

-- Adiciona a coluna estimatedChapters (pode falhar se já existir, mas isso é OK)
ALTER TABLE "resources" ADD COLUMN "estimatedChapters" INTEGER;





