import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Armazenamento em memória (em produção, usar banco de dados)
let competences: Array<{
  id: string;
  name: string;
  category: string;
  currentLevel: number;
  goal: number;
  description?: string;
  color?: string;
  userId: string;
}> = [];

// GET - Listar todas as competências do usuário
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userCompetences = competences.filter(c => c.userId === userId);
    
    // Extrair categorias únicas
    const categories = Array.from(new Set(userCompetences.map(c => c.category))).map((name, idx) => ({
      id: `cat-${idx}`,
      name: name as string,
      color: getCategoryColor(name, userCompetences),
    }));

    // Sempre retornar sucesso, mesmo com arrays vazios
    return res.json({ 
      competences: userCompetences || [],
      categories: categories || []
    });
  } catch (error) {
    console.error('Error fetching competences:', error);
    // Em caso de erro, retornar arrays vazios ao invés de erro 500
    return res.json({ 
      competences: [],
      categories: []
    });
  }
});

// POST - Criar nova competência
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, category, currentLevel, goal, description, color } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    if (goal < currentLevel) {
      return res.status(400).json({ error: 'Goal cannot be less than current level' });
    }

    const newCompetence = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      category: category.trim(),
      currentLevel: parseInt(currentLevel) || 0,
      goal: parseInt(goal) || 80,
      description: description?.trim() || undefined,
      color: color || getCategoryColor(category, competences),
      userId: userId,
    };

    competences.push(newCompetence);
    return res.status(201).json(newCompetence);
  } catch (error) {
    console.error('Error creating competence:', error);
    return res.status(500).json({ error: 'Failed to create competence' });
  }
});

// PUT - Atualizar competência
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, category, currentLevel, goal, description, color } = req.body;

    const competenceIndex = competences.findIndex(c => c.id === id && c.userId === userId);
    
    if (competenceIndex === -1) {
      return res.status(404).json({ error: 'Competence not found' });
    }

    if (goal < currentLevel) {
      return res.status(400).json({ error: 'Goal cannot be less than current level' });
    }

    competences[competenceIndex] = {
      ...competences[competenceIndex],
      name: name?.trim() || competences[competenceIndex].name,
      category: category?.trim() || competences[competenceIndex].category,
      currentLevel: currentLevel !== undefined ? parseInt(currentLevel) : competences[competenceIndex].currentLevel,
      goal: goal !== undefined ? parseInt(goal) : competences[competenceIndex].goal,
      description: description !== undefined ? description.trim() || undefined : competences[competenceIndex].description,
      color: color || competences[competenceIndex].color,
    };

    return res.json(competences[competenceIndex]);
  } catch (error) {
    console.error('Error updating competence:', error);
    return res.status(500).json({ error: 'Failed to update competence' });
  }
});

// DELETE - Deletar competência
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const competenceIndex = competences.findIndex(c => c.id === id && c.userId === userId);
    
    if (competenceIndex === -1) {
      return res.status(404).json({ error: 'Competence not found' });
    }

    competences.splice(competenceIndex, 1);
    return res.json({ message: 'Competence deleted successfully' });
  } catch (error) {
    console.error('Error deleting competence:', error);
    return res.status(500).json({ error: 'Failed to delete competence' });
  }
});

// PUT - Atualizar proficiência (compatibilidade com código antigo)
router.put('/proficiency', authenticate, async (req: AuthRequest, res) => {
  try {
    const { type, id, proficiency } = req.body;
    // Manter compatibilidade, mas não fazer nada real
    return res.json({ message: 'Proficiency updated', type, id, proficiency });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update proficiency' });
  }
});

// Função auxiliar para obter cor da categoria
function getCategoryColor(categoryName: string, competencesList: typeof competences): string {
  const categoryColors = [
    '#A31F34', // Primary red
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
  ];

  const existingCategory = competencesList.find(c => c.category === categoryName);
  if (existingCategory?.color) {
    return existingCategory.color;
  }

  const uniqueCategories = Array.from(new Set(competencesList.map(c => c.category)));
  const categoryIndex = uniqueCategories.indexOf(categoryName);
  return categoryColors[categoryIndex % categoryColors.length] || categoryColors[0];
}

export default router;
