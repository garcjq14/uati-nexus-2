import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Gets the current course ID for a user, creating one if it doesn't exist
 */
export async function getCurrentCourseId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      courses: {
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const userCourses = user.courses || [];

  // If user has a current course, make sure it still exists
  if (user.currentCourseId) {
    const courseExists = userCourses.some((course) => course.id === user.currentCourseId);
    if (courseExists) {
      return user.currentCourseId;
    }

    // Course reference is stale - reset it before continuing
    await prisma.user.update({
      where: { id: userId },
      data: { currentCourseId: null },
    });
  }

  // If user has courses but no valid current, set first as current
  if (userCourses.length > 0) {
    const nextCourseId = userCourses[0].id;
    await prisma.user.update({
      where: { id: userId },
      data: { currentCourseId: nextCourseId },
    });
    return nextCourseId;
  }

  // Don't create default course - user must create one with a real name
  throw new Error('NO_COURSE_AVAILABLE');
}



