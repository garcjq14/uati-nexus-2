-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "currentCourseId" TEXT;

-- AlterTable
ALTER TABLE "curriculum" ADD COLUMN "courseId" TEXT;

-- AlterTable
ALTER TABLE "notes" ADD COLUMN "courseId" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "courseId" TEXT;

-- AlterTable
ALTER TABLE "flashcards" ADD COLUMN "courseId" TEXT;

-- AlterTable
ALTER TABLE "resources" ADD COLUMN "courseId" TEXT;

-- AlterTable
ALTER TABLE "knowledge_nodes" ADD COLUMN "courseId" TEXT;

-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN "courseId" TEXT;

-- AlterTable
ALTER TABLE "activities" ADD COLUMN "courseId" TEXT;

-- AlterTable
ALTER TABLE "weekly_schedules" ADD COLUMN "courseId" TEXT;

-- AlterTable
ALTER TABLE "manual_competencies" ADD COLUMN "courseId" TEXT;

-- CreateIndex
CREATE INDEX "courses_userId_idx" ON "courses"("userId");

-- CreateIndex
CREATE INDEX "curriculum_courseId_idx" ON "curriculum"("courseId");

-- CreateIndex
CREATE INDEX "notes_courseId_idx" ON "notes"("courseId");

-- CreateIndex
CREATE INDEX "projects_courseId_idx" ON "projects"("courseId");

-- CreateIndex
CREATE INDEX "flashcards_courseId_idx" ON "flashcards"("courseId");

-- CreateIndex
CREATE INDEX "resources_courseId_idx" ON "resources"("courseId");

-- CreateIndex
CREATE INDEX "knowledge_nodes_courseId_idx" ON "knowledge_nodes"("courseId");

-- CreateIndex
CREATE INDEX "study_sessions_courseId_idx" ON "study_sessions"("courseId");

-- CreateIndex
CREATE INDEX "activities_courseId_idx" ON "activities"("courseId");

-- CreateIndex
CREATE INDEX "weekly_schedules_courseId_idx" ON "weekly_schedules"("courseId");

-- CreateIndex
CREATE INDEX "manual_competencies_courseId_idx" ON "manual_competencies"("courseId");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_currentCourseId_fkey" FOREIGN KEY ("currentCourseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum" ADD CONSTRAINT "curriculum_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_nodes" ADD CONSTRAINT "knowledge_nodes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_schedules" ADD CONSTRAINT "weekly_schedules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_competencies" ADD CONSTRAINT "manual_competencies_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

