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

    const { format } = req.query;
    const courseId = await getCurrentCourseId(req.userId);

    const where: any = { userId: req.userId, courseId };
    if (format && format !== 'Todos') {
      where.format = format;
    }

    const resources = await prisma.resource.findMany({
      where,
      include: { annotations: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(resources);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Filtrar apenas os campos válidos do schema
    // Campos opcionais que podem não existir no banco ainda
    const optionalFields = ['description', 'estimatedChapters'];
    const requiredFields = ['title', 'author', 'format', 'status', 'url', 'notes', 'tags', 'topicId'];
    const allowedFields = [...requiredFields, ...optionalFields];
    
    const courseId = await getCurrentCourseId(req.userId);
    const data: any = {
      userId: req.userId,
      courseId,
    };

    // Adicionar apenas campos permitidos que existem no req.body
    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
        data[field] = req.body[field];
      }
    }

    // Tentar criar o recurso
    let resource;
    try {
      resource = await prisma.resource.create({
        data,
      });
    } catch (createError: any) {
      // Se falhar por causa de campos opcionais que não existem no banco, tentar sem eles
      if (createError?.message?.includes('no such column') || createError?.code === 'P2021') {
        const dataWithoutOptional: any = {
          userId: req.userId,
          courseId,
        };
        
        for (const field of requiredFields) {
          if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
            dataWithoutOptional[field] = req.body[field];
          }
        }
        
        resource = await prisma.resource.create({
          data: dataWithoutOptional,
        });
      } else {
        throw createError;
      }
    }

    return res.json(resource);
  } catch (error: any) {
    console.error('Failed to create resource:', error);
    return res.status(500).json({ 
      error: 'Failed to create resource',
      details: error?.message || 'Unknown error'
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

    // Verify resource belongs to user and course
    const existingResource = await prisma.resource.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });

    if (!existingResource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Filtrar apenas os campos válidos do schema
    // Campos opcionais que podem não existir no banco ainda
    const optionalFields = ['description', 'estimatedChapters'];
    const requiredFields = ['title', 'author', 'format', 'status', 'url', 'notes', 'tags', 'topicId'];
    const allowedFields = [...requiredFields, ...optionalFields];
    
    const data: any = {};
    
    // Adicionar apenas campos permitidos que existem no req.body
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Se for string vazia, converter para null
        if (typeof req.body[field] === 'string' && req.body[field].trim() === '') {
          data[field] = null;
        } else {
          data[field] = req.body[field];
        }
      }
    }

    // Tentar atualizar o recurso
    let resource;
    try {
      resource = await prisma.resource.update({
        where: { id },
        data,
      });
    } catch (updateError: any) {
      // Se falhar por causa de campos opcionais que não existem no banco, tentar sem eles
      if (updateError?.message?.includes('no such column') || updateError?.code === 'P2021') {
        const dataWithoutOptional: any = {};
        
        for (const field of requiredFields) {
          if (req.body[field] !== undefined) {
            if (typeof req.body[field] === 'string' && req.body[field].trim() === '') {
              dataWithoutOptional[field] = null;
            } else {
              dataWithoutOptional[field] = req.body[field];
            }
          }
        }
        
        resource = await prisma.resource.update({
          where: { id },
          data: dataWithoutOptional,
        });
      } else {
        throw updateError;
      }
    }

    return res.json(resource);
  } catch (error: any) {
    console.error('Failed to update resource:', error);
    return res.status(500).json({ 
      error: 'Failed to update resource',
      details: error?.message || 'Unknown error'
    });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);
    const resource = await prisma.resource.findFirst({
      where: { id, userId: req.userId, courseId } as any,
      include: { annotations: true },
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    return res.json(resource);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    // Verify resource belongs to user and course
    const resource = await prisma.resource.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await prisma.resource.delete({ where: { id } });
    return res.json({ message: 'Resource deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete resource' });
  }
});

router.get('/:id/annotations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const annotations = await prisma.resourceAnnotation.findMany({
      where: { resourceId: id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(annotations);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch annotations' });
  }
});

router.post('/:id/annotations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const annotation = await prisma.resourceAnnotation.create({
      data: {
        resourceId: id,
        ...req.body,
      },
    });

    return res.json(annotation);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create annotation' });
  }
});

export default router;

