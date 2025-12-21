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

// Tipos permitidos (remover conquistas sem lógica)
const allowedTypes = new Set([
  'first_step',
  'consistency',
  'master',
  'architect',
  'scholar',
  'target',
  'explorer',
  'dedicated',
  'connector',
  'speed',
  'wisdom',
  'creative'
]);

// Generate 100+ achievements (serão filtrados pelos tipos permitidos)
const generateAchievements = (): Achievement[] => {
  const achievements: Achievement[] = [];

  // Início e Onboarding (10)
  achievements.push(
    { id: 'first_step', type: 'first_step', category: 'Início', title: 'Primeiro Passo', description: 'Complete o onboarding', icon: Star, rarity: 'common', points: 10 },
    { id: '2', type: 'first_step', category: 'Início', title: 'Bem-vindo', description: 'Faça login pela primeira vez', icon: Hand, rarity: 'common', points: 5 },
    { id: '4', type: 'first_step', category: 'Início', title: 'Primeira Visita', description: 'Explore o dashboard', icon: Eye, rarity: 'common', points: 5 },
    { id: '5', type: 'first_step', category: 'Início', title: 'Iniciante', description: 'Complete sua primeira atividade', icon: Play, rarity: 'common', points: 10 },
    { id: '6', type: 'first_step', category: 'Início', title: 'Explorador', description: 'Visite 5 páginas diferentes', icon: Compass, rarity: 'common', points: 15 },
    { id: '7', type: 'first_step', category: 'Início', title: 'Curioso', description: 'Leia 3 artigos de ajuda', icon: Lightbulb, rarity: 'common', points: 10 },
    { id: 'first_project', type: 'first_step', category: 'Início', title: 'Primeiro Projeto', description: 'Crie seu primeiro projeto', icon: Code, rarity: 'common', points: 20 },
    { id: 'first_note', type: 'first_step', category: 'Início', title: 'Primeira Nota', description: 'Crie sua primeira nota', icon: FileText, rarity: 'common', points: 10 },
    { id: 'first_flashcard', type: 'first_step', category: 'Início', title: 'Primeiro Flashcard', description: 'Crie seu primeiro flashcard', icon: BookOpen, rarity: 'common', points: 10 },
  );

  // Estudo e Consistência (20)
  for (let i = 1; i <= 20; i++) {
    const days = i * 7;
    achievements.push({
      id: `study_${i}`,
      type: 'consistency',
      category: 'Estudo',
      title: `${days} Dias de Estudo`,
      description: `Estude ${days} dias consecutivos`,
      icon: days <= 7 ? Clock : days <= 30 ? Calendar : days <= 100 ? Trophy : Crown,
      rarity: days <= 7 ? 'common' : days <= 30 ? 'rare' : days <= 100 ? 'epic' : 'legendary',
      points: days * 2,
      progress: 0,
      target: days,
    });
  }

  // Horas Estudadas (15)
  const hourMilestones = [1, 5, 10, 25, 50, 100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000];
  hourMilestones.forEach((hours, i) => {
    achievements.push({
      id: `hours_${hours}`,
      type: 'dedicated',
      category: 'Estudo',
      title: `${hours}h de Estudo`,
      description: `Acumule ${hours} horas de estudo`,
      icon: hours <= 10 ? Clock : hours <= 100 ? Timer : hours <= 1000 ? Award : Crown,
      rarity: hours <= 10 ? 'common' : hours <= 100 ? 'rare' : hours <= 1000 ? 'epic' : 'legendary',
      points: hours * 3,
      progress: 0,
      target: hours,
    });
  });

  // Módulos e Currículo (15)
  for (let i = 1; i <= 15; i++) {
    achievements.push({
      id: `module_${i}`,
      type: 'scholar',
      category: 'Currículo',
      title: `${i} Módulo${i > 1 ? 's' : ''} Concluído${i > 1 ? 's' : ''}`,
      description: `Complete ${i} ${i === 1 ? 'módulo' : 'módulos'}`,
      icon: i <= 3 ? BookOpen : i <= 10 ? GraduationCap : Crown,
      rarity: i <= 3 ? 'common' : i <= 10 ? 'rare' : 'epic',
      points: i * 25,
      progress: 0,
      target: i,
    });
  }

  // Projetos (20)
  for (let i = 1; i <= 20; i++) {
    achievements.push({
      id: `project_${i}`,
      type: 'architect',
      category: 'Projetos',
      title: `${i} Projeto${i > 1 ? 's' : ''} Concluído${i > 1 ? 's' : ''}`,
      description: `Complete ${i} ${i === 1 ? 'projeto' : 'projetos'}`,
      icon: i <= 5 ? Code : i <= 15 ? Rocket : Crown,
      rarity: i <= 5 ? 'common' : i <= 15 ? 'rare' : 'epic',
      points: i * 50,
      progress: 0,
      target: i,
    });
  }

  // Flashcards (15)
  const flashcardMilestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000];
  flashcardMilestones.forEach((count, i) => {
    achievements.push({
      id: `flashcard_${count}`,
      type: 'master',
      category: 'Flashcards',
      title: `${count} Flashcards Revisados`,
      description: `Revise ${count} flashcards`,
      icon: count <= 100 ? BookOpen : count <= 1000 ? FileText : Crown,
      rarity: count <= 100 ? 'common' : count <= 1000 ? 'rare' : count <= 10000 ? 'epic' : 'legendary',
      points: count / 10,
      progress: 0,
      target: count,
    });
  });

  // Notas e Conhecimento (15)
  for (let i = 1; i <= 15; i++) {
    const count = i * 5;
    achievements.push({
      id: `note_${count}`,
      type: 'connector',
      category: 'Notas',
      title: `${count} Notas Criadas`,
      description: `Crie ${count} notas`,
      icon: count <= 25 ? FileText : count <= 50 ? PenTool : Brain,
      rarity: count <= 25 ? 'common' : count <= 50 ? 'rare' : 'epic',
      points: count * 2,
      progress: 0,
      target: count,
    });
  }

  // Conexões (10)
  for (let i = 1; i <= 10; i++) {
    const connections = i * 10;
    achievements.push({
      id: `connection_${connections}`,
      type: 'connector',
      category: 'Conhecimento',
      title: `${connections} Conexões`,
      description: `Crie ${connections} conexões entre notas`,
      icon: Network,
      rarity: connections <= 50 ? 'common' : connections <= 100 ? 'rare' : 'epic',
      points: connections * 3,
      progress: 0,
      target: connections,
    });
  }

  // Recursos e Biblioteca (10)
  const resourceMilestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500];
  resourceMilestones.forEach((count, i) => {
    achievements.push({
      id: `resource_${count}`,
      type: 'explorer',
      category: 'Biblioteca',
      title: `${count} Recurso${count > 1 ? 's' : ''} Adicionado${count > 1 ? 's' : ''}`,
      description: `Adicione ${count} ${count === 1 ? 'recurso' : 'recursos'} à biblioteca`,
      icon: count <= 10 ? BookOpen : count <= 100 ? Layers : Globe,
      rarity: count <= 10 ? 'common' : count <= 100 ? 'rare' : 'epic',
      points: count * 5,
      progress: 0,
      target: count,
    });
  });

  // Velocidade e Eficiência (10)
  achievements.push(
    { id: 'speed_1', type: 'speed', category: 'Velocidade', title: 'Rápido', description: 'Complete um módulo em menos de 1 semana', icon: Rocket, rarity: 'rare', points: 50 },
    { id: 'speed_2', type: 'speed', category: 'Velocidade', title: 'Muito Rápido', description: 'Complete 5 módulos em 1 mês', icon: Zap, rarity: 'epic', points: 200 },
    { id: 'speed_3', type: 'speed', category: 'Velocidade', title: 'Relâmpago', description: 'Complete 10 módulos em 2 meses', icon: Lightning, rarity: 'legendary', points: 500 },
    { id: 'efficiency_1', type: 'target', category: 'Eficiência', title: 'Focado', description: 'Complete 3 projetos sem pausar', icon: Target, rarity: 'rare', points: 100 },
    { id: 'efficiency_2', type: 'target', category: 'Eficiência', title: 'Muito Focado', description: 'Complete 10 projetos sem pausar', icon: Target, rarity: 'epic', points: 300 },
    { id: 'efficiency_3', type: 'target', category: 'Eficiência', title: 'Laser', description: 'Complete 25 projetos sem pausar', icon: Target, rarity: 'legendary', points: 750 },
    { id: 'streak_7', type: 'consistency', category: 'Sequência', title: 'Semana Perfeita', description: '7 dias consecutivos de estudo', icon: Flame, rarity: 'common', points: 50 },
    { id: 'streak_30', type: 'consistency', category: 'Sequência', title: 'Mês Perfeito', description: '30 dias consecutivos de estudo', icon: Flame, rarity: 'rare', points: 200 },
    { id: 'streak_100', type: 'consistency', category: 'Sequência', title: 'Centenário', description: '100 dias consecutivos de estudo', icon: Flame, rarity: 'epic', points: 500 },
    { id: 'streak_365', type: 'consistency', category: 'Sequência', title: 'Ano Perfeito', description: '365 dias consecutivos de estudo', icon: Flame, rarity: 'legendary', points: 2000 },
  );

  // Especiais (apenas conquistas alcançáveis)
  achievements.push(
    { id: 'special_1', type: 'creative', category: 'Especiais', title: 'Artista', description: 'Crie 50 notas com imagens', icon: Palette, rarity: 'epic', points: 300 },
    { id: 'special_2', type: 'creative', category: 'Especiais', title: 'Escritor', description: 'Escreva mais de 10.000 palavras em notas', icon: PenTool, rarity: 'epic', points: 500 },
    { id: 'special_3', type: 'wisdom', category: 'Especiais', title: 'Sábio', description: 'Complete 100% do currículo', icon: Brain, rarity: 'legendary', points: 2000 },
  );

  return achievements;
};

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
      
      // Merge with generated achievements - use server as source of truth for unlocked status
      const generated = generateAchievements().filter((a) => allowedTypes.has(a.type));
      const merged = generated.map(gen => {
        // Try to find matching achievement by id or by title/description
        const server = serverAchievements.find((s: any) => {
          // Match by id first
          if (s.id === gen.id) return true;
          // Match by title and description for key achievements
          if (s.title === gen.title && s.description === gen.description) return true;
          // Special mapping for first_step
          if (gen.id === '1' && s.id === 'first_step') return true;
          // Special mapping for first_project
          if (gen.id === '8' && s.id === 'first_project') return true;
          // Special mapping for first_note
          if (gen.id === '9' && s.id === 'first_note') return true;
          // Special mapping for first_flashcard
          if (gen.id === '10' && s.id === 'first_flashcard') return true;
          return false;
        });
        
        if (server) {
          // Server data takes precedence, especially for unlockedAt
          return { 
            ...gen, 
            ...server,
            // Preserve icon and other frontend-specific properties
            icon: gen.icon,
            category: gen.category || 'Geral',
            rarity: gen.rarity || 'common',
            points: gen.points || 0,
          };
        }
        return gen;
      });
      
      setAchievements(merged);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      setAchievements(generateAchievements().filter((a) => allowedTypes.has(a.type)));
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
          <Card className="border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
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
          <Card className="border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
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
          <Card className="border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
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
          <Card className="border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
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
      <Card className="border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
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

        <TabsContent value="all" className="space-y-6">
          {unlockedAchievements.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Desbloqueadas ({unlockedAchievements.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
          )}

          {lockedAchievements.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                Em Progresso ({lockedAchievements.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
          )}

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma conquista encontrada com os filtros selecionados.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unlocked">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        "group relative overflow-hidden rounded-xl border transition-all duration-300",
        unlocked
          ? cn("bg-gradient-to-br", rarityGradients[achievement.rarity], "border-primary/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10")
          : "bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 opacity-60 hover:opacity-80"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardContent className="p-5 relative">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-xl border transition-colors",
            unlocked
              ? cn("bg-primary/10 border-primary/20", typeInfo.color)
              : "bg-white/5 border-white/10"
          )}>
            <Icon className={cn("h-6 w-6", unlocked ? typeInfo.color : "text-muted-foreground")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className={cn("font-semibold text-sm", unlocked ? "text-white" : "text-muted-foreground")}>
                {achievement.title}
              </h3>
              {unlocked && (
                <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 ml-2" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{achievement.description}</p>
            
            {!unlocked && achievement.progress !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="text-white">{progress} / {target}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: index * 0.05 + 0.2, duration: 0.8 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <span className={cn(
                "text-xs px-2 py-1 rounded-full font-medium",
                achievement.rarity === 'common' && "bg-white/10 text-white",
                achievement.rarity === 'rare' && "bg-blue-500/20 text-blue-400",
                achievement.rarity === 'epic' && "bg-purple-500/20 text-purple-400",
                achievement.rarity === 'legendary' && "bg-yellow-500/20 text-yellow-400"
              )}>
                {achievement.rarity === 'common' ? 'Comum' :
                 achievement.rarity === 'rare' ? 'Rara' :
                 achievement.rarity === 'epic' ? 'Épica' : 'Lendária'}
              </span>
              {achievement.points && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  {achievement.points}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </motion.div>
  );
};
