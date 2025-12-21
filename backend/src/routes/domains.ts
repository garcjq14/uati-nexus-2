import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Helper to load template files
function loadTemplate(templateId: string): { domain: any; fields: any[]; plugins: any[] } | null {
  const templatePath = path.join(__dirname, '../templates', templateId);
  
  try {
    const domainPath = path.join(templatePath, 'domain.json');
    const fieldsPath = path.join(templatePath, 'fields.json');
    const pluginsPath = path.join(templatePath, 'plugins.json');

    if (!fs.existsSync(domainPath)) {
      return null;
    }

    const domain = JSON.parse(fs.readFileSync(domainPath, 'utf-8'));
    const fields = fs.existsSync(fieldsPath) 
      ? JSON.parse(fs.readFileSync(fieldsPath, 'utf-8'))
      : [];
    const plugins = fs.existsSync(pluginsPath)
      ? JSON.parse(fs.readFileSync(pluginsPath, 'utf-8'))
      : [];

    return { domain, fields, plugins };
  } catch (error) {
    console.error(`Failed to load template ${templateId}:`, error);
    return null;
  }
}

// GET /api/domains - Listar todos os domínios disponíveis
router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const domains = await prisma.domain.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        domainFields: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        domainPlugins: {
          where: { isActive: true },
        },
      },
    });

    return res.json(domains);
  } catch (error: any) {
    console.error('Failed to fetch domains:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
    });
    return res.status(500).json({ 
      error: 'Failed to fetch domains',
      message: error.message || 'Unknown error',
    });
  }
});

// GET /api/domains/:id - Obter detalhes de um domínio
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const domain = await prisma.domain.findUnique({
      where: { id },
      include: {
        domainFields: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        domainPlugins: {
          where: { isActive: true },
        },
      },
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    return res.json(domain);
  } catch (error) {
    console.error('Failed to fetch domain:', error);
    return res.status(500).json({ error: 'Failed to fetch domain' });
  }
});

// GET /api/domains/:id/fields - Obter campos customizados do domínio
router.get('/:id/fields', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { entity } = req.query; // Opcional: filtrar por entidade (Project, Curriculum, Resource)

    const where: any = {
      domainId: id,
      isActive: true,
    };

    if (entity) {
      where.entity = entity;
    }

    const fields = await prisma.domainField.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return res.json(fields);
  } catch (error) {
    console.error('Failed to fetch domain fields:', error);
    return res.status(500).json({ error: 'Failed to fetch domain fields' });
  }
});

// GET /api/domains/:id/plugins - Obter plugins do domínio
router.get('/:id/plugins', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const plugins = await prisma.domainPlugin.findMany({
      where: {
        domainId: id,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.json(plugins);
  } catch (error) {
    console.error('Failed to fetch domain plugins:', error);
    return res.status(500).json({ error: 'Failed to fetch domain plugins' });
  }
});

// GET /api/domains/code/:code - Obter domínio por código
router.get('/code/:code', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;

    const domain = await prisma.domain.findUnique({
      where: { code },
      include: {
        domainFields: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        domainPlugins: {
          where: { isActive: true },
        },
      },
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    return res.json(domain);
  } catch (error) {
    console.error('Failed to fetch domain by code:', error);
    return res.status(500).json({ error: 'Failed to fetch domain' });
  }
});

// POST /api/domains - Criar novo domínio (admin)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verificar se usuário é admin (implementar verificação de role se necessário)
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { code, name, description, icon, color, config } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }

    // Verificar se código já existe
    const existingDomain = await prisma.domain.findUnique({
      where: { code },
    });

    if (existingDomain) {
      return res.status(400).json({ error: 'Domain code already exists' });
    }

    const domain = await prisma.domain.create({
      data: {
        code: code.trim().toLowerCase(),
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        color: color?.trim() || null,
        config: config ? JSON.stringify(config) : '{}',
      },
      include: {
        domainFields: true,
        domainPlugins: true,
      },
    });

    return res.status(201).json(domain);
  } catch (error) {
    console.error('Failed to create domain:', error);
    return res.status(500).json({ error: 'Failed to create domain' });
  }
});

// PUT /api/domains/:id - Atualizar domínio (admin)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verificar se usuário é admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const { name, description, icon, color, config, isActive } = req.body;

    const domain = await prisma.domain.findUnique({
      where: { id },
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (icon !== undefined) updateData.icon = icon?.trim() || null;
    if (color !== undefined) updateData.color = color?.trim() || null;
    if (config !== undefined) updateData.config = JSON.stringify(config);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedDomain = await prisma.domain.update({
      where: { id },
      data: updateData,
      include: {
        domainFields: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        domainPlugins: {
          where: { isActive: true },
        },
      },
    });

    return res.json(updatedDomain);
  } catch (error) {
    console.error('Failed to update domain:', error);
    return res.status(500).json({ error: 'Failed to update domain' });
  }
});

// POST /api/domains/templates/:templateId/apply - Aplicar template a um curso
router.post('/templates/:templateId/apply', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { templateId } = req.params;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    // Verify course belongs to user
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: req.userId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Load template
    const template = loadTemplate(templateId);
    if (!template) {
      return res.status(404).json({ error: `Template '${templateId}' not found` });
    }

    // Check if domain already exists
    let domain = await prisma.domain.findUnique({
      where: { code: template.domain.code },
    });

    // Create domain if it doesn't exist
    if (!domain) {
      domain = await prisma.domain.create({
        data: {
          code: template.domain.code,
          name: template.domain.name,
          description: template.domain.description || null,
          icon: template.domain.icon || null,
          color: template.domain.color || null,
          config: JSON.stringify(template.domain.config || {}),
        },
      });
    }

    // Create domain fields
    for (const fieldData of template.fields) {
      const existingField = await prisma.domainField.findFirst({
        where: {
          domainId: domain.id,
          entity: fieldData.entity,
          fieldName: fieldData.fieldName,
        },
      });

      if (!existingField) {
        await prisma.domainField.create({
          data: {
            domainId: domain.id,
            entity: fieldData.entity,
            fieldName: fieldData.fieldName,
            fieldType: fieldData.fieldType,
            label: fieldData.label,
            required: fieldData.required || false,
            options: fieldData.options || null,
            defaultValue: fieldData.defaultValue || null,
            order: fieldData.order || 0,
          },
        });
      }
    }

    // Create domain plugins
    for (const pluginData of template.plugins) {
      const existingPlugin = await prisma.domainPlugin.findFirst({
        where: {
          domainId: domain.id,
          pluginKey: pluginData.pluginKey,
        },
      });

      if (!existingPlugin) {
        await prisma.domainPlugin.create({
          data: {
            domainId: domain.id,
            pluginKey: pluginData.pluginKey,
            name: pluginData.name,
            description: pluginData.description || null,
            config: JSON.stringify(pluginData.config || {}),
          },
        });
      }
    }

    // Update course with domain
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { domainId: domain.id },
      include: { domain: true },
    });

    return res.json({
      message: 'Template applied successfully',
      domain,
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Failed to apply template:', error);
    return res.status(500).json({ error: 'Failed to apply template' });
  }
});

// GET /api/domains/templates - Listar templates disponíveis
router.get('/templates/list', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const templatesDir = path.join(__dirname, '../templates');
    const templates: string[] = [];

    if (fs.existsSync(templatesDir)) {
      const dirs = fs.readdirSync(templatesDir, { withFileTypes: true });
      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const domainPath = path.join(templatesDir, dir.name, 'domain.json');
          if (fs.existsSync(domainPath)) {
            try {
              JSON.parse(fs.readFileSync(domainPath, 'utf-8'));
              templates.push(dir.name);
            } catch (error) {
              console.error(`Failed to parse template ${dir.name}:`, error);
            }
          }
        }
      }
    }

    return res.json(templates);
  } catch (error) {
    console.error('Failed to list templates:', error);
    return res.status(500).json({ error: 'Failed to list templates' });
  }
});

export default router;

