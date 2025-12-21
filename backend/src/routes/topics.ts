import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/curriculum/:curriculumId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { curriculumId } = req.params;

    const topics = await prisma.topic.findMany({
      where: { curriculumId },
      include: { note: true, resources: true },
      orderBy: { order: 'asc' },
    });

    return res.json(topics);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        curriculum: true,
        note: true,
        resources: true,
      },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    return res.json(topic);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { curriculumId, title, description, content, order } = req.body;

    if (!curriculumId || !title) {
      return res.status(400).json({ error: 'curriculumId and title are required' });
    }

    // Verify curriculum exists and belongs to user
    const curriculum = await prisma.curriculum.findUnique({
      where: { id: curriculumId },
      include: { user: true },
    });

    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    // Get current topic count to set order
    const topicCount = await prisma.topic.count({
      where: { curriculumId },
    });

    const topic = await prisma.topic.create({
      data: {
        curriculumId,
        title: title.trim(),
        description: description?.trim() || null,
        content: content?.trim() || null,
        order: order || topicCount + 1,
        status: 'not_read',
      },
      include: {
        curriculum: true,
        note: true,
        resources: true,
      },
    });

    return res.status(201).json(topic);
  } catch (error) {
    console.error('Failed to create topic:', error);
    return res.status(500).json({ error: 'Failed to create topic' });
  }
});

router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, content, order, status } = req.body;

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: { curriculum: { include: { user: true } } },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const updated = await prisma.topic.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? (description.trim() || null) : undefined,
        content: content !== undefined ? (content.trim() || null) : undefined,
        order: order !== undefined ? order : undefined,
        status: status || undefined,
      },
      include: {
        curriculum: true,
        note: true,
        resources: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Failed to update topic:', error);
    return res.status(500).json({ error: 'Failed to update topic' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: { curriculum: { include: { user: true } } },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    await prisma.topic.delete({ where: { id } });

    // Reorder remaining topics
    const remainingTopics = await prisma.topic.findMany({
      where: { curriculumId: topic.curriculumId },
      orderBy: { order: 'asc' },
    });

    await prisma.$transaction(
      remainingTopics.map((t, index) =>
        prisma.topic.update({
          where: { id: t.id },
          data: { order: index + 1 },
        })
      )
    );

    return res.status(204).send();
  } catch (error) {
    console.error('Failed to delete topic:', error);
    return res.status(500).json({ error: 'Failed to delete topic' });
  }
});

router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const topic = await prisma.topic.update({
      where: { id },
      data: { status },
    });

    return res.json(topic);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update topic status' });
  }
});

export default router;

