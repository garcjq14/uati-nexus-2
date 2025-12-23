import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useState, useEffect, useMemo } from 'react';
import { Edit2, Plus, Trash2, Save, BookOpen, Search, Target, TrendingUp, CheckCircle2, AlertCircle, X, Filter, BarChart3 } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../components/feedback/ToastSystem';
import { LoadingSkeleton } from '../components/feedback/LoadingStates';
import { EmptyState } from '../components/empty-states/EmptyState';
import { cn } from '../lib/utils';

interface Competence {
  id: string;
  name: string;
  category: string;
  currentLevel: number; // 1-12 (não mais porcentagem)
  goal: number; // 1-12 (não mais porcentagem)
  description?: string;
  color?: string;
}

// Sistema de níveis: Iniciante (1-3), Intermediário (4-7), Avançado (8-12)
const getLevelInfo = (level: number): { category: string; sublevel: number; display: string } => {
  if (level <= 0) return { category: 'Iniciante', sublevel: 0, display: 'Não iniciado' };
  if (level <= 3) return { category: 'Iniciante', sublevel: level, display: `Iniciante ${level}` };
  if (level <= 7) return { category: 'Intermediário', sublevel: level - 3, display: `Intermediário ${level - 3}` };
  return { category: 'Avançado', sublevel: level - 7, display: `Avançado ${level - 7}` };
};

const MAX_LEVEL = 12;

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function ParadigmsMap() {
  const { success, error: showError } = useToast();
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCompetence, setShowAddCompetence] = useState(false);
  const [showEditCompetence, setShowEditCompetence] = useState(false);
  const [editingCompetence, setEditingCompetence] = useState<Competence | null>(null);
  const [newCompetence, setNewCompetence] = useState({ 
    name: '', 
    category: '', 
    currentLevel: 1, 
    goal: 5, // Intermediário 2 por padrão
    description: '' 
  });
  const [saving, setSaving] = useState(false);
  const categoryColors = [
    '#A31F34', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  ];

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(categoryColors[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar competências do paradigma
      const response = await api.get('/paradigms').catch((err: any) => {
        // Se for 401, deixar o interceptor lidar
        if (err?.response?.status === 401) {
          throw err;
        }
        // Para outros erros, retornar dados vazios
        return { data: { competences: [], categories: [] } };
      });
      
      // Buscar competências manuais do perfil
      let manualCompetencies: any[] = [];
      try {
        const manualResponse = await api.get('/user/competencies');
        manualCompetencies = manualResponse.data.competencies || [];
      } catch (error) {
        console.error('Failed to fetch manual competencies:', error);
      }
      
      const data = response?.data || {};
      let paradigmCompetences: Competence[] = [];
      
      if (data.competences) {
        paradigmCompetences = Array.isArray(data.competences) ? data.competences : [];
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } else if (data.paradigms || data.languages) {
        const fetchedParadigms = Array.isArray(data.paradigms) ? data.paradigms : [];
        const fetchedLanguages = Array.isArray(data.languages) ? data.languages : [];
        
        const uniqueCategories = Array.from(new Set([
          ...fetchedParadigms.map((p: any) => p?.name).filter(Boolean),
          ...fetchedLanguages.map((l: any) => l?.paradigm).filter(Boolean)
        ]));
        
        setCategories(uniqueCategories.map((name, idx) => ({
          id: `cat-${idx}`,
          name: name as string,
          color: categoryColors[idx % categoryColors.length],
        })));
        
        paradigmCompetences = fetchedLanguages.map((l: any, idx: number) => {
          // Converter porcentagem antiga para novo sistema de níveis (0-100 -> 1-12)
          const oldLevel = l?.proficiency || 0;
          const newLevel = oldLevel > 0 ? Math.max(1, Math.min(MAX_LEVEL, Math.ceil((oldLevel / 100) * MAX_LEVEL))) : 1;
          return {
            id: l?.id || `comp-${idx}`,
            name: l?.name || '',
            category: l?.paradigm || '',
            currentLevel: newLevel,
            goal: 7, // Intermediário 4 por padrão
            color: categoryColors[idx % categoryColors.length],
          };
        });
      } else {
        paradigmCompetences = [];
        setCategories([]);
      }
      
      // Converter competências manuais para o formato de Competence
      // strength (0-100) -> currentLevel (1-12)
      const manualCompetences: Competence[] = manualCompetencies.map((mc: any, idx: number) => {
        const strength = mc.strength || 0;
        const currentLevel = strength > 0 ? Math.max(1, Math.min(MAX_LEVEL, Math.ceil((strength / 100) * MAX_LEVEL))) : 1;
        return {
          id: `manual-${mc.id}`,
          name: mc.name,
          category: mc.description || 'Manual',
          currentLevel: currentLevel,
          goal: Math.max(currentLevel, 7), // Meta padrão: Intermediário 4
          description: mc.description,
        };
      });
      
      // Mesclar competências do paradigma com competências manuais
      const allCompetences = [...paradigmCompetences, ...manualCompetences];
      setCompetences(allCompetences);
    } catch (err: any) {
      // Se for 401, não fazer nada (interceptor já redireciona)
      if (err?.response?.status === 401) {
        return;
      }
      console.error('Failed to fetch data:', err);
      setCompetences([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showError('Informe um nome para a categoria');
      return;
    }

    const name = newCategoryName.trim();
    const color = newCategoryColor || categoryColors[categories.length % categoryColors.length];
    // Evitar duplicatas locais
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      showError('Essa categoria já existe');
      return;
    }

    setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, name, color }]);
    setNewCategoryName('');
    setNewCategoryColor(categoryColors[0]);
    setShowAddCategory(false);

    // Persistir se o backend suportar (falha silenciosa)
    try {
      await api.post('/paradigms/categories', { name, color });
    } catch (err) {
      console.warn('Não foi possível salvar categoria no backend, usando categoria local.', err);
    }
  };

  const handleAddCompetence = async () => {
    if (!newCompetence.name.trim() || !newCompetence.category.trim()) {
      showError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (newCompetence.goal < newCompetence.currentLevel) {
      showError('A meta não pode ser menor que o nível atual');
      return;
    }

    setSaving(true);
    try {
      const category = categories.find(c => c.name === newCompetence.category);
      const response = await api.post('/paradigms', {
        name: newCompetence.name.trim(),
        category: newCompetence.category.trim(),
        currentLevel: newCompetence.currentLevel,
        goal: newCompetence.goal,
        description: newCompetence.description.trim() || undefined,
        color: category?.color,
      });
      
      if (response.data) {
        await fetchData();
      }
      setNewCompetence({ name: '', category: '', currentLevel: 1, goal: 5, description: '' });
      setShowAddCompetence(false);
      success('Competência adicionada com sucesso!');
    } catch (err: any) {
      console.error('Error adding competence:', err);
      if (err?.response?.status !== 401) {
        showError(err.response?.data?.error || 'Erro ao adicionar competência');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditCompetence = async () => {
    if (!editingCompetence || !newCompetence.name.trim() || !newCompetence.category.trim()) {
      showError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (newCompetence.goal < newCompetence.currentLevel) {
      showError('A meta não pode ser menor que o nível atual');
      return;
    }

    setSaving(true);
    try {
      const category = categories.find(c => c.name === newCompetence.category);
      const response = await api.put(`/paradigms/${editingCompetence.id}`, {
        name: newCompetence.name.trim(),
        category: newCompetence.category.trim(),
        currentLevel: newCompetence.currentLevel,
        goal: newCompetence.goal,
        description: newCompetence.description.trim() || undefined,
        color: category?.color,
      });
      
      if (response.data) {
        await fetchData();
      }
      setEditingCompetence(null);
      setNewCompetence({ name: '', category: '', currentLevel: 1, goal: 5, description: '' });
      setShowEditCompetence(false);
      success('Competência atualizada com sucesso!');
    } catch (err: any) {
      console.error('Error updating competence:', err);
      if (err?.response?.status !== 401) {
        showError(err.response?.data?.error || 'Erro ao atualizar competência');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLevel = async (id: string, newLevel: number) => {
    try {
      const competence = competences.find(c => c.id === id);
      if (!competence) return;

      if (newLevel > competence.goal) {
        showError('O nível atual não pode ser maior que a meta');
        return;
      }

      if (newLevel < 1 || newLevel > MAX_LEVEL) {
        showError(`O nível deve estar entre 1 e ${MAX_LEVEL}`);
        return;
      }

      const response = await api.put(`/paradigms/${id}`, {
        currentLevel: newLevel,
      });
      
      if (response.data) {
        setCompetences(competences.map(c => 
          c.id === id ? response.data : c
        ));
        success('Nível atualizado!');
      }
    } catch (err: any) {
      console.error('Error updating level:', err);
      if (err?.response?.status !== 401) {
        showError(err.response?.data?.error || 'Erro ao atualizar nível');
      }
    }
  };

  const handleDeleteCompetence = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta competência?')) {
      return;
    }

    try {
      await api.delete(`/paradigms/${id}`);
      await fetchData();
      success('Competência removida com sucesso!');
    } catch (err: any) {
      console.error('Error deleting competence:', err);
      if (err?.response?.status !== 401) {
        showError(err.response?.data?.error || 'Erro ao remover competência');
      }
    }
  };

  const openEditCompetence = (competence: Competence) => {
    setEditingCompetence(competence);
    setNewCompetence({ 
      name: competence.name, 
      category: competence.category, 
      currentLevel: competence.currentLevel,
      goal: competence.goal,
      description: competence.description || '' 
    });
    setShowEditCompetence(true);
  };

  const stats = useMemo(() => {
    const total = competences.length;
    const completed = competences.filter(c => c.currentLevel >= c.goal).length;
    const inProgress = competences.filter(c => c.currentLevel < c.goal && c.currentLevel >= 1).length;
    const notStarted = competences.filter(c => c.currentLevel < 1).length;
    
    // Contar por categoria de nível
    const iniciante = competences.filter(c => {
      const info = getLevelInfo(c.currentLevel);
      return info.category === 'Iniciante';
    }).length;
    const intermediario = competences.filter(c => {
      const info = getLevelInfo(c.currentLevel);
      return info.category === 'Intermediário';
    }).length;
    const avancado = competences.filter(c => {
      const info = getLevelInfo(c.currentLevel);
      return info.category === 'Avançado';
    }).length;
    
    return { total, completed, inProgress, notStarted, iniciante, intermediario, avancado };
  }, [competences]);

  const filteredCompetences = useMemo(() => {
    let filtered = competences || [];
    
    if (selectedCategory) {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter((c) => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [competences, selectedCategory, searchQuery]);

  const allCategoryNames = useMemo(() => {
    try {
      return Array.from(new Set([
        ...(categories || []).map(c => c?.name).filter(Boolean),
        ...(competences || []).map(c => c?.category).filter(Boolean)
      ]));
    } catch {
      return [];
    }
  }, [categories, competences]);

  const getProgress = (current: number, goal: number) => {
    if (goal === 0 || current === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getStatus = (current: number, goal: number) => {
    if (current >= goal) return 'completed';
    if (current >= 1) return 'in-progress';
    return 'not-started';
  };

  const chartData = useMemo(() => {
    if (!filteredCompetences || filteredCompetences.length === 0) return [];
    
    const calcProgress = (current: number, goal: number) => {
      if (goal === 0 || current === 0) return 0;
      return Math.min((current / goal) * 100, 100);
    };
    
    if (filteredCompetences.length > 10) {
      const categoryData: Record<string, { current: number; goal: number; count: number }> = {};
      
      filteredCompetences.forEach(comp => {
        if (!categoryData[comp.category]) {
          categoryData[comp.category] = { current: 0, goal: 0, count: 0 };
        }
        categoryData[comp.category].current += comp.currentLevel || 0;
        categoryData[comp.category].goal += comp.goal || 0;
        categoryData[comp.category].count += 1;
      });
      
      return Object.entries(categoryData).map(([name, data]) => {
        const avgCurrent = data.count > 0 ? Math.round(data.current / data.count) : 0;
        const avgGoal = data.count > 0 ? Math.round(data.goal / data.count) : 0;
        const progress = calcProgress(avgCurrent, avgGoal);
        
        return {
          name: name.length > 12 ? name.substring(0, 12) + '...' : name,
          fullName: name,
          atual: avgCurrent,
          meta: avgGoal,
          progresso: progress,
        };
      });
    } else {
      return filteredCompetences.map(comp => ({
        name: comp.name.length > 12 ? comp.name.substring(0, 12) + '...' : comp.name,
        fullName: comp.name,
        atual: comp.currentLevel || 1,
        meta: comp.goal || MAX_LEVEL,
        progresso: calcProgress(comp.currentLevel || 1, comp.goal || MAX_LEVEL),
      }));
    }
  }, [filteredCompetences]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
      return null;
    }

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-black/90 border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-2">{data.fullName || data.name}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}%</span>
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return <LoadingSkeleton variant="grid" count={3} />;
  }

  return (
    <div className="min-h-screen w-full space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Competências</p>
          <h1 className="text-3xl font-serif font-light text-white tracking-tight">Mapa de Competências</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Acompanhe seu progresso em direção às suas metas de aprendizado. 
            Compare seu nível atual com suas metas e veja quanto falta para alcançá-las.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => setShowAddCategory(true)} 
            className="gap-2 border-dashed border-white/20 hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
          <Button 
            variant="default" 
            onClick={() => setShowAddCompetence(true)} 
            className="gap-2 shadow-[0_0_20px_rgba(120,6,6,0.3)]"
          >
            <Plus className="h-4 w-4" />
            Nova Competência
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {competences.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Concluídas</p>
                  <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Em Progresso</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Não Iniciadas</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.notStarted}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Iniciante</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.iniciante}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Intermediário</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.intermediario}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Target className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avançado</p>
                  <p className="text-2xl font-bold text-primary">{stats.avancado}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {competences.length === 0 && !loading ? (
        <div className="space-y-6">
          <EmptyState
            icon={Target}
            title="Nenhuma competência cadastrada"
            description="Comece criando uma categoria e depois adicione competências. Organize suas habilidades por áreas de conhecimento."
            actionLabel="Adicionar Primeira Competência"
            onAction={() => setShowAddCompetence(true)}
          />
          <div className="flex justify-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowAddCategory(true)} 
              className="gap-2 border-dashed border-white/20 hover:border-primary/50 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Criar Categoria Primeiro
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar competências..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Todas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCategory(true)}
                className="gap-2 border-dashed border-white/20 hover:border-primary/50 hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                Nova categoria
              </Button>
              {allCategoryNames.map((cat) => {
                const category = categories.find(c => c.name === cat) || competences.find(c => c.category === cat);
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className="gap-2"
                    style={selectedCategory === cat && category?.color ? {
                      backgroundColor: `${category.color}20`,
                      borderColor: category.color,
                      color: category.color
                    } : {}}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: category?.color || '#A31F34' }}
                    />
                    {cat}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Gráfico Radar Melhorado */}
          {filteredCompetences && filteredCompetences.length > 0 && chartData && chartData.length > 0 && (
            <Card className="border-border/30 bg-card/50 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Visão Geral do Progresso
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Comparação visual entre nível atual, meta e progresso em relação às metas
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={450}>
                    <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                      <PolarGrid 
                        stroke="#27272a" 
                        strokeWidth={1}
                        gridType="polygon"
                      />
                      <PolarAngleAxis
                        dataKey="name"
                        tick={{ 
                          fill: '#a1a1aa', 
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                        tickLine={{ stroke: '#27272a' }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, MAX_LEVEL]}
                        tick={{ 
                          fill: '#71717a', 
                          fontSize: 10 
                        }}
                        tickCount={7}
                        tickFormatter={(value) => {
                          const info = getLevelInfo(value);
                          return info.display;
                        }}
                      />
                      <Radar
                        name="Nível Atual"
                        dataKey="atual"
                        stroke="#A31F34"
                        fill="#A31F34"
                        fillOpacity={0.7}
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#A31F34' }}
                      />
                      <Radar
                        name="Meta"
                        dataKey="meta"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.4}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: '#3b82f6' }}
                      />
                      <Radar
                        name="Progresso"
                        dataKey="progresso"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.5}
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#10b981' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ 
                          color: '#a1a1aa', 
                          fontSize: '13px',
                          paddingTop: '20px'
                        }}
                        iconType="circle"
                        iconSize={10}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                  
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-border/30 justify-center">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-sm text-white font-medium">Nível Atual</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-white font-medium">Meta</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-white font-medium">Progresso em relação à meta</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grid de Competências */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompetences && filteredCompetences.length > 0 ? filteredCompetences.map((competence) => {
              const progress = getProgress(competence.currentLevel, competence.goal);
              const status = getStatus(competence.currentLevel, competence.goal);
              const remaining = Math.max(0, competence.goal - competence.currentLevel);
              const category = categories.find(c => c.name === competence.category) || competences.find(c => c.category === competence.category);
              const color = category?.color || competence.color || categoryColors[0];
              const currentLevelInfo = getLevelInfo(competence.currentLevel);
              const goalLevelInfo = getLevelInfo(competence.goal);
              
              return (
                <Card
                  key={competence.id}
                  className={cn(
                    "transition-all hover:shadow-xl hover:scale-[1.02] border-border/30 bg-card/50 backdrop-blur-sm group",
                    status === 'completed' && "border-green-500/30 bg-green-500/5",
                    status === 'in-progress' && "border-blue-500/30",
                    status === 'not-started' && "border-amber-500/30"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1 truncate">{competence.name}</h3>
                        <div 
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${color}20`,
                            color: color
                          }}
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {competence.category}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditCompetence(competence)}
                          className="p-1.5 hover:bg-white/10 rounded transition-colors"
                          title="Editar competência"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                        </button>
                        <button
                          onClick={() => handleDeleteCompetence(competence.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                          title="Remover competência"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
                        </button>
                      </div>
                    </div>

                    {competence.description && (
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                        {competence.description}
                      </p>
                    )}

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Nível Atual</span>
                        <button
                          onClick={() => {
                            const newLevel = prompt(`Novo nível atual para ${competence.name} (1-${competence.goal}):\n\nIniciante: 1-3\nIntermediário: 4-7\nAvançado: 8-12`, competence.currentLevel.toString());
                            if (newLevel !== null) {
                              const value = parseInt(newLevel);
                              if (!isNaN(value) && value >= 1 && value <= competence.goal && value <= MAX_LEVEL) {
                                handleUpdateLevel(competence.id, value);
                              } else {
                                showError(`O nível deve estar entre 1 e ${Math.min(competence.goal, MAX_LEVEL)}`);
                              }
                            }
                          }}
                          className="font-semibold text-white hover:text-primary transition-colors cursor-pointer"
                        >
                          {currentLevelInfo.display}
                        </button>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(competence.currentLevel / MAX_LEVEL) * 100}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Meta</span>
                        <span className="font-semibold" style={{ color }}>{goalLevelInfo.display}</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 opacity-50"
                          style={{ 
                            width: `${(competence.goal / MAX_LEVEL) * 100}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-border/30">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progresso em relação à meta</span>
                        <span className={cn(
                          "font-bold",
                          status === 'completed' && "text-green-400",
                          status === 'in-progress' && "text-blue-400",
                          status === 'not-started' && "text-amber-400"
                        )}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted overflow-hidden relative">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            status === 'completed' && "bg-green-500",
                            status === 'in-progress' && "bg-blue-500",
                            status === 'not-started' && "bg-amber-500"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        {status === 'completed' ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-medium">Meta alcançada!</span>
                          </div>
                        ) : status === 'in-progress' ? (
                          <div className="flex items-center gap-2 text-blue-400">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-xs font-medium">Faltam {remaining} nível{remaining !== 1 ? 's' : ''}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-400">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Não iniciado</span>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {currentLevelInfo.display} / {goalLevelInfo.display}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : null}
          </div>

          {(!filteredCompetences || filteredCompetences.length === 0) && (
            <div className="text-center text-muted-foreground py-16">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base mb-2">
                {searchQuery || selectedCategory 
                  ? 'Nenhuma competência encontrada com os filtros aplicados' 
                  : 'Nenhuma competência cadastrada'}
              </p>
              {(searchQuery || selectedCategory) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="mt-2 gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Category Modal */}
      <Modal
        isOpen={showAddCategory}
        onClose={() => {
          setShowAddCategory(false);
          setNewCategoryName('');
          setNewCategoryColor(categoryColors[0]);
        }}
        title="Nova categoria"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Nome</label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ex: Backend, Soft Skills..."
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Cor</label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-16 h-10 p-1 bg-transparent border border-white/10"
              />
              <span className="text-xs text-muted-foreground">Use uma cor para identificar a categoria no radar.</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddCategory(false)}>Cancelar</Button>
            <Button onClick={handleAddCategory} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Competence Modal */}
      <Modal
        isOpen={showAddCompetence || showEditCompetence}
        onClose={() => {
          setShowAddCompetence(false);
          setShowEditCompetence(false);
          setEditingCompetence(null);
          setNewCompetence({ name: '', category: '', currentLevel: 1, goal: 5, description: '' });
        }}
        title={editingCompetence ? "Editar Competência" : "Nova Competência"}
        size="md"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Nome da Competência *</label>
            <Input
              value={newCompetence.name}
              onChange={(e) => setNewCompetence({ ...newCompetence, name: e.target.value })}
              placeholder="Ex: Álgebra Linear, React Avançado, História do Brasil..."
              className="bg-white/5 border-white/10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Categoria *</label>
            <div className="flex gap-2">
              <select
                value={newCompetence.category}
                onChange={(e) => setNewCompetence({ ...newCompetence, category: e.target.value })}
                className="flex-1 h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Selecione uma categoria...</option>
                {allCategoryNames.map((cat) => (
                  <option key={cat} value={cat} className="bg-background">
                    {cat}
                  </option>
                ))}
              </select>
              {!allCategoryNames.includes(newCompetence.category) && newCompetence.category && (
                <span className="text-xs text-muted-foreground self-center">(Nova categoria)</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Nível Atual (1-12)
              </label>
              <select
                value={newCompetence.currentLevel}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setNewCompetence({ 
                    ...newCompetence, 
                    currentLevel: Math.min(MAX_LEVEL, Math.max(1, value)),
                    goal: Math.max(newCompetence.goal, value)
                  });
                }}
                className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map(level => {
                  const info = getLevelInfo(level);
                  return (
                    <option key={level} value={level} className="bg-background">
                      {info.display}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {getLevelInfo(newCompetence.currentLevel).display}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Meta (1-12) *
              </label>
              <select
                value={newCompetence.goal}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setNewCompetence({ 
                    ...newCompetence, 
                    goal: Math.min(MAX_LEVEL, Math.max(newCompetence.currentLevel, value))
                  });
                }}
                className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map(level => {
                  const info = getLevelInfo(level);
                  return (
                    <option key={level} value={level} disabled={level < newCompetence.currentLevel} className="bg-background">
                      {info.display}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {getLevelInfo(newCompetence.goal).display}
              </p>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-2">Sistema de Níveis:</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Iniciante:</span>
                <span className="text-white">Níveis 1-3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intermediário:</span>
                <span className="text-white">Níveis 4-7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avançado:</span>
                <span className="text-white">Níveis 8-12</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Descrição (opcional)
            </label>
            <textarea
              value={newCompetence.description}
              onChange={(e) => setNewCompetence({ ...newCompetence, description: e.target.value })}
              placeholder="Adicione uma descrição sobre esta competência..."
              className="w-full min-h-[80px] rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Progresso em relação à meta:</p>
                <p className="text-blue-400 font-bold">
                  {newCompetence.goal > 0 
                    ? `${Math.round((newCompetence.currentLevel / newCompetence.goal) * 100)}%`
                    : '0%'
                  }
                </p>
                <p className="text-blue-300/70 mt-1">
                  {getLevelInfo(newCompetence.currentLevel).display} → {getLevelInfo(newCompetence.goal).display}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => {
              setShowAddCompetence(false);
              setShowEditCompetence(false);
              setEditingCompetence(null);
              setNewCompetence({ name: '', category: '', currentLevel: 1, goal: 5, description: '' });
            }}>
              Cancelar
            </Button>
            <Button 
              variant="default" 
              onClick={editingCompetence ? handleEditCompetence : handleAddCompetence} 
              disabled={!newCompetence.name.trim() || !newCompetence.category.trim() || saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : editingCompetence ? 'Salvar Alterações' : 'Criar Competência'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}