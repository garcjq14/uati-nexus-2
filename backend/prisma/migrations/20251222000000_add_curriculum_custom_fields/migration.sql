-- AlterTable
-- Adiciona suporte a campos personalizados no currículo
ALTER TABLE "curriculum" ADD COLUMN "customFields" TEXT NOT NULL DEFAULT '{}';

