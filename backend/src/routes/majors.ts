import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    // Major model no longer exists - using Course instead
    // Return empty array for backward compatibility
    return res.json([]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch majors' });
  }
});

router.get('/current', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please log in again.' });
    }

    // Fetch all user data directly
    const [curriculum, projects, flashcards, resources, knowledgeNodes, totalHours] = await Promise.all([
      prisma.curriculum.findMany({
        where: { userId: req.userId } as any,
        orderBy: { order: 'asc' },
      }),
      prisma.project.findMany({
        where: { userId: req.userId } as any,
        include: { tasks: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.flashcard.findMany({
        where: { userId: req.userId } as any,
      }),
      prisma.resource.findMany({
        where: { userId: req.userId } as any,
      }),
      prisma.knowledgeNode.findMany({
        where: { userId: req.userId } as any,
        include: {
          connectionsFrom: { include: { toNode: true } },
          connectionsTo: { include: { fromNode: true } },
        },
      }),
      prisma.studySession.aggregate({
        where: { userId: req.userId } as any,
        _sum: { duration: true },
      }),
    ]);

    // Calculate stats
    const completedModules = curriculum.filter((c) => c.status === 'completed').length;
    const totalModules = curriculum.length;
    const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    const booksCount = resources.filter((r) => r.format === 'Livro').length;

    const flashcardsDue = flashcards.filter((f) => {
      if (!f.nextReview) return true;
      return new Date(f.nextReview) <= new Date();
    }).length;

    return res.json({
      major: null, // No longer using major
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
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

router.post('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    // Major model no longer exists - use /api/courses instead
    return res.status(410).json({ 
      error: 'Major model deprecated',
      message: 'Please use /api/courses endpoint instead'
    });
  } catch (error) {
    console.error('Failed to create major:', error);
    return res.status(500).json({ error: 'Failed to create major' });
  }
});

router.put('/switch/:majorId', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    // Major model no longer exists - use /api/courses/switch instead
    return res.status(410).json({ 
      error: 'Major model deprecated',
      message: 'Please use /api/courses/switch endpoint instead'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to switch major' });
  }
});

router.put('/:id', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    // Major model no longer exists - use /api/courses instead
    return res.status(410).json({ 
      error: 'Major model deprecated',
      message: 'Please use /api/courses endpoint instead'
    });
  } catch (error) {
    console.error('Failed to update major:', error);
    return res.status(500).json({ error: 'Failed to update major' });
  }
});

router.delete('/:id', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    // Major model no longer exists - use /api/courses instead
    return res.status(410).json({ 
      error: 'Major model deprecated',
      message: 'Please use /api/courses endpoint instead'
    });
  } catch (error) {
    console.error('Failed to delete major:', error);
    return res.status(500).json({ error: 'Failed to delete major' });
  }
});

export default router;

