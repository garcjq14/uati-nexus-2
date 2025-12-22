import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Helper function to calculate consecutive days
function calculateConsecutiveDays(dates: Date[]): number {
  if (dates.length === 0) return 0;
  
  // Normalize dates to start of day
  const normalizedDates = dates.map(d => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  });
  
  // Sort descending
  const uniqueDates = [...new Set(normalizedDates)].sort((a, b) => b - a);
  
  // Check consecutive days starting from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  
  let streak = 0;
  let expectedDate = todayTime;
  
  for (const dateTime of uniqueDates) {
    if (dateTime === expectedDate) {
      streak++;
      expectedDate -= 24 * 60 * 60 * 1000; // Subtract one day
    } else if (dateTime < expectedDate) {
      // Gap found, streak broken
      break;
    }
  }
  
  return streak;
}

// Helper function to calculate total study hours
function calculateTotalStudyHours(sessions: any[]): number {
  return sessions.reduce((total, session) => {
    const duration = session.duration || 0;
    return total + (duration / 3600); // Convert seconds to hours
  }, 0);
}

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
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

    // 1. Primeiro Passo - Onboarding
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

    // 2. Bem-vindo - Primeiro login (sempre desbloqueado se usuário existe)
    achievements.push({
      id: 'welcome',
      type: 'first_step',
      title: 'Bem-vindo',
      description: 'Faça login pela primeira vez',
      unlockedAt: user.createdAt.toISOString(),
    });

    // 3. Primeira Visita - Dashboard visit
    const hasDashboardVisit = activities.some((a: any) => a.type === 'dashboard_visit');
    if (hasDashboardVisit) {
      const visitActivity = activities.find((a: any) => a.type === 'dashboard_visit');
      achievements.push({
        id: 'first_visit',
        type: 'first_step',
        title: 'Primeira Visita',
        description: 'Explore o dashboard',
        unlockedAt: visitActivity?.createdAt?.toISOString() || user.updatedAt.toISOString(),
      });
    } else {
      achievements.push({
        id: 'first_visit',
        type: 'first_step',
        title: 'Primeira Visita',
        description: 'Explore o dashboard',
        progress: 0,
        target: 1,
      });
    }

    // 4. Explorador - Visit 5 different pages
    const pageVisits = activities.filter((a: any) => a.type === 'page_visit');
    const uniquePages = new Set(pageVisits.map((a: any) => a.description || a.title).filter(Boolean));
    if (uniquePages.size >= 5) {
      const fifthVisit = pageVisits.find((a: any) => {
        const pages = new Set();
        return pageVisits.some((p: any) => {
          const pageName = p.description || p.title;
          if (pageName && !pages.has(pageName)) {
            pages.add(pageName);
            return pages.size === 5;
          }
          return false;
        });
      });
      achievements.push({
        id: 'explorer',
        type: 'first_step',
        title: 'Explorador',
        description: 'Visite 5 páginas diferentes',
        unlockedAt: fifthVisit?.createdAt?.toISOString() || new Date().toISOString(),
      });
    } else {
      achievements.push({
        id: 'explorer',
        type: 'first_step',
        title: 'Explorador',
        description: 'Visite 5 páginas diferentes',
        progress: uniquePages.size,
        target: 5,
      });
    }

    // 5. Iniciante - Complete first study session
    if (sessions.length > 0) {
      achievements.push({
        id: 'beginner',
        type: 'first_step',
        title: 'Iniciante',
        description: 'Complete sua primeira sessão de estudo',
        unlockedAt: sessions[sessions.length - 1]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'beginner',
        type: 'first_step',
        title: 'Iniciante',
        description: 'Complete sua primeira sessão de estudo',
        progress: 0,
        target: 1,
      });
    }

    // 6. Primeiro Flashcard
    const flashcardCreated = activities.some((a: any) => a.type === 'flashcard_created');
    if (flashcards.length > 0 || flashcardCreated) {
      const firstFlashcard = flashcards[0] || activities.find((a: any) => a.type === 'flashcard_created');
      achievements.push({
        id: 'first_flashcard',
        type: 'first_step',
        title: 'Primeiro Flashcard',
        description: 'Crie seu primeiro flashcard',
        unlockedAt: firstFlashcard?.createdAt?.toISOString() || new Date().toISOString(),
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

    // 7. Primeira Nota
    const noteCreated = activities.some((a: any) => a.type === 'note_created');
    if (notes.length > 0 || noteCreated) {
      const firstNote = notes[0] || activities.find((a: any) => a.type === 'note_created');
      achievements.push({
        id: 'first_note',
        type: 'first_step',
        title: 'Primeira Nota',
        description: 'Crie sua primeira nota',
        unlockedAt: firstNote?.createdAt?.toISOString() || new Date().toISOString(),
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

    // 8. Primeiro Projeto
    const projectCreated = activities.some((a: any) => a.type === 'project_created');
    if (projects.length > 0 || projectCreated) {
      const firstProject = projects[0] || activities.find((a: any) => a.type === 'project_created');
      achievements.push({
        id: 'first_project',
        type: 'first_step',
        title: 'Primeiro Projeto',
        description: 'Crie seu primeiro projeto',
        unlockedAt: firstProject?.createdAt?.toISOString() || new Date().toISOString(),
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

    // 9. Consistência - Consecutive days of study
    const sessionDates = sessions.map((s: any) => s.createdAt).filter(Boolean);
    const consecutiveDays = calculateConsecutiveDays(sessionDates);
    
    // Check for 7 days streak
    if (consecutiveDays >= 7) {
      achievements.push({
        id: 'consistency_7',
        type: 'consistency',
        title: 'Semana Perfeita',
        description: 'Estude 7 dias consecutivos',
        unlockedAt: sessions[0]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'consistency_7',
        type: 'consistency',
        title: 'Semana Perfeita',
        description: 'Estude 7 dias consecutivos',
        progress: consecutiveDays,
        target: 7,
      });
    }

    // Check for 30 days streak
    if (consecutiveDays >= 30) {
      achievements.push({
        id: 'consistency_30',
        type: 'consistency',
        title: 'Mês Perfeito',
        description: 'Estude 30 dias consecutivos',
        unlockedAt: sessions[0]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'consistency_30',
        type: 'consistency',
        title: 'Mês Perfeito',
        description: 'Estude 30 dias consecutivos',
        progress: consecutiveDays,
        target: 30,
      });
    }

    // 10. Mestre dos Flashcards - Count flashcard reviews
    const flashcardReviews = activities.filter((a: any) => a.type === 'flashcard_reviewed').length;
    const reviewedCount = flashcards.filter((f: any) => f.repetitions > 0).length;
    const totalReviews = Math.max(flashcardReviews, reviewedCount);
    
    // 10 reviews
    if (totalReviews >= 10) {
      achievements.push({
        id: 'master_10',
        type: 'master',
        title: 'Aprendiz',
        description: 'Revise 10 flashcards',
        unlockedAt: new Date().toISOString(),
      });
    } else {
      achievements.push({
        id: 'master_10',
        type: 'master',
        title: 'Aprendiz',
        description: 'Revise 10 flashcards',
        progress: totalReviews,
        target: 10,
      });
    }

    // 50 reviews
    if (totalReviews >= 50) {
      achievements.push({
        id: 'master_50',
        type: 'master',
        title: 'Estudioso',
        description: 'Revise 50 flashcards',
        unlockedAt: new Date().toISOString(),
      });
    } else {
      achievements.push({
        id: 'master_50',
        type: 'master',
        title: 'Estudioso',
        description: 'Revise 50 flashcards',
        progress: totalReviews,
        target: 50,
      });
    }

    // 100 reviews
    if (totalReviews >= 100) {
      achievements.push({
        id: 'master_100',
        type: 'master',
        title: 'Mestre dos Flashcards',
        description: 'Revise 100 flashcards',
        unlockedAt: new Date().toISOString(),
      });
    } else {
      achievements.push({
        id: 'master_100',
        type: 'master',
        title: 'Mestre dos Flashcards',
        description: 'Revise 100 flashcards',
        progress: totalReviews,
        target: 100,
      });
    }

    // 11. Arquiteto - Completed projects
    const completedProjects = projects.filter((p: any) => 
      p.status === 'finalizado' || p.status === 'concluido'
    ).length;
    
    // 1 project
    if (completedProjects >= 1) {
      achievements.push({
        id: 'architect_1',
        type: 'architect',
        title: 'Primeiro Projeto Concluído',
        description: 'Complete 1 projeto',
        unlockedAt: new Date().toISOString(),
      });
    } else {
      achievements.push({
        id: 'architect_1',
        type: 'architect',
        title: 'Primeiro Projeto Concluído',
        description: 'Complete 1 projeto',
        progress: completedProjects,
        target: 1,
      });
    }

    // 5 projects
    if (completedProjects >= 5) {
      achievements.push({
        id: 'architect_5',
        type: 'architect',
        title: 'Construtor',
        description: 'Complete 5 projetos',
        unlockedAt: new Date().toISOString(),
      });
    } else {
      achievements.push({
        id: 'architect_5',
        type: 'architect',
        title: 'Construtor',
        description: 'Complete 5 projetos',
        progress: completedProjects,
        target: 5,
      });
    }

    // 10 projects
    if (completedProjects >= 10) {
      achievements.push({
        id: 'architect_10',
        type: 'architect',
        title: 'Arquiteto',
        description: 'Complete 10 projetos',
        unlockedAt: new Date().toISOString(),
      });
    } else {
      achievements.push({
        id: 'architect_10',
        type: 'architect',
        title: 'Arquiteto',
        description: 'Complete 10 projetos',
        progress: completedProjects,
        target: 10,
      });
    }

    // 12. Dedicado - Study hours
    const totalHours = calculateTotalStudyHours(sessions);
    
    // 1 hour
    if (totalHours >= 1) {
      achievements.push({
        id: 'dedicated_1',
        type: 'dedicated',
        title: '1h de Estudo',
        description: 'Acumule 1 hora de estudo',
        unlockedAt: sessions[0]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'dedicated_1',
        type: 'dedicated',
        title: '1h de Estudo',
        description: 'Acumule 1 hora de estudo',
        progress: Math.round(totalHours * 10) / 10,
        target: 1,
      });
    }

    // 10 hours
    if (totalHours >= 10) {
      achievements.push({
        id: 'dedicated_10',
        type: 'dedicated',
        title: '10h de Estudo',
        description: 'Acumule 10 horas de estudo',
        unlockedAt: sessions[0]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'dedicated_10',
        type: 'dedicated',
        title: '10h de Estudo',
        description: 'Acumule 10 horas de estudo',
        progress: Math.round(totalHours * 10) / 10,
        target: 10,
      });
    }

    // 50 hours
    if (totalHours >= 50) {
      achievements.push({
        id: 'dedicated_50',
        type: 'dedicated',
        title: '50h de Estudo',
        description: 'Acumule 50 horas de estudo',
        unlockedAt: sessions[0]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'dedicated_50',
        type: 'dedicated',
        title: '50h de Estudo',
        description: 'Acumule 50 horas de estudo',
        progress: Math.round(totalHours * 10) / 10,
        target: 50,
      });
    }

    // 13. Criador de Notas
    const noteCount = notes.length;
    if (noteCount >= 5) {
      achievements.push({
        id: 'note_creator_5',
        type: 'connector',
        title: '5 Notas Criadas',
        description: 'Crie 5 notas',
        unlockedAt: notes[0]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'note_creator_5',
        type: 'connector',
        title: '5 Notas Criadas',
        description: 'Crie 5 notas',
        progress: noteCount,
        target: 5,
      });
    }

    if (noteCount >= 25) {
      achievements.push({
        id: 'note_creator_25',
        type: 'connector',
        title: '25 Notas Criadas',
        description: 'Crie 25 notas',
        unlockedAt: notes[0]?.createdAt?.toISOString(),
      });
    } else {
      achievements.push({
        id: 'note_creator_25',
        type: 'connector',
        title: '25 Notas Criadas',
        description: 'Crie 25 notas',
        progress: noteCount,
        target: 25,
      });
    }

    return res.json(achievements);
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

export default router;
