import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getCurrentCourseId } from '../utils/courseHelper';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { filter, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let courseId: string;
    try {
      courseId = await getCurrentCourseId(req.userId!);
    } catch (error: any) {
      if (error.message === 'NO_COURSE_AVAILABLE') {
        return res.json([]); // Return empty array if no course available
      }
      throw error;
    }

    const where: any = { userId: req.userId, courseId };
    if (filter && filter !== 'all') {
      where.type = filter;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    return res.json(activities);
  } catch (error: any) {
    console.error('Failed to fetch activities:', error);
    return res.status(500).json({ error: 'Failed to fetch activities', message: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    let courseId: string;
    try {
      courseId = await getCurrentCourseId(req.userId!);
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

    const activity = await prisma.activity.create({
      data: {
        userId: req.userId!,
        courseId,
        ...req.body,
      } as any,
    });

    return res.json(activity);
  } catch (error: any) {
    console.error('Failed to create activity:', error);
    return res.status(500).json({ error: 'Failed to create activity', message: error.message });
  }
});

export default router;

