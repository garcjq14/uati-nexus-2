import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Target, Zap, BookOpen, Code, CheckCircle2, Clock, Network,
  Flame, Rocket, Sparkles, Brain, Layers, Award, GraduationCap, FileText,
  Users, Heart, Shield, Sword, Crown, Gem, Medal, Badge, Coins, Gift,
  Search, Filter, X, TrendingUp, Activity, BarChart3, Calendar, Timer,
  Lightbulb, PenTool, Compass, Map, Globe, Database, Server, Cpu, Wifi,
  Lock, Unlock, Eye, EyeOff, Play, Pause, Repeat, Shuffle, SkipForward,
  Music, Headphones, Volume2, Mic, Video, Camera, Image, Film
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { AchievementUnlock } from '../components/achievements/AchievementUnlock';
import { useToast } from '../components/feedback/ToastSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface Achievement {
  id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  icon: any;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: number;
  target?: number;
  points?: number;
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
  speed: { icon: Rocket, color: 'text-pink-400', title: 'Velocidade' },
  wisdom: { icon: Brain, color: 'text-indigo-400', title: 'Sabedoria' },
  creative: { icon: Sparkles, color: 'text-yellow-500', title: 'Criativo' },
};

const rarityColors = {
  common: 'border-white/20 bg-white/5',
  rare: 'border-blue-500/30 bg-blue-500/10',
  epic: 'border-purple-500/30 bg-purple-500/10',
  legendary: 'border-yellow-500/30 bg-yellow-500/10',
};

const rarityGradients = {
  common: 'from-white/10 to-white/5',
  rare: 'from-blue-500/20 to-blue-500/10',
  epic: 'from-purple-500/20 to-purple-500/10',
  legendary: 'from-yellow-500/20 via-orange-500/20 to-yellow-500/10',
};

// Icon aliases for missing lucide-react icons
const Hand = Users;
const Settings = Target;
const Lightning = Zap;
const Palette = Sparkles;

// Helper function to get icon and category for achievement
function getAchievementMetadata(achievement: any): { icon: any; category: string; rarity: string; points: number } {
  const id = achievement.id || '';
  const type = achievement.type || '';
  
  // Map achievement IDs to icons and categories
  const iconMap: Record<string, any> = {
    'first_step': Star,
    'welcome': Users, // Using Users as Hand alias
    'first_visit': Eye,
    'beginner': Play,
    'explorer': Compass,
    'first_flashcard': BookOpen,
    'first_note': FileText,
    'first_project': Code,
    'consistency_7': Flame,
    'consistency_30': Flame,
    'master_10': BookOpen,
    'master_50': BookOpen,
    'master_100': Trophy,
    'architect_1': Code,
    'architect_5': Code,
    'architect_10': Rocket,
    'dedicated_1': Clock,
    'dedicated_10': Timer,
    'dedicated_50': Award,
    'note_creator_5': FileText,
    'note_creator_25': PenTool,
  };

  // Determine category based on type
  const categoryMap: Record<string, string> = {
    'first_step': 'Início',
    'consistency': 'Consistência',
    'master': 'Flashcards',
    'architect': 'Projetos',
    'dedicated': 'Estudo',
    'connector': 'Notas',
  };

  // Determine rarity based on achievement
  let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
  if (id.includes('_100') || id.includes('_50') || id.includes('_30') || id.includes('_25')) {
    rarity = 'rare';
  }
  if (id.includes('_100') && type === 'master') {
    rarity = 'epic';
  }

  // Calculate points
  let points = 0;
  if (achievement.unlockedAt) {
    // Base points for unlocked achievements
    if (type === 'first_step') points = 10;
    else if (type === 'consistency') points = achievement.target ? achievement.target * 5 : 50;
    else if (type === 'master') points = achievement.target ? achievement.target * 2 : 20;
    else if (type === 'architect') points = achievement.target ? achievement.target * 50 : 50;
    else if (type === 'dedicated') points = achievement.target ? achievement.target * 10 : 10;
    else if (type === 'connector') points = achievement.target ? achievement.target * 5 : 5;
  }

  return {
    icon: iconMap[id] || Star,
    category: categoryMap[type] || 'Geral',
    rarity,
    points,
  };
}

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);
  const { success } = useToast();

  useEffect(() => {
    fetchAchievements();
    
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
      const serverAchievements = response.data || [];
      
      // Use only server achievements and add metadata
      const achievementsWithMetadata = serverAchievements.map((achievement: any) => {
        const metadata = getAchievementMetadata(achievement);
        return {
          ...achievement,
          icon: metadata.icon,
          category: metadata.category,
          rarity: metadata.rarity,
          points: metadata.points,
        };
      });
      
      setAchievements(achievementsWithMetadata);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(achievements.map(a => a.category));
    return Array.from(cats).sort();
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    return achievements.filter(achievement => {
      const matchesSearch = achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory;
      const matchesRarity = selectedRarity === 'all' || achievement.rarity === selectedRarity;
      return matchesSearch && matchesCategory && matchesRarity;
    });
  }, [achievements, searchQuery, selectedCategory, selectedRarity]);

  const unlockedAchievements = filteredAchievements.filter(a => a.unlockedAt);
  const lockedAchievements = filteredAchievements.filter(a => !a.unlockedAt);

  const totalPoints = useMemo(() => {
    return unlockedAchievements.reduce((sum, a) => sum + (a.points || 0), 0);
  }, [unlockedAchievements]);

  // Conquistas recentes (últimas 3 desbloqueadas)
  const recentAchievements = useMemo(() => {
    return unlockedAchievements
      .sort((a, b) => {
        const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
        const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [unlockedAchievements]);

  // Agrupar conquistas por categoria
  const achievementsByCategory = useMemo(() => {
    const grouped: Record<string, typeof achievements> = {};
    filteredAchievements.forEach(achievement => {
      const category = achievement.category || 'Geral';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(achievement);
    });
    return grouped;
  }, [filteredAchievements]);

  if (loading) {
    return (
      <div className="space-y-8 w-full px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full pb-12 px-4">
      <AnimatePresence>
        {newlyUnlocked && (
          <AchievementUnlock
            achievement={newlyUnlocked}
            onClose={() => setNewlyUnlocked(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Sistema de Conquistas</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light text-white tracking-tight">Conquistas</h1>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-b border-white/10 bg-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Desbloqueadas</p>
                  <p className="text-2xl font-bold text-white">{unlockedAchievements.length}</p>
                </div>
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-b border-white/10 bg-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold text-white">{achievements.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-b border-white/10 bg-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Progresso</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-b border-white/10 bg-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pontos</p>
                  <p className="text-2xl font-bold text-white">{totalPoints.toLocaleString()}</p>
                </div>
                <Coins className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Filters */}
      <Card className="border-b border-white/10 bg-transparent">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conquistas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                <option value="all">Todas Categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                <option value="all">Todas Raridades</option>
                <option value="common">Comum</option>
                <option value="rare">Rara</option>
                <option value="epic">Épica</option>
                <option value="legendary">Lendária</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Conquistas Recentes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAchievements.map((achievement, index) => {
              const typeInfo = achievementTypes[achievement.type] || achievementTypes.first_step;
              const Icon = achievement.icon || typeInfo.icon;
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  Icon={Icon}
                  typeInfo={typeInfo}
                  index={index}
                  unlocked={true}
                />
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Achievements Grid */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-white/5 border border-white/10 p-1 rounded-lg">
          <TabsTrigger value="all" className="data-[state=active]:bg-white/10">
            Todas ({filteredAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="unlocked" className="data-[state=active]:bg-white/10">
            Desbloqueadas ({unlockedAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="locked" className="data-[state=active]:bg-white/10">
            Em Progresso ({lockedAchievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8">
          {/* Agrupar por categoria */}
          {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => {
            const categoryUnlocked = categoryAchievements.filter(a => a.unlockedAt);
            const categoryLocked = categoryAchievements.filter(a => !a.unlockedAt);
            
            if (categoryAchievements.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    {category}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({categoryUnlocked.length}/{categoryAchievements.length})
                    </span>
                  </h2>
                  <div className="h-px flex-1 bg-white/10 mx-4" />
                  <div className="text-sm text-muted-foreground">
                    {Math.round((categoryUnlocked.length / categoryAchievements.length) * 100)}%
                  </div>
                </div>
                
                {categoryUnlocked.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {categoryUnlocked.map((achievement, index) => {
                      const typeInfo = achievementTypes[achievement.type] || achievementTypes.first_step;
                      const Icon = achievement.icon || typeInfo.icon;
                      return (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          Icon={Icon}
                          typeInfo={typeInfo}
                          index={index}
                          unlocked={true}
                        />
                      );
                    })}
                  </div>
                )}
                
                {categoryLocked.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryLocked.map((achievement, index) => {
                      const typeInfo = achievementTypes[achievement.type] || achievementTypes.first_step;
                      const Icon = achievement.icon || typeInfo.icon;
                      return (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          Icon={Icon}
                          typeInfo={typeInfo}
                          index={index}
                          unlocked={false}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma conquista encontrada com os filtros selecionados.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unlocked">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlockedAchievements.map((achievement, index) => {
              const typeInfo = achievementTypes[achievement.type] || achievementTypes.first_step;
              const Icon = achievement.icon || typeInfo.icon;
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  Icon={Icon}
                  typeInfo={typeInfo}
                  index={index}
                  unlocked={true}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="locked">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedAchievements.map((achievement, index) => {
              const typeInfo = achievementTypes[achievement.type] || achievementTypes.first_step;
              const Icon = achievement.icon || typeInfo.icon;
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  Icon={Icon}
                  typeInfo={typeInfo}
                  index={index}
                  unlocked={false}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const AchievementCard = ({ achievement, Icon, typeInfo, index, unlocked }: {
  achievement: Achievement;
  Icon: any;
  typeInfo: any;
  index: number;
  unlocked: boolean;
}) => {
  const progress = achievement.progress || 0;
  const target = achievement.target || 100;
  const percentage = target > 0 ? (progress / target) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "group relative transition-all duration-300 hover:scale-[1.02]",
        unlocked
          ? "opacity-100"
          : "opacity-70 hover:opacity-90"
      )}
    >
      <Card className={cn(
        "h-full border transition-all duration-300 overflow-hidden",
        unlocked
          ? "border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent shadow-lg shadow-primary/10"
          : "border-white/10 bg-white/[0.02] hover:border-white/20"
      )}>
        <CardContent className="p-6 relative">
          {/* Status Badge */}
          {unlocked && (
            <div className="absolute top-4 right-4">
              <div className="relative">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <div className="absolute inset-0 bg-green-400/20 blur-md rounded-full" />
              </div>
            </div>
          )}

          {/* Icon Section */}
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "p-4 rounded-2xl border-2 transition-all duration-300 flex-shrink-0",
              unlocked
                ? cn("bg-primary/10 border-primary/30 shadow-lg shadow-primary/20", typeInfo.color)
                : "bg-white/5 border-white/10 group-hover:border-white/20"
            )}>
              <Icon className={cn(
                "h-8 w-8 transition-all duration-300",
                unlocked ? typeInfo.color : "text-muted-foreground group-hover:text-white/60"
              )} />
            </div>
            
            {/* Title and Category */}
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-bold text-base mb-1 leading-tight",
                unlocked ? "text-white" : "text-white/70"
              )}>
                {achievement.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {achievement.category || 'Geral'}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className={cn(
            "text-sm mb-4 leading-relaxed",
            unlocked ? "text-white/80" : "text-muted-foreground"
          )}>
            {achievement.description}
          </p>

          {/* Progress Bar (for locked achievements) */}
          {!unlocked && achievement.progress !== undefined && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Progresso</span>
                <span className="text-white font-semibold">{progress} / {target}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Unlocked Date (for unlocked achievements) */}
          {unlocked && achievement.unlockedAt && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground">
                Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Footer: Rarity and Points */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <span className={cn(
              "text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wide",
              achievement.rarity === 'common' && "bg-white/10 text-white/90",
              achievement.rarity === 'rare' && "bg-blue-500/20 text-blue-300 border border-blue-500/30",
              achievement.rarity === 'epic' && "bg-purple-500/20 text-purple-300 border border-purple-500/30",
              achievement.rarity === 'legendary' && "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
            )}>
              {achievement.rarity === 'common' ? 'Comum' :
               achievement.rarity === 'rare' ? 'Rara' :
               achievement.rarity === 'epic' ? 'Épica' : 'Lendária'}
            </span>
            {achievement.points && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5">
                <Coins className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-xs font-semibold text-white">{achievement.points}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
