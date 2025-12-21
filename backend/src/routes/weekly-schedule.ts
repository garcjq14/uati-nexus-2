import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { getCurrentCourseId } from '../utils/courseHelper';

const router = Router();
const prisma = new PrismaClient();

const createScheduleSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    type: z.string().min(1, 'Type is required'),
    day: z.string().min(1, 'Day is required'),
    time: z.string().optional(),
    description: z.string().optional(),
    weekStart: z.string().datetime().optional(),
  }),
});

const updateScheduleSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    type: z.string().optional(),
    day: z.string().optional(),
    time: z.string().optional(),
    description: z.string().optional(),
    completed: z.boolean().optional(),
  }),
});

// Get weekly schedule for current week
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { weekStart } = req.query;
    
    // Calculate week start (Monday)
    let startDate: Date;
    if (weekStart && typeof weekStart === 'string') {
      startDate = new Date(weekStart);
    } else {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startDate = new Date(today.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    }

    let courseId: string;
    try {
      courseId = await getCurrentCourseId(req.userId!);
    } catch (error: any) {
      if (error.message === 'NO_COURSE_AVAILABLE') {
        return res.json([]); // Return empty array if no course available
      }
      throw error;
    }

    const schedules = await prisma.weeklySchedule.findMany({
      where: {
        userId: req.userId!,
        courseId,
        weekStart: {
          gte: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000), // Include previous week
          lte: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000), // Include next week
        },
      } as any,
      orderBy: [
        { day: 'asc' },
        { time: 'asc' },
      ],
    });

    return res.json(schedules);
  } catch (error: any) {
    console.error('Failed to fetch weekly schedule:', error);
    return res.status(500).json({ error: 'Failed to fetch weekly schedule', message: error.message });
  }
});

// Create new schedule item
router.post('/', authenticate, validate(createScheduleSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { title, type, day, time, description, weekStart } = req.body;

    // Calculate week start if not provided
    let startDate: Date;
    if (weekStart) {
      startDate = new Date(weekStart);
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(today.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    }

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

    const schedule = await prisma.weeklySchedule.create({
      data: {
        userId: req.userId!,
        courseId,
        title,
        type,
        day,
        time: time || null,
        description: description || null,
        weekStart: startDate,
      } as any,
    });

    return res.json(schedule);
  } catch (error: any) {
    console.error('Failed to create schedule:', error);
    return res.status(500).json({ error: 'Failed to create schedule', message: error.message });
  }
});

// Update schedule item
router.put('/:id', authenticate, validate(updateScheduleSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, day, time, description, completed } = req.body;

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

    // Verify ownership
    const existing = await prisma.weeklySchedule.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });

    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const schedule = await prisma.weeklySchedule.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(day !== undefined && { day }),
        ...(time !== undefined && { time }),
        ...(description !== undefined && { description }),
        ...(completed !== undefined && { completed }),
      },
    });

    return res.json(schedule);
  } catch (error: any) {
    console.error('Failed to update schedule:', error);
    return res.status(500).json({ error: 'Failed to update schedule', message: error.message });
  }
});

// Delete schedule item
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

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

    // Verify ownership
    const existing = await prisma.weeklySchedule.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });

    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await prisma.weeklySchedule.delete({
      where: { id },
    });

    return res.json({ message: 'Schedule deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete schedule:', error);
    return res.status(500).json({ error: 'Failed to delete schedule', message: error.message });
  }
});

export default router;




