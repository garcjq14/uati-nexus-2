import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getCurrentCourseId } from '../utils/courseHelper';

const router = Router();
const prisma = new PrismaClient();

router.post('/session', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let courseId: string;
    try {
      courseId = await getCurrentCourseId(req.userId);
    } catch (error: any) {
      if (error.message === 'NO_COURSE_AVAILABLE') {
        return res.status(404).json({ 
          error: 'No course available',
          message: 'Please create a course first',
          requiresCourseCreation: true 
        });
      }
      throw error;
    }

    const session = await prisma.studySession.create({
      data: {
        userId: req.userId,
        courseId,
        ...req.body,
      } as any,
    });

    return res.json(session);
  } catch (error: any) {
    console.error('Failed to create session:', error);
    return res.status(500).json({ error: 'Failed to create session', message: error.message });
  }
});

router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let courseId: string;
    try {
      courseId = await getCurrentCourseId(req.userId);
    } catch (error: any) {
      if (error.message === 'NO_COURSE_AVAILABLE') {
        return res.json([]); // Return empty array if no course available
      }
      throw error;
    }

    const sessions = await prisma.studySession.findMany({
      where: {
        userId: req.userId,
        courseId,
      } as any,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json(sessions);
  } catch (error: any) {
    console.error('Failed to fetch history:', error);
    return res.status(500).json({ error: 'Failed to fetch history', message: error.message });
  }
});

export default router;

