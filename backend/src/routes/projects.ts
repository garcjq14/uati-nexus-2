import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getCurrentCourseId } from '../utils/courseHelper';
import { validateCustomFields, stringifyCustomFields, parseCustomFields, getCustomFieldsWithDefaults } from '../utils/domainHelper';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const courseId = await getCurrentCourseId(req.userId);
    const projects = await prisma.project.findMany({
      where: { userId: req.userId, courseId } as any,
      include: { tasks: { orderBy: { order: 'asc' } }, diary: { orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    const project = await prisma.project.findFirst({
      where: { id, userId: req.userId, courseId } as any,
      include: {
        tasks: { orderBy: { order: 'asc' } },
        diary: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, type, deadline, repository, technologies, status, progress, customFields } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const courseId = await getCurrentCourseId(req.userId);

    // Get course to find domainId
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { domainId: true },
    });

    // Validate custom fields if domain exists
    let validatedCustomFields: Record<string, any> = {};
    if (customFields) {
      const validation = await validateCustomFields(
        course?.domainId || null,
        'Project',
        typeof customFields === 'string' ? parseCustomFields(customFields) : customFields
      );

      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Invalid custom fields',
          details: validation.errors
        });
      }

      validatedCustomFields = validation.sanitized;
    } else if (course?.domainId) {
      // Apply defaults if domain exists but no customFields provided
      validatedCustomFields = await getCustomFieldsWithDefaults(course.domainId, 'Project');
    }

    // Prepare data object
    const projectData: any = {
      userId: req.userId,
      courseId,
      title: title.trim(),
      description: description?.trim() || null,
      type: type || 'Dev',
      status: status || 'em_progresso',
      progress: progress !== undefined ? parseInt(progress) : 0,
      repository: repository?.trim() || null,
      technologies: technologies || '[]',
      customFields: stringifyCustomFields(validatedCustomFields),
    };

    // Handle deadline - convert empty string to null, or parse date string
    if (deadline && deadline.trim()) {
      const deadlineDate = new Date(deadline);
      if (!isNaN(deadlineDate.getTime())) {
        projectData.deadline = deadlineDate;
      } else {
        return res.status(400).json({ error: 'Invalid deadline format' });
      }
    } else {
      projectData.deadline = null;
    }

    const project = await prisma.project.create({
      data: projectData,
      include: { tasks: true },
    });

    // Track activity for achievements
    try {
      await prisma.activity.create({
        data: {
          userId: req.userId,
          courseId,
          type: 'project_created',
          title: 'Projeto Criado',
          description: `Criou projeto: ${projectData.title}`,
        } as any,
      });
    } catch (activityError) {
      // Don't fail the request if activity tracking fails
      console.warn('Failed to track project creation activity:', activityError);
    }

    return res.json(project);
  } catch (error: any) {
    console.error('Error creating project:', error);
    // Provide more detailed error message
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Project with this title already exists' });
    }
    return res.status(500).json({ 
      error: 'Failed to create project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    // Verify project belongs to user and course
    const existingProject = await prisma.project.findFirst({
      where: { id, userId: req.userId, courseId } as any,
      include: { course: { select: { domainId: true } } },
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Prepare update data
    const updateData: any = { ...req.body };

    // Handle customFields if provided
    if (updateData.customFields !== undefined) {
      const domainId = existingProject.course?.domainId || null;
      const customFieldsInput = typeof updateData.customFields === 'string' 
        ? parseCustomFields(updateData.customFields) 
        : updateData.customFields;

      // Merge with existing customFields
      const existingCustomFields = parseCustomFields(existingProject.customFields);
      const mergedCustomFields = { ...existingCustomFields, ...customFieldsInput };

      const validation = await validateCustomFields(domainId, 'Project', mergedCustomFields);

      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Invalid custom fields',
          details: validation.errors
        });
      }

      updateData.customFields = stringifyCustomFields(validation.sanitized);
    }

    // Handle other fields
    if (updateData.title) updateData.title = updateData.title.trim();
    if (updateData.description !== undefined) {
      updateData.description = updateData.description?.trim() || null;
    }
    if (updateData.repository !== undefined) {
      updateData.repository = updateData.repository?.trim() || null;
    }
    if (updateData.deadline !== undefined) {
      if (updateData.deadline && updateData.deadline.trim()) {
        const deadlineDate = new Date(updateData.deadline);
        if (!isNaN(deadlineDate.getTime())) {
          updateData.deadline = deadlineDate;
        } else {
          return res.status(400).json({ error: 'Invalid deadline format' });
        }
      } else {
        updateData.deadline = null;
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: { tasks: true },
    });

    // Track activity if project was completed
    if (updateData.status === 'finalizado' || updateData.status === 'concluido') {
      const wasCompleted = existingProject.status !== 'finalizado' && existingProject.status !== 'concluido';
      if (wasCompleted) {
        try {
          await prisma.activity.create({
            data: {
              userId: req.userId!,
              courseId,
              type: 'project_completed',
              title: 'Projeto Concluído',
              description: `Concluiu projeto: ${project.title}`,
            } as any,
          });
        } catch (activityError) {
          console.warn('Failed to track project completion activity:', activityError);
        }
      }
    }

    return res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    // Verify project belongs to user and course
    const project = await prisma.project.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({ where: { id } });
    return res.json({ message: 'Project deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.post('/:id/tasks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.create({
      data: {
        projectId: id,
        ...req.body,
      },
    });

    return res.json(task);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/tasks/:taskId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = await prisma.task.update({
      where: { id: taskId },
      data: req.body,
    });

    return res.json(task);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/tasks/:taskId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    await prisma.task.delete({ where: { id: taskId } });
    return res.json({ message: 'Task deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

router.get('/:id/checklist', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    const project = await prisma.project.findFirst({
      where: { id, userId: req.userId, courseId } as any,
      include: { tasks: { orderBy: { order: 'asc' } } },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Checklist items are the tasks
    return res.json(project.tasks);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

router.get('/:id/diary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    // Verify project belongs to user and course
    const project = await prisma.project.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const entries = await prisma.diaryEntry.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    return res.json(entries);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch diary entries' });
  }
});

router.post('/:id/diary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    // Verify project belongs to user and course
    const project = await prisma.project.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const entry = await prisma.diaryEntry.create({
      data: {
        projectId: id,
        ...req.body,
      },
    });

    return res.json(entry);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create diary entry' });
  }
});

router.put('/diary/:entryId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { entryId } = req.params;
    const entry = await prisma.diaryEntry.update({
      where: { id: entryId },
      data: req.body,
    });

    return res.json(entry);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update diary entry' });
  }
});

router.delete('/diary/:entryId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { entryId } = req.params;
    await prisma.diaryEntry.delete({ where: { id: entryId } });
    return res.json({ message: 'Diary entry deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete diary entry' });
  }
});

export default router;

