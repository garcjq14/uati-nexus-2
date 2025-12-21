import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to assign existing data to default courses
 * Run this after applying the migration: npx ts-node backend/migrate-existing-data.ts
 */
async function main() {
  console.log('Starting data migration...');

  try {
    // Get all users
    const users = await prisma.user.findMany();

    for (const user of users) {
      console.log(`Processing user: ${user.email}`);

      // Check if user already has courses
      const existingCourses = await prisma.course.findMany({
        where: { userId: user.id },
      });

      let defaultCourse;

      if (existingCourses.length === 0) {
        // Create default course
        defaultCourse = await prisma.course.create({
          data: {
            userId: user.id,
            title: 'Meu Curso',
            description: 'Curso padrão',
          },
        });
        console.log(`  Created default course: ${defaultCourse.id}`);
      } else {
        // Use first existing course
        defaultCourse = existingCourses[0];
        console.log(`  Using existing course: ${defaultCourse.id}`);
      }

      // Update user's currentCourseId if not set
      if (!user.currentCourseId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { currentCourseId: defaultCourse.id },
        });
        console.log(`  Set current course for user`);
      }

      // Assign all existing data to the default course
      const updates = [
        prisma.curriculum.updateMany({
          where: { userId: user.id, courseId: null } as any,
          data: { courseId: defaultCourse.id } as any,
        }),
        prisma.project.updateMany({
          where: { userId: user.id, courseId: null } as any,
          data: { courseId: defaultCourse.id } as any,
        }),
        prisma.flashcard.updateMany({
          where: { userId: user.id, courseId: null } as any,
          data: { courseId: defaultCourse.id } as any,
        }),
        prisma.resource.updateMany({
          where: { userId: user.id, courseId: null } as any,
          data: { courseId: defaultCourse.id } as any,
        }),
        prisma.note.updateMany({
          where: { userId: user.id, courseId: null } as any,
          data: { courseId: defaultCourse.id } as any,
        }),
        prisma.knowledgeNode.updateMany({
          where: { userId: user.id, courseId: null } as any,
          data: { courseId: defaultCourse.id } as any,
        }),
        prisma.studySession.updateMany({
          where: { userId: user.id, courseId: null } as any,
          data: { courseId: defaultCourse.id } as any,
        }),
        prisma.activity.updateMany({
          where: { userId: user.id, courseId: null } as any,
          data: { courseId: defaultCourse.id } as any,
        }),
        prisma.weeklySchedule.updateMany({
          where: { userId: user.id, courseId: null } as any,
          data: { courseId: defaultCourse.id } as any,
        }),
        prisma.manualCompetency.updateMany({
          where: { userId: user.id, courseId: null } as any,
          data: { courseId: defaultCourse.id } as any,
        }),
      ];

      const results = await Promise.all(updates);
      
      const totalUpdated = results.reduce((sum, result) => sum + result.count, 0);
      console.log(`  Updated ${totalUpdated} records for user`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

