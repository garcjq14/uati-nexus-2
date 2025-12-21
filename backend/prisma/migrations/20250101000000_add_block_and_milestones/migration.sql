-- AlterTable
-- Note: This migration assumes the curriculum table already exists from the init migration
ALTER TABLE "curriculum" ADD COLUMN "block" TEXT;
ALTER TABLE "curriculum" ADD COLUMN "milestones" TEXT NOT NULL DEFAULT '[]';



