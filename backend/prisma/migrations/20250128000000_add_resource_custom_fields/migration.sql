-- AlterTable
-- Adiciona a coluna customFields à tabela resources
ALTER TABLE "resources" ADD COLUMN "customFields" TEXT NOT NULL DEFAULT '{}';

