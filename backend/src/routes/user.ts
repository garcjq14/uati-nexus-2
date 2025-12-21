import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/preferences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { onboardingCompleted: true },
    });
    
    // In a real app, this would be stored in a UserPreferences table
    return res.json({ 
      completionGoal: null, 
      goalDate: null,
      onboardingCompleted: user?.onboardingCompleted || false,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

router.post('/preferences', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    // In a real app, this would save to UserPreferences table
    return res.json({ message: 'Preferences saved' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save preferences' });
  }
});

router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

router.put('/email', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { newEmail } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { email: newEmail },
    });

    return res.json({ message: 'Email updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update email' });
  }
});

router.get('/dashboard-layout', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    // For now, return empty or default layout
    // In production, this would be stored in a UserPreferences or DashboardLayout table
    return res.json({ layout: null });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch dashboard layout' });
  }
});

router.put('/dashboard-layout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { layout } = req.body;
    // For now, just acknowledge the save
    // In production, this would save to a UserPreferences or DashboardLayout table
    return res.json({ message: 'Dashboard layout saved', layout });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save dashboard layout' });
  }
});

router.post('/avatar', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ error: 'Avatar image is required' });
    }

    // Validate that it's a data URL or URL
    if (!avatar.startsWith('data:image/') && !avatar.startsWith('http://') && !avatar.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid image format. Expected data URL or URL.' });
    }

    // Update user avatar
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { avatar },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    // Track profile configuration for achievements
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { avatar: true, portfolio: true },
      });
      
      if (user && (user.avatar || user.portfolio)) {
        // Check if we already tracked this
        const existingActivity = await prisma.activity.findFirst({
          where: {
            userId: req.userId,
            type: 'profile_configured',
          } as any,
        });
        
        if (!existingActivity) {
          await prisma.activity.create({
            data: {
              userId: req.userId!,
              type: 'profile_configured',
              title: 'Perfil Configurado',
              description: 'Usuário configurou avatar ou portfolio',
            },
          });
        }
      }
    } catch (error) {
      // Silently fail
      console.warn('Failed to track profile configuration:', error);
    }

    return res.json({ message: 'Avatar updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Failed to update avatar:', error);
    return res.status(500).json({ error: 'Failed to update avatar' });
  }
});

router.post('/onboarding-complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Update user onboarding status
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { onboardingCompleted: true },
      select: {
        id: true,
        email: true,
        name: true,
        onboardingCompleted: true,
        updatedAt: true,
      },
    });

    return res.json({ message: 'Onboarding completed successfully', user: updatedUser });
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    return res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// Update user profile (name, social links)
router.put('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, linkedin, github, twitter, portfolio } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (github !== undefined) updateData.github = github;
    if (twitter !== undefined) updateData.twitter = twitter;
    if (portfolio !== undefined) updateData.portfolio = portfolio;

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        portfolio: true,
        linkedin: true,
        github: true,
        twitter: true,
      },
    });

    return res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get manual competencies
router.get('/competencies', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const competencies = await prisma.manualCompetency.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ competencies });
  } catch (error) {
    console.error('Failed to fetch competencies:', error);
    return res.status(500).json({ error: 'Failed to fetch competencies' });
  }
});

// Create manual competency
router.post('/competencies', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, strength, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Competency name is required' });
    }

    const competency = await prisma.manualCompetency.create({
      data: {
        userId: req.userId,
        name,
        strength: strength || 0,
        description: description || null,
      },
    });

    return res.json({ message: 'Competency created successfully', competency });
  } catch (error) {
    console.error('Failed to create competency:', error);
    return res.status(500).json({ error: 'Failed to create competency' });
  }
});

// Update manual competency
router.put('/competencies/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, strength, description } = req.body;

    // Verify ownership
    const existing = await prisma.manualCompetency.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Competency not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (strength !== undefined) updateData.strength = strength;
    if (description !== undefined) updateData.description = description;

    const competency = await prisma.manualCompetency.update({
      where: { id },
      data: updateData,
    });

    return res.json({ message: 'Competency updated successfully', competency });
  } catch (error) {
    console.error('Failed to update competency:', error);
    return res.status(500).json({ error: 'Failed to update competency' });
  }
});

// Delete manual competency
router.delete('/competencies/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.manualCompetency.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Competency not found' });
    }

    await prisma.manualCompetency.delete({
      where: { id },
    });

    return res.json({ message: 'Competency deleted successfully' });
  } catch (error) {
    console.error('Failed to delete competency:', error);
    return res.status(500).json({ error: 'Failed to delete competency' });
  }
});

export default router;

