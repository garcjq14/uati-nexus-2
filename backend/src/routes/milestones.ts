import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all milestones for a project
router.get('/projects/:projectId/milestones', authenticate, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });

    return res.json(milestones);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// Create a milestone
router.post('/projects/:projectId/milestones', authenticate, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get max order if not provided
    let milestoneOrder = order;
    if (milestoneOrder === undefined) {
      try {
        const maxOrder = await prisma.milestone.findFirst({
          where: { projectId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        milestoneOrder = (maxOrder?.order ?? -1) + 1;
      } catch (error: any) {
        // If table doesn't exist, start from 0
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          console.error('Milestones table does not exist. Please run the migration.');
          return res.status(500).json({ 
            error: 'Database table not found',
            message: 'The milestones table does not exist. Please run the migration: npx prisma migrate deploy'
          });
        }
        throw error;
      }
    }

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        title: title.trim(),
        description: description?.trim() || null,
        order: milestoneOrder,
      },
    });

    // Update project progress based on milestones
    await updateProjectProgress(projectId);

    return res.json(milestone);
  } catch (error: any) {
    console.error('Error creating milestone:', error);
    // Log more details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
    }
    
    // Check if it's a table not found error
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return res.status(500).json({ 
        error: 'Database table not found',
        message: 'The milestones table does not exist. Please run: npx prisma migrate deploy'
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create milestone',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        meta: error.meta,
      } : undefined
    });
  }
});

// Update a milestone
router.put('/milestones/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed, order } = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        title: title?.trim(),
        description: description?.trim() || null,
        completed: completed !== undefined ? completed : milestone.completed,
        order: order !== undefined ? order : milestone.order,
      },
    });

    // Update project progress based on milestones
    await updateProjectProgress(milestone.projectId);

    return res.json(updated);
  } catch (error: any) {
    console.error('Error updating milestone:', error);
    return res.status(500).json({ 
      error: 'Failed to update milestone',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a milestone
router.delete('/milestones/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    await prisma.milestone.delete({
      where: { id },
    });

    // Update project progress based on milestones
    await updateProjectProgress(milestone.projectId);

    return res.json({ message: 'Milestone deleted' });
  } catch (error: any) {
    console.error('Error deleting milestone:', error);
    return res.status(500).json({ 
      error: 'Failed to delete milestone',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to update project progress based on milestones
async function updateProjectProgress(projectId: string) {
  try {
    const milestones = await prisma.milestone.findMany({
      where: { projectId },
    });

    if (milestones.length === 0) {
      await prisma.project.update({
        where: { id: projectId },
        data: { progress: 0 },
      });
      return;
    }

    const completedCount = milestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / milestones.length) * 100);

    await prisma.project.update({
      where: { id: projectId },
      data: { progress },
    });
  } catch (error) {
    console.error('Error updating project progress:', error);
  }
}

export default router;

