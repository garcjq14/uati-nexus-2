-- AlterTable
-- Adiciona a coluna customFields à tabela projects
ALTER TABLE "projects" ADD COLUMN "customFields" TEXT NOT NULL DEFAULT '{}';

