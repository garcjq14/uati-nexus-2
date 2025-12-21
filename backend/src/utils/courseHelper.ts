import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Gets the current course ID for a user, creating one if it doesn't exist
 */
export async function getCurrentCourseId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { courses: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // If user has a current course, return it
  if (user.currentCourseId) {
    return user.currentCourseId;
  }

  // If user has courses but no current, set first as current
  if (user.courses.length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { currentCourseId: user.courses[0].id },
    });
    return user.courses[0].id;
  }

  // Don't create default course - user must create one with a real name
  throw new Error('NO_COURSE_AVAILABLE');
}



