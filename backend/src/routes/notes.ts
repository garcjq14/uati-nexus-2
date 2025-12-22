import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getCurrentCourseId } from '../utils/courseHelper';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { search, tags } = req.query;
    const courseId = await getCurrentCourseId(req.userId);

    const where: any = { userId: req.userId, courseId };
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (tags) {
      const tagArray = (tags as string).split(',');
      where.tags = { hasSome: tagArray };
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json(notes);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    const note = await prisma.note.findFirst({
      where: { id, userId: req.userId, courseId } as any,
      include: {
        topics: true,
      },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Fetch connected notes
    if (note.connections && note.connections.length > 0) {
      try {
        const connectionIds = JSON.parse(note.connections) as string[];
        if (connectionIds.length > 0) {
          const connectedNotes = await prisma.note.findMany({
            where: {
              id: { in: connectionIds },
            },
          });
          (note as any).connectedNotes = connectedNotes;
        }
      } catch (parseError) {
        // If connections is not valid JSON, ignore
      }
    }

    return res.json(note);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch note' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const courseId = await getCurrentCourseId(req.userId);
    const noteData: any = {
      userId: req.userId,
      courseId,
      title: req.body.title,
      content: req.body.content,
    };
    
    // Handle JSON fields
    if (req.body.connections) {
      noteData.connections = Array.isArray(req.body.connections) 
        ? JSON.stringify(req.body.connections) 
        : req.body.connections;
    }
    if (req.body.tags) {
      noteData.tags = Array.isArray(req.body.tags) 
        ? JSON.stringify(req.body.tags) 
        : req.body.tags;
    }
    if (req.body.references) {
      noteData.references = Array.isArray(req.body.references) 
        ? JSON.stringify(req.body.references) 
        : req.body.references;
    }
    
    const note = await prisma.note.create({
      data: noteData,
    });

    // Track activity for achievements
    try {
      await prisma.activity.create({
        data: {
          userId: req.userId,
          courseId,
          type: 'note_created',
          title: 'Nota Criada',
          description: `Criou nota: ${noteData.title || 'Nova nota'}`,
        } as any,
      });
    } catch (activityError) {
      // Don't fail the request if activity tracking fails
      console.warn('Failed to track note creation activity:', activityError);
    }

    return res.json(note);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    const note = await prisma.note.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updateData: any = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.content !== undefined) updateData.content = req.body.content;
    if (req.body.connections !== undefined) {
      updateData.connections = Array.isArray(req.body.connections) 
        ? JSON.stringify(req.body.connections) 
        : req.body.connections;
    }
    if (req.body.tags !== undefined) {
      updateData.tags = Array.isArray(req.body.tags) 
        ? JSON.stringify(req.body.tags) 
        : req.body.tags;
    }
    if (req.body.references !== undefined) {
      updateData.references = Array.isArray(req.body.references) 
        ? JSON.stringify(req.body.references) 
        : req.body.references;
    }

    const updated = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    const note = await prisma.note.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await prisma.note.delete({ where: { id } });
    return res.json({ message: 'Note deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;

