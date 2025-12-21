import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Target, Zap, BookOpen, Code, CheckCircle2, Clock, Network } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { AchievementUnlock } from './AchievementUnlock';
import { useToast } from '../feedback/ToastSystem';

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: any;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

const achievementTypes: Record<string, { icon: any; color: string; title: string }> = {
  first_step: { icon: Star, color: 'text-yellow-400', title: 'Primeiro Passo' },
  consistency: { icon: Zap, color: 'text-blue-400', title: 'Consistência' },
  master: { icon: Trophy, color: 'text-primary', title: 'Mestre' },
  architect: { icon: Code, color: 'text-green-400', title: 'Arquiteto' },
  scholar: { icon: BookOpen, color: 'text-purple-400', title: 'Erudito' },
  target: { icon: Target, color: 'text-red-400', title: 'Focado' },
  explorer: { icon: BookOpen, color: 'text-emerald-400', title: 'Explorador' },
  dedicated: { icon: Clock, color: 'text-orange-400', title: 'Dedicado' },
  connector: { icon: Network, color: 'text-cyan-400', title: 'Conector' },
};

export function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);
  const { success } = useToast();

  useEffect(() => {
    fetchAchievements();
    
    // Listen for achievement unlocks
    const handleAchievementUnlock = (event: CustomEvent) => {
      const achievement = event.detail;
      setNewlyUnlocked(achievement);
      success(`Conquista desbloqueada: ${achievement.title}!`);
      
      // Refresh achievements list after unlock
      setTimeout(() => {
        fetchAchievements();
      }, 500);
    };

    window.addEventListener('achievement:unlock', handleAchievementUnlock as EventListener);
    return () => {
      window.removeEventListener('achievement:unlock', handleAchievementUnlock as EventListener);
    };
  }, [success]);

  const fetchAchievements = async () => {
    try {
      const response = await api.get('/achievements');
      setAchievements(response.data || []);
    } catch (error) {
      // If endpoint doesn't exist, use mock data
      setAchievements(getMockAchievements());
    } finally {
      setLoading(false);
    }
  };

  const getMockAchievements = (): Achievement[] => {
    return [
      {
        id: '1',
        type: 'first_step',
        title: 'Primeiro Passo',
        description: 'Complete o onboarding',
        icon: Star,
        unlockedAt: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'consistency',
        title: 'Consistência',
        description: 'Estude 7 dias consecutivos',
        icon: Zap,
        progress: 3,
        target: 7,
      },
      {
        id: '3',
        type: 'master',
        title: 'Mestre dos Flashcards',
        description: 'Revise 100 flashcards',
        icon: Trophy,
        progress: 45,
        target: 100,
      },
      {
        id: '4',
        type: 'architect',
        title: 'Arquiteto',
        description: 'Complete 10 projetos',
        icon: Code,
        progress: 2,
        target: 10,
      },
    ];
  };

  const unlockedAchievements = achievements.filter((a) => a.unlockedAt);
  const lockedAchievements = achievements.filter((a) => !a.unlockedAt);

  if (loading) {
    return <div>Carregando conquistas...</div>;
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {newlyUnlocked && (
          <AchievementUnlock
            achievement={newlyUnlocked}
            onClose={() => setNewlyUnlocked(null)}
          />
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-2xl font-serif mb-2">Conquistas</h2>
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            {unlockedAchievements.length} de {achievements.length} desbloqueadas
          </p>
          {unlockedAchievements.length > 0 && (
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {unlockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Desbloqueadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedAchievements.map((achievement) => {
              const typeInfo = achievementTypes[achievement.type] || achievementTypes.first_step;
              const Icon = achievement.icon || typeInfo.icon;
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={cn('p-3 rounded-lg bg-primary/10', typeInfo.color)}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          {achievement.unlockedAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {lockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Em Progresso</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedAchievements.map((achievement) => {
              const typeInfo = achievementTypes[achievement.type] || achievementTypes.first_step;
              const Icon = achievement.icon || typeInfo.icon;
              const progress = achievement.progress || 0;
              const target = achievement.target || 100;
              const percentage = (progress / target) * 100;

              return (
                <Card key={achievement.id} className="border-white/5 bg-white/[0.02] opacity-60">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-white/5">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                        {achievement.progress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progresso</span>
                              <span className="text-white">{progress} / {target}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

