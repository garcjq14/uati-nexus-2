-- AlterTable
-- Adiciona a coluna description e estimatedChapters à tabela resources
ALTER TABLE "resources" ADD COLUMN "description" TEXT;
ALTER TABLE "resources" ADD COLUMN "estimatedChapters" INTEGER;
