import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getCurrentCourseId } from '../utils/courseHelper';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const courseId = await getCurrentCourseId(req.userId);
    const nodes = await prisma.knowledgeNode.findMany({
      where: { userId: req.userId, courseId } as any,
      include: {
        connectionsFrom: { include: { toNode: true } },
        connectionsTo: { include: { fromNode: true } },
      },
    });

    return res.json(nodes);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch knowledge graph' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const courseId = await getCurrentCourseId(req.userId);
    const node = await prisma.knowledgeNode.create({
      data: {
        userId: req.userId,
        courseId,
        ...req.body,
      } as any,
    });

    return res.json(node);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create node' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { label, type, x, y } = req.body;

    const courseId = await getCurrentCourseId(req.userId);
    // Verify node exists and belongs to user
    const node = await prisma.knowledgeNode.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Update node with provided fields
    const updateData: any = {};
    if (label !== undefined) updateData.label = label.trim();
    if (type !== undefined) updateData.type = type;
    if (x !== undefined) updateData.x = x;
    if (y !== undefined) updateData.y = y;

    const updated = await prisma.knowledgeNode.update({
      where: { id },
      data: updateData,
      include: {
        connectionsFrom: { include: { toNode: true } },
        connectionsTo: { include: { fromNode: true } },
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Failed to update node:', error);
    return res.status(500).json({ error: 'Failed to update node' });
  }
});

router.post('/connections', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { fromNodeId, toNodeId } = req.body;

    if (!fromNodeId || !toNodeId) {
      return res.status(400).json({ error: 'fromNodeId and toNodeId are required' });
    }

    // Prevent self-connections
    if (fromNodeId === toNodeId) {
      return res.status(400).json({ error: 'Cannot connect a node to itself' });
    }

    const courseId = await getCurrentCourseId(req.userId);
    // Verify both nodes exist and belong to user
    const [fromNode, toNode] = await Promise.all([
      prisma.knowledgeNode.findFirst({ 
        where: { id: fromNodeId, userId: req.userId, courseId } as any,
      }),
      prisma.knowledgeNode.findFirst({ 
        where: { id: toNodeId, userId: req.userId, courseId } as any,
      }),
    ]);

    if (!fromNode || !toNode) {
      return res.status(404).json({ error: 'One or both nodes not found' });
    }

    // Check if connection already exists
    const existingConnection = await prisma.nodeConnection.findFirst({
      where: {
        fromNodeId,
        toNodeId,
      },
    });

    if (existingConnection) {
      return res.status(400).json({ error: 'Connection already exists' });
    }

    const connection = await prisma.nodeConnection.create({
      data: {
        fromNodeId,
        toNodeId,
      },
    });

    return res.json(connection);
  } catch (error) {
    console.error('Failed to create connection:', error);
    return res.status(500).json({ error: 'Failed to create connection' });
  }
});

router.delete('/connections/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Find the connection
    const connection = await prisma.nodeConnection.findUnique({
      where: { id },
      include: {
        fromNode: true,
        toNode: true,
      },
    }) as any;

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Verify both nodes belong to user
    if (connection.fromNode.userId !== req.userId || connection.toNode.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.nodeConnection.delete({ where: { id } });
    return res.json({ message: 'Connection deleted' });
  } catch (error) {
    console.error('Failed to delete connection:', error);
    return res.status(500).json({ error: 'Failed to delete connection' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const courseId = await getCurrentCourseId(req.userId);
    // Verify node exists and belongs to user
    const node = await prisma.knowledgeNode.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    await prisma.knowledgeNode.delete({ where: { id } });
    return res.json({ message: 'Node deleted' });
  } catch (error) {
    console.error('Failed to delete node:', error);
    return res.status(500).json({ error: 'Failed to delete node' });
  }
});

export default router;

