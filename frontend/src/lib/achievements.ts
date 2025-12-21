import { Code, FileText, BookOpen, Star } from 'lucide-react';

export interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: any;
}

export function checkAndUnlockAchievement(achievementId: string, achievement: Achievement) {
  // Dispatch achievement unlock event
  window.dispatchEvent(new CustomEvent('achievement:unlock', { detail: achievement }));
}

export function checkFirstProjectAchievement(projectCount: number) {
  if (projectCount === 1) {
    checkAndUnlockAchievement('first_project', {
      id: 'first_project',
      type: 'first_step',
      title: 'Primeiro Projeto',
      description: 'Crie seu primeiro projeto',
      icon: Code,
    });
  }
}

export function checkFirstNoteAchievement(noteCount: number) {
  if (noteCount === 1) {
    checkAndUnlockAchievement('first_note', {
      id: 'first_note',
      type: 'first_step',
      title: 'Primeira Nota',
      description: 'Crie sua primeira nota',
      icon: FileText,
    });
  }
}

export function checkFirstFlashcardAchievement(flashcardCount: number) {
  if (flashcardCount === 1) {
    checkAndUnlockAchievement('first_flashcard', {
      id: 'first_flashcard',
      type: 'first_step',
      title: 'Primeiro Flashcard',
      description: 'Crie seu primeiro flashcard',
      icon: BookOpen,
    });
  }
}




