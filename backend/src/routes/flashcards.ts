import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getCurrentCourseId } from '../utils/courseHelper';

const router = Router();
const prisma = new PrismaClient();

// SRS algorithm constants
const MIN_EASE_FACTOR = 1.3;
const INITIAL_EASE_FACTOR = 2.5;
const QUALITY_TO_EASE_CHANGE = {
  0: -0.2, // Errei
  1: -0.15, // Difícil
  2: 0, // Bom
  3: 0.15, // Fácil
};

function calculateNextReview(quality: number, easeFactor: number, interval: number, repetitions: number): { nextInterval: number; nextEaseFactor: number; nextRepetitions: number } {
  let newEaseFactor = easeFactor + QUALITY_TO_EASE_CHANGE[quality as keyof typeof QUALITY_TO_EASE_CHANGE];
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 2) {
    // Failed or difficult - reset
    newInterval = 1;
    newRepetitions = 0;
  } else {
    // Good or easy
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
    newRepetitions = repetitions + 1;
  }

  return {
    nextInterval: newInterval,
    nextEaseFactor: newEaseFactor,
    nextRepetitions: newRepetitions,
  };
}

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const courseId = await getCurrentCourseId(req.userId);
    const flashcards = await prisma.flashcard.findMany({
      where: { userId: req.userId, courseId } as any,
      orderBy: { createdAt: 'desc' },
    });

    // Group by deck
    const decks = flashcards.reduce((acc, card) => {
      if (!acc[card.deck]) {
        acc[card.deck] = [];
      }
      acc[card.deck].push(card);
      return acc;
    }, {} as Record<string, typeof flashcards>);

    // Calculate deck stats
    const deckStats = Object.entries(decks).map(([deck, cards]) => {
      const dueCards = cards.filter((c) => {
        if (!c.nextReview) return true;
        return new Date(c.nextReview) <= new Date();
      });

      const lastReview = cards
        .filter((c) => c.lastReview)
        .sort((a, b) => (b.lastReview?.getTime() || 0) - (a.lastReview?.getTime() || 0))[0]?.lastReview;

      return {
        deck,
        total: cards.length,
        due: dueCards.length,
        new: cards.filter((c) => !c.lastReview).length,
        lastReview,
      };
    });

    return res.json({ decks: deckStats, flashcards });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

router.get('/due', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const courseId = await getCurrentCourseId(req.userId);
    const flashcards = await prisma.flashcard.findMany({
      where: {
        userId: req.userId,
        courseId,
        OR: [
          { nextReview: null },
          { nextReview: { lte: new Date() } },
        ],
      } as any,
      orderBy: { nextReview: 'asc' },
    });

    return res.json(flashcards);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch due flashcards' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const courseId = await getCurrentCourseId(req.userId);
    const flashcard = await prisma.flashcard.create({
      data: {
        userId: req.userId,
        courseId,
        ...req.body,
        easeFactor: INITIAL_EASE_FACTOR,
        interval: 1,
        repetitions: 0,
      } as any,
    });

    // Track activity for achievements
    try {
      await prisma.activity.create({
        data: {
          userId: req.userId,
          courseId,
          type: 'flashcard_created',
          title: 'Flashcard Criado',
          description: `Criou flashcard: ${req.body.front?.substring(0, 50) || 'Novo flashcard'}`,
        } as any,
      });
    } catch (activityError) {
      // Don't fail the request if activity tracking fails
      console.warn('Failed to track flashcard creation activity:', activityError);
    }

    return res.json(flashcard);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create flashcard' });
  }
});

router.post('/:id/review', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { quality } = req.body; // 0-3: Errei, Difícil, Bom, Fácil
    const courseId = await getCurrentCourseId(req.userId);

    const flashcard = await prisma.flashcard.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const { nextInterval, nextEaseFactor, nextRepetitions } = calculateNextReview(
      quality,
      flashcard.easeFactor,
      flashcard.interval,
      flashcard.repetitions
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + nextInterval);

    const updated = await prisma.flashcard.update({
      where: { id },
      data: {
        lastReview: new Date(),
        nextReview,
        easeFactor: nextEaseFactor,
        interval: nextInterval,
        repetitions: nextRepetitions,
      },
    });

    // Track activity for achievements
    try {
      await prisma.activity.create({
        data: {
          userId: req.userId,
          courseId,
          type: 'flashcard_reviewed',
          title: 'Flashcard Revisado',
          description: `Revisou flashcard: ${updated.front?.substring(0, 50) || 'Flashcard'}`,
        } as any,
      });
    } catch (activityError) {
      // Don't fail the request if activity tracking fails
      console.warn('Failed to track flashcard review activity:', activityError);
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to review flashcard' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { front, back, deck } = req.body;
    const courseId = await getCurrentCourseId(req.userId);

    const flashcard = await prisma.flashcard.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const updated = await prisma.flashcard.update({
      where: { id },
      data: {
        ...(front !== undefined && { front }),
        ...(back !== undefined && { back }),
        ...(deck !== undefined && { deck }),
      } as any,
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update flashcard' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const courseId = await getCurrentCourseId(req.userId);

    const flashcard = await prisma.flashcard.findFirst({
      where: { id, userId: req.userId, courseId } as any,
    });
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    await prisma.flashcard.delete({
      where: { id },
    });

    return res.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete flashcard' });
  }
});

router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const courseId = await getCurrentCourseId(req.userId);
    const flashcards = await prisma.flashcard.findMany({
      where: { userId: req.userId, courseId } as any,
    });

    const now = new Date();
    const totalCards = flashcards.length;
    const dueCards = flashcards.filter((c) => {
      if (!c.nextReview) return true;
      return new Date(c.nextReview) <= now;
    }).length;

    // Calculate average accuracy based on ease factor
    // Higher ease factor = better performance (simplified calculation)
    const reviewedCards = flashcards.filter((c) => c.lastReview !== null);
    const averageEaseFactor = reviewedCards.length > 0
      ? reviewedCards.reduce((sum, c) => sum + c.easeFactor, 0) / reviewedCards.length
      : INITIAL_EASE_FACTOR;
    // Convert ease factor to percentage (1.3 = 0%, 2.5 = 50%, 3.5+ = 100%)
    const averageAccuracy = Math.min(100, Math.max(0, ((averageEaseFactor - MIN_EASE_FACTOR) / (INITIAL_EASE_FACTOR - MIN_EASE_FACTOR)) * 100));

    // Calculate streak (consecutive days with reviews)
    // Group reviews by date
    const reviewDates = flashcards
      .filter((c) => c.lastReview !== null)
      .map((c) => {
        const date = new Date(c.lastReview!);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      });

    const uniqueDates = [...new Set(reviewDates)].sort((a, b) => b - a);
    let streak = 0;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = todayStart - (i * 24 * 60 * 60 * 1000);
      if (uniqueDates[i] === expectedDate) {
        streak++;
      } else {
        break;
      }
    }

    return res.json({
      totalCards,
      dueCards,
      averageAccuracy: Math.round(averageAccuracy),
      streak,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;

