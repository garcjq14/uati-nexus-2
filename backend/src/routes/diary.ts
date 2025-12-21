import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/project/:projectId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const entries = await prisma.diaryEntry.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diary entries' });
  }
});

router.post('/project/:projectId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const entry = await prisma.diaryEntry.create({
      data: {
        projectId,
        ...req.body,
      },
    });

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create diary entry' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const entry = await prisma.diaryEntry.update({
      where: { id },
      data: req.body,
    });

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update diary entry' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.diaryEntry.delete({ where: { id } });
    res.json({ message: 'Diary entry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete diary entry' });
  }
});

export default router;

