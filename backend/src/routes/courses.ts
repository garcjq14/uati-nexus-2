import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getCurrentCourseId } from '../utils/courseHelper';

const router = Router();
const prisma = new PrismaClient();

// GET /courses - List all courses for the user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please log in again.' });
    }

    const courses = await prisma.course.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(courses);
  } catch (error: any) {
    console.error('Failed to fetch courses:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
    });
    return res.status(500).json({ 
      error: 'Failed to fetch courses',
      message: error.message || 'Unknown error',
    });
  }
});

// GET /courses/current - Get current course with all filtered data
router.get('/current', authenticate, async (req: AuthRequest, res) => {
  try {
    // Double check authentication
    if (!req.userId) {
      console.error('⚠️  /courses/current called without userId');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user exists
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: req.userId },
      });
    } catch (dbError: any) {
      console.error('❌ Database error fetching user:', dbError);
      console.error('Error details:', {
        message: dbError.message,
        code: dbError.code,
        name: dbError.name,
      });
      return res.status(500).json({ 
        error: 'Database error',
        message: dbError.message || 'Failed to fetch user',
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please log in again.' });
    }

    // Ensure user has a course
    let currentCourseId: string;
    try {
      currentCourseId = await getCurrentCourseId(req.userId);
    } catch (error: any) {
      if (error.message === 'NO_COURSE_AVAILABLE') {
        console.log(`⚠️  User ${req.userId} has no courses available`);
        return res.status(404).json({ 
          error: 'No course available',
          message: 'Please create a course first',
          requiresCourseCreation: true 
        });
      }
      console.error('Error ensuring user has course:', error);
      throw error;
    }

    // Fetch current course with domain
    let currentCourse;
    try {
      currentCourse = await prisma.course.findUnique({
        where: { id: currentCourseId },
        include: {
          domain: true,
        },
      });
    } catch (dbError: any) {
      // If domain table doesn't exist, try without include
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist') || dbError.message?.includes('relation') && dbError.message?.includes('domain')) {
        console.warn('⚠️  Domain table not found, fetching course without domain relation');
        currentCourse = await prisma.course.findUnique({
          where: { id: currentCourseId },
        });
      } else {
        throw dbError;
      }
    }

    if (!currentCourse) {
      return res.status(404).json({ error: 'Current course not found' });
    }

    // Fetch all user data filtered by courseId
    // Wrap in try-catch to handle potential database errors gracefully
    let curriculum: any[] = [];
    let projects: any[] = [];
    let flashcards: any[] = [];
    let resources: any[] = [];
    let knowledgeNodes: any[] = [];
    let totalHours: { _sum: { duration: number | null } } = { _sum: { duration: null } };
    
    try {
      const results = await Promise.all([
        prisma.curriculum.findMany({
          where: { userId: req.userId, courseId: currentCourseId } as any,
          orderBy: { order: 'asc' },
        }).catch((err) => {
          console.warn('⚠️  Error fetching curriculum:', err.message);
          return [];
        }),
        prisma.project.findMany({
          where: { userId: req.userId, courseId: currentCourseId } as any,
          include: { tasks: true },
          orderBy: { createdAt: 'desc' },
        }).catch((err) => {
          console.warn('⚠️  Error fetching projects:', err.message);
          return [];
        }),
        prisma.flashcard.findMany({
          where: { userId: req.userId, courseId: currentCourseId } as any,
        }).catch((err) => {
          console.warn('⚠️  Error fetching flashcards:', err.message);
          return [];
        }),
        prisma.resource.findMany({
          where: { userId: req.userId, courseId: currentCourseId } as any,
        }).catch((err) => {
          console.warn('⚠️  Error fetching resources:', err.message);
          return [];
        }),
        prisma.knowledgeNode.findMany({
          where: { userId: req.userId, courseId: currentCourseId } as any,
          include: {
            connectionsFrom: { include: { toNode: true } },
            connectionsTo: { include: { fromNode: true } },
          },
        }).catch((err) => {
          console.warn('⚠️  Error fetching knowledge nodes:', err.message);
          return [];
        }),
        prisma.studySession.aggregate({
          where: { userId: req.userId, courseId: currentCourseId } as any,
          _sum: { duration: true },
        }).catch((err) => {
          console.warn('⚠️  Error fetching study sessions:', err.message);
          return { _sum: { duration: null } };
        }),
      ]);
      
      curriculum = results[0] || [];
      projects = results[1] || [];
      flashcards = results[2] || [];
      resources = results[3] || [];
      knowledgeNodes = results[4] || [];
      totalHours = results[5] || { _sum: { duration: null } };
    } catch (fetchError: any) {
      console.error('❌ Error fetching course data:', fetchError);
      console.error('Error details:', {
        message: fetchError.message,
        code: fetchError.code,
        name: fetchError.name,
      });
      // Variables already initialized with defaults above
    }

    // Calculate stats
    const completedModules = curriculum.filter((c) => c.status === 'completed').length;
    const totalModules = curriculum.length;
    const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    const booksCount = resources.filter((r) => r.format === 'Livro').length;

    const flashcardsDue = flashcards.filter((f) => {
      if (!f.nextReview) return true;
      return new Date(f.nextReview) <= new Date();
    }).length;

    console.log(`✅ Fetched current course data for user ${req.userId}, course: ${currentCourse.title}`);
    
    return res.json({
      course: currentCourse,
      curriculum,
      projects,
      flashcards,
      resources,
      knowledgeNodes,
      stats: {
        progress,
        hoursStudied: (totalHours._sum.duration || 0) / 60,
        booksRead: booksCount,
        flashcardsDue,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch current course data:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });
    return res.status(500).json({ 
      error: 'Failed to fetch current course data',
      message: error.message || 'Unknown error',
    });
  }
});

// POST /courses - Create a new course
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, domainId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate domainId if provided
    if (domainId) {
      const domain = await prisma.domain.findUnique({
        where: { id: domainId },
      });
      if (!domain) {
        return res.status(400).json({ error: 'Invalid domain ID' });
      }
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, currentCourseId: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please log in again.' });
    }

    const course = await prisma.course.create({
      data: {
        userId: req.userId,
        title: title.trim(),
        description: description?.trim() || null,
        domainId: domainId || null,
      },
    });

    // If user doesn't have a current course, set this as current
    if (!user.currentCourseId) {
      await prisma.user.update({
        where: { id: req.userId },
        data: { currentCourseId: course.id },
      });
    }

    console.log(`✅ Course created successfully: ${course.id} for user ${req.userId}`);
    return res.status(201).json(course);
  } catch (error: any) {
    console.error('Failed to create course:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });
    return res.status(500).json({ 
      error: 'Failed to create course',
      message: error.message || 'Unknown error',
    });
  }
});

// PUT /courses/:id - Update a course
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { title, description, domainId } = req.body;

    // Verify course belongs to user
    const course = await prisma.course.findFirst({
      where: { id, userId: req.userId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate domainId if provided
    if (domainId !== undefined) {
      if (domainId) {
        const domain = await prisma.domain.findUnique({
          where: { id: domainId },
        });
        if (!domain) {
          return res.status(400).json({ error: 'Invalid domain ID' });
        }
      }
    }

    const updateData: any = {
      title: title.trim(),
      description: description !== undefined ? (description?.trim() || null) : undefined,
    };

    if (domainId !== undefined) {
      updateData.domainId = domainId || null;
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
    });

    return res.json(updatedCourse);
  } catch (error) {
    console.error('Failed to update course:', error);
    return res.status(500).json({ error: 'Failed to update course' });
  }
});

// PUT /courses/:id/switch - Switch to this course
router.put('/:id/switch', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Verify course belongs to user
    const course = await prisma.course.findFirst({
      where: { id, userId: req.userId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { currentCourseId: id },
    });

    return res.json({ message: 'Course switched successfully', course });
  } catch (error) {
    console.error('Failed to switch course:', error);
    return res.status(500).json({ error: 'Failed to switch course' });
  }
});

// DELETE /courses/:id - Delete a course
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Verify course belongs to user
    const course = await prisma.course.findFirst({
      where: { id, userId: req.userId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if this is the current course
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { currentCourseId: true },
    });

    const isCurrentCourse = user?.currentCourseId === id;

    // Check if this is the only course
    const courseCount = await prisma.course.count({
      where: { userId: req.userId },
    });

    if (courseCount === 1) {
      return res.status(400).json({
        error: 'Cannot delete the only remaining course. Please create another course first.',
      });
    }

    // If deleting current course, switch to another
    if (isCurrentCourse) {
      const otherCourse = await prisma.course.findFirst({
        where: { userId: req.userId, id: { not: id } },
        orderBy: { createdAt: 'desc' },
      });

      if (otherCourse) {
        await prisma.user.update({
          where: { id: req.userId },
          data: { currentCourseId: otherCourse.id },
        });
      }
    }

    // Delete the course (cascade will handle related data)
    await prisma.course.delete({
      where: { id },
    });

    return res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Failed to delete course:', error);
    return res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router;



