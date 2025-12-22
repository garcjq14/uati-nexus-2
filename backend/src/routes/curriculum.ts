import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getCurrentCourseId } from '../utils/courseHelper';

const router = Router();
const prisma = new PrismaClient();

const clampProgress = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
};

const ensureModuleForUser = async (moduleId: string, userId: string, courseId: string) => {
  return prisma.curriculum.findFirst({
    where: { id: moduleId, userId, courseId } as any,
  });
};

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const courseId = await getCurrentCourseId(req.userId);
    const curriculum = await prisma.curriculum.findMany({
      where: { userId: req.userId, courseId } as any,
      include: { pow: true },
      orderBy: { order: 'asc' },
    });

    return res.json(curriculum);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch curriculum' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { code, title, description, status, progress, block, milestones } = req.body;
    const courseId = await getCurrentCourseId(req.userId);
    const count = await prisma.curriculum.count({ where: { userId: req.userId, courseId } as any });

    // Calculate progress from milestones if provided
    let calculatedProgress = progress;
    if (milestones !== undefined) {
      try {
        const milestonesArray = typeof milestones === 'string' ? JSON.parse(milestones) : milestones;
        if (Array.isArray(milestonesArray) && milestonesArray.length > 0) {
          const completed = milestonesArray.filter((m: any) => m.completed).length;
          calculatedProgress = Math.round((completed / milestonesArray.length) * 100);
        }
      } catch (e) {
        // If milestones is invalid, use provided progress or default to 0
      }
    }

    const module = await prisma.curriculum.create({
      data: {
        userId: req.userId,
        courseId,
        code: code?.trim() || `MOD-${String(count + 1).padStart(2, '0')}`,
        title: title?.trim() || 'Novo módulo',
        description: description?.trim() || '',
        status: status || 'locked',
        progress: calculatedProgress !== undefined ? clampProgress(calculatedProgress) : 0,
        order: count + 1,
        block: block?.trim() || null,
        milestones: milestones ? (typeof milestones === 'string' ? milestones : JSON.stringify(milestones)) : '[]',
        customFields: '{}', // Campo obrigatório do schema
      } as any,
    });

    return res.status(201).json(module);
  } catch (error: any) {
    console.error('Failed to create module:', error);
    // Return more detailed error message
    const errorMessage = error?.message || 'Failed to create module';
    const errorCode = error?.code || '';
    
    // Check if it's a foreign key constraint error
    if (errorMessage.includes('Foreign key constraint') || 
        errorMessage.includes('foreign key') ||
        errorCode === 'P2003') {
      return res.status(400).json({ 
        error: 'Invalid user ID',
        details: 'The user ID does not exist in the database. Please make sure you are logged in correctly.',
        code: errorCode,
        userId: req.userId
      });
    }
    
    // Check if it's a database schema error
    if (errorMessage.includes('no such column: userId') || 
        errorMessage.includes('no such column: user') ||
        errorCode === 'P2021' ||
        errorMessage.includes('SQLITE_ERROR')) {
      return res.status(500).json({ 
        error: 'Database schema needs to be updated',
        details: 'The database still has the old schema. Please run: cd backend && npx prisma migrate dev',
        code: errorCode,
        originalError: errorMessage
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create module',
      details: errorMessage,
      code: errorCode
    });
  }
});

router.patch('/bulk-sync', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { modules } = req.body;
    if (!Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ error: 'Modules payload is required' });
    }

    const courseId = await getCurrentCourseId(req.userId);
    const existing = await prisma.curriculum.findMany({
      where: { userId: req.userId, courseId } as any,
      select: { id: true },
    });
    const allowedIds = new Set(existing.map((module) => module.id));
    const invalid = modules.filter((module) => !allowedIds.has(module.id));

    if (invalid.length) {
      return res.status(403).json({ error: 'Attempting to update modules outside user scope' });
    }

    await prisma.$transaction(
      modules.map((module) => {
        // Calculate progress from milestones if provided
        let calculatedProgress = module.progress;
        if (module.milestones) {
          try {
            const milestones = typeof module.milestones === 'string' 
              ? JSON.parse(module.milestones) 
              : module.milestones;
            if (Array.isArray(milestones) && milestones.length > 0) {
              const completed = milestones.filter((m: any) => m.completed).length;
              calculatedProgress = Math.round((completed / milestones.length) * 100);
            }
          } catch (e) {
            // Keep existing progress if milestones is invalid
          }
        }

        return prisma.curriculum.update({
          where: { id: module.id },
          data: {
            code: module.code?.trim() || undefined,
            title: module.title?.trim() || undefined,
            description: module.description ?? undefined,
            status: module.status || undefined,
            progress: clampProgress(calculatedProgress),
            order: module.order ?? undefined,
            block: module.block !== undefined ? (module.block?.trim() || null) : undefined,
            milestones: module.milestones !== undefined 
              ? (typeof module.milestones === 'string' ? module.milestones : JSON.stringify(module.milestones))
              : undefined,
          } as any,
        });
      })
    );

    const refreshed = await prisma.curriculum.findMany({
      where: { userId: req.userId, courseId } as any,
      orderBy: { order: 'asc' },
    });

    return res.json(refreshed);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to sync modules' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    const curriculum = await prisma.curriculum.findFirst({
      where: { id, userId: req.userId, courseId } as any,
      include: { pow: true, topics: { orderBy: { order: 'asc' } } },
    });

    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    return res.json(curriculum);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch curriculum' });
  }
});

router.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    const module = await ensureModuleForUser(id, req.userId, courseId || '');
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const { code, title, description, status, progress, order, syllabus, block, milestones } = req.body;

    // Calculate progress from milestones if provided
    let calculatedProgress = progress;
    if (milestones !== undefined) {
      try {
        const milestonesArray = typeof milestones === 'string' ? JSON.parse(milestones) : milestones;
        if (Array.isArray(milestonesArray) && milestonesArray.length > 0) {
          const completed = milestonesArray.filter((m: any) => m.completed).length;
          calculatedProgress = Math.round((completed / milestonesArray.length) * 100);
        }
      } catch (e) {
        // If milestones is invalid, keep existing progress
      }
    }

    const updated = await prisma.curriculum.update({
      where: { id },
      data: {
        code: code?.trim() || undefined,
        title: title?.trim() || undefined,
        description: description ?? undefined,
        status: status || undefined,
        progress: calculatedProgress !== undefined ? clampProgress(calculatedProgress) : undefined,
        order: order ?? undefined,
        syllabus: syllabus !== undefined ? syllabus.trim() : undefined,
        block: block !== undefined ? (block.trim() || null) : undefined,
        milestones: milestones !== undefined ? (typeof milestones === 'string' ? milestones : JSON.stringify(milestones)) : undefined,
      } as any,
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update module' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    const module = await ensureModuleForUser(id, req.userId, courseId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    await prisma.curriculum.delete({ where: { id } });

    const siblings = await prisma.curriculum.findMany({
      where: { userId: req.userId, courseId } as any,
      orderBy: { order: 'asc' },
    });

    await prisma.$transaction(
      siblings.map((item, index) =>
        prisma.curriculum.update({
          where: { id: item.id },
          data: { order: index + 1 },
        })
      )
    );

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete module' });
  }
});

router.put('/:id/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { progress, status } = req.body;
    const courseId = await getCurrentCourseId(req.userId);

    const module = await ensureModuleForUser(id, req.userId, courseId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const curriculum = await prisma.curriculum.update({
      where: { id },
      data: { progress: clampProgress(progress), status: status || module.status },
    });

    return res.json(curriculum);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update progress' });
  }
});

export default router;

