import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    // For now, return mock achievements based on user activity
    // In production, this would query an Achievement table
    
    // Get user stats to determine achievements
    if (!req.userId) {
      return res.json([]);
    }

    const [user, sessions, flashcards, projects, notes, activities] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId } }),
      prisma.studySession.findMany({ where: { userId: req.userId } as any }),
      prisma.flashcard.findMany({ where: { userId: req.userId } as any }),
      prisma.project.findMany({ where: { userId: req.userId } as any }),
      prisma.note.findMany({ where: { userId: req.userId } as any }),
      prisma.activity.findMany({ where: { userId: req.userId } as any }),
    ]);

    if (!user) {
      return res.json([]);
    }

    const achievements = [];

    // Check for first_step achievement (onboarding completed)
    if (user.onboardingCompleted) {
      achievements.push({
        id: 'first_step',
        type: 'first_step',
        title: 'Primeiro Passo',
        description: 'Complete o onboarding',
        unlockedAt: user.updatedAt.toISOString(),
      });
    } else {
      achievements.push({
        id: 'first_step',
        type: 'first_step',
        title: 'Primeiro Passo',
        description: 'Complete o onboarding',
        progress: 0,
        target: 1,
      });
    }

    // Check for consistency (7 consecutive days)
    // Simple check - in production would check for consecutive days
    if (sessions.length >= 7) {
      achievements.push({
        id: 'consistency',
        type: 'consistency',
        title: 'Consistência',
        description: 'Estude 7 dias consecutivos',
        unlockedAt: sessions[0]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'consistency',
        type: 'consistency',
        title: 'Consistência',
        description: 'Estude 7 dias consecutivos',
        progress: sessions.length,
        target: 7,
      });
    }

    // Check for master (100 flashcards reviewed)
    const reviewedCount = flashcards.filter((f: any) => f.reviewCount > 0 || f.repetitions > 0).length;
    if (reviewedCount >= 100) {
      achievements.push({
        id: 'master',
        type: 'master',
        title: 'Mestre dos Flashcards',
        description: 'Revise 100 flashcards',
        unlockedAt: new Date().toISOString(),
      });
    } else {
      achievements.push({
        id: 'master',
        type: 'master',
        title: 'Mestre dos Flashcards',
        description: 'Revise 100 flashcards',
        progress: reviewedCount,
        target: 100,
      });
    }

    // Check for first flashcard created
    if (flashcards.length > 0) {
      achievements.push({
        id: 'first_flashcard',
        type: 'first_step',
        title: 'Primeiro Flashcard',
        description: 'Crie seu primeiro flashcard',
        unlockedAt: flashcards[0]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'first_flashcard',
        type: 'first_step',
        title: 'Primeiro Flashcard',
        description: 'Crie seu primeiro flashcard',
        progress: 0,
        target: 1,
      });
    }

    // Check for first note created
    if (notes.length > 0) {
      achievements.push({
        id: 'first_note',
        type: 'first_step',
        title: 'Primeira Nota',
        description: 'Crie sua primeira nota',
        unlockedAt: notes[0]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'first_note',
        type: 'first_step',
        title: 'Primeira Nota',
        description: 'Crie sua primeira nota',
        progress: 0,
        target: 1,
      });
    }

    // Check for first project created
    if (projects.length > 0) {
      achievements.push({
        id: 'first_project',
        type: 'first_step',
        title: 'Primeiro Projeto',
        description: 'Crie seu primeiro projeto',
        unlockedAt: projects[0]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'first_project',
        type: 'first_step',
        title: 'Primeiro Projeto',
        description: 'Crie seu primeiro projeto',
        progress: 0,
        target: 1,
      });
    }

    // Check for architect (10 projects completed)
    const completedProjects = projects.filter((p: any) => p.status === 'finalizado' || p.status === 'concluido').length;
    if (completedProjects >= 10) {
      achievements.push({
        id: 'architect',
        type: 'architect',
        title: 'Arquiteto',
        description: 'Complete 10 projetos',
        unlockedAt: new Date().toISOString(),
      });
    } else {
      achievements.push({
        id: 'architect',
        type: 'architect',
        title: 'Arquiteto',
        description: 'Complete 10 projetos',
        progress: completedProjects,
        target: 10,
      });
    }

    // Check for "Bem-vindo" (first login) - check if user has any activity or if account was created recently
    const hasLoginActivity = activities.some((a: any) => a.type === 'login' || a.type === 'first_login');
    const isNewUser = new Date(user.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000; // Created in last 24h
    if (hasLoginActivity || isNewUser) {
      achievements.push({
        id: '2',
        type: 'first_step',
        title: 'Bem-vindo',
        description: 'Faça login pela primeira vez',
        unlockedAt: user.createdAt.toISOString(),
      });
    } else {
      achievements.push({
        id: '2',
        type: 'first_step',
        title: 'Bem-vindo',
        description: 'Faça login pela primeira vez',
        progress: 0,
        target: 1,
      });
    }

    // Check for "Primeira Visita" (dashboard visit)
    const hasDashboardVisit = activities.some((a: any) => a.type === 'dashboard_visit' || a.type === 'page_visit');
    if (hasDashboardVisit) {
      const visitActivity = activities.find((a: any) => a.type === 'dashboard_visit' || a.type === 'page_visit');
      achievements.push({
        id: '4',
        type: 'first_step',
        title: 'Primeira Visita',
        description: 'Explore o dashboard',
        unlockedAt: visitActivity?.createdAt?.toISOString() || user.updatedAt.toISOString(),
      });
    } else {
      achievements.push({
        id: '4',
        type: 'first_step',
        title: 'Primeira Visita',
        description: 'Explore o dashboard',
        progress: 0,
        target: 1,
      });
    }

    // Check for "Explorador" (visit 5 different pages)
    const pageVisits = activities.filter((a: any) => a.type === 'page_visit' || a.type?.includes('visit'));
    const uniquePages = new Set(pageVisits.map((a: any) => a.description || a.title).filter(Boolean));
    if (uniquePages.size >= 5) {
      achievements.push({
        id: '6',
        type: 'first_step',
        title: 'Explorador',
        description: 'Visite 5 páginas diferentes',
        unlockedAt: pageVisits[4]?.createdAt?.toISOString() || new Date().toISOString(),
      });
    } else {
      achievements.push({
        id: '6',
        type: 'first_step',
        title: 'Explorador',
        description: 'Visite 5 páginas diferentes',
        progress: uniquePages.size,
        target: 5,
      });
    }

    // Check for "Iniciante" (complete first activity)
    const hasCompletedActivity = activities.some((a: any) => 
      a.type === 'activity_completed' || 
      a.type === 'topic_read' || 
      a.type === 'module_completed' ||
      sessions.length > 0
    );
    if (hasCompletedActivity) {
      const firstActivity = activities.find((a: any) => 
        a.type === 'activity_completed' || 
        a.type === 'topic_read' || 
        a.type === 'module_completed'
      ) || sessions[0];
      achievements.push({
        id: '5',
        type: 'first_step',
        title: 'Iniciante',
        description: 'Complete sua primeira atividade',
        unlockedAt: firstActivity?.createdAt?.toISOString() || new Date().toISOString(),
      });
    } else {
      achievements.push({
        id: '5',
        type: 'first_step',
        title: 'Iniciante',
        description: 'Complete sua primeira atividade',
        progress: 0,
        target: 1,
      });
    }

    return res.json(achievements);
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

export default router;

