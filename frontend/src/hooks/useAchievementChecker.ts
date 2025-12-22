import { useCallback } from 'react';
import api from '../lib/api';

/**
 * Hook para verificar e desbloquear conquistas automaticamente após ações do usuário
 */
export function useAchievementChecker() {
  /**
   * Verifica conquistas após uma ação e dispara eventos para conquistas recém-desbloqueadas
   */
  const checkAchievements = useCallback(async () => {
    try {
      // Busca todas as conquistas do servidor
      const response = await api.get('/achievements');
      const achievements = response.data || [];
      
      // Busca conquistas anteriormente desbloqueadas do localStorage
      const previousUnlocked = JSON.parse(
        localStorage.getItem('unlocked_achievements') || '[]'
      ) as string[];
      
      // Identifica conquistas recém-desbloqueadas
      const newlyUnlocked = achievements.filter(
        (achievement: any) => 
          achievement.unlockedAt && 
          !previousUnlocked.includes(achievement.id)
      );
      
      // Atualiza a lista de conquistas desbloqueadas
      const currentUnlocked = achievements
        .filter((a: any) => a.unlockedAt)
        .map((a: any) => a.id);
      localStorage.setItem('unlocked_achievements', JSON.stringify(currentUnlocked));
      
      // Dispara eventos para cada conquista recém-desbloqueada
      newlyUnlocked.forEach((achievement: any) => {
        window.dispatchEvent(
          new CustomEvent('achievement:unlock', { detail: achievement })
        );
      });
      
      return newlyUnlocked;
    } catch (error) {
      console.warn('Failed to check achievements:', error);
      return [];
    }
  }, []);

  /**
   * Verifica conquistas após uma ação específica (criar flashcard, nota, projeto, etc.)
   */
  const checkAfterAction = useCallback(async (actionType: string) => {
    // Aguarda um pequeno delay para garantir que o backend processou a ação
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verifica conquistas
    const newlyUnlocked = await checkAchievements();
    
    if (newlyUnlocked.length > 0) {
      console.log(`Desbloqueadas ${newlyUnlocked.length} conquista(s) após ${actionType}`);
    }
    
    return newlyUnlocked;
  }, [checkAchievements]);

  return {
    checkAchievements,
    checkAfterAction,
  };
}

