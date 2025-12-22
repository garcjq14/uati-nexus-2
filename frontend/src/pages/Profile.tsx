import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useCourse } from '../contexts/CourseContext';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Edit, LogOut, Mail, Calendar, Award, GraduationCap, BookOpen, Clock, Upload,
  Target, TrendingUp, Code, CheckCircle2, Star, Briefcase, Users, FileText,
  Zap, Brain, Layers, BarChart3, Trophy, Link as LinkIcon,
  MapPin, Globe, Github, Linkedin, Twitter, Download, Share2, Activity,
  Flame, Rocket, Sparkles, Compass, PenTool, ArrowRight, ChevronRight, Plus, Trash2, Save, X
} from 'lucide-react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const LEVEL_NAMES = [
  'Iniciante',
  'Explorador',
  'Aprendiz',
  'Estudante',
  'Conhecedor',
  'Mestre',
  'Sábio',
  'Lenda',
];

function calculateLevel(progress: number, hoursStudied: number): { level: number; name: string } {
  const progressScore = progress / 10;
  const hoursScore = Math.min(hoursStudied / 20, 10);
  const totalScore = progressScore + hoursScore;
  const level = Math.min(Math.floor(totalScore / 2.5), 7);
  return { level, name: LEVEL_NAMES[level] || 'Iniciante' };
}

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  primary: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-500' },
};

const StatCard = ({ icon: Icon, label, value, color, delay = 0 }: { 
  icon: any; 
  label: string; 
  value: string | number; 
  color: string;
  delay?: number;
}) => {
  const colors = colorMap[color] || colorMap.primary;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/5 p-6 hover:border-white/10 transition-all duration-200"
    >
      <div className="relative">
        <div className={cn("inline-flex p-3 rounded-xl mb-4", colors.bg, colors.border, "border")}>
          <Icon className={cn("h-5 w-5", colors.text)} />
        </div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      </div>
    </motion.div>
  );
};

const CompetencyCard = ({ name, strength, items, index }: { 
  name: string; 
  strength: number; 
  items: string[];
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.03 }}
    className="group relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/5 p-5 hover:border-primary/20 transition-all duration-200"
  >
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{name}</h3>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{strength}%</span>
      </div>
      <div className="relative w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${strength}%` }}
          transition={{ delay: index * 0.05 + 0.2, duration: 0.8, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>
      <p className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'módulo' : 'módulos'}</p>
    </div>
  </motion.div>
);

const ActivityCard = ({ type, title, progress, icon: Icon, index }: {
  type: string;
  title: string;
  progress?: number;
  icon: any;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="group relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/5 p-5 hover:border-primary/20 transition-all duration-200"
  >
    <div className="relative">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">{type}</p>
            <h3 className="text-base font-semibold text-white truncate group-hover:text-primary transition-colors">{title}</h3>
          </div>
        </div>
        {progress !== undefined && (
          <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-full ml-2">{progress}%</span>
        )}
      </div>
      {progress !== undefined && (
        <div className="relative w-full bg-white/10 h-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-primary rounded-full"
          />
        </div>
      )}
    </div>
  </motion.div>
);

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useUser();
  const { courseData } = useCourse();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [manualCompetencies, setManualCompetencies] = useState<Array<{id: string; name: string; strength: number; description?: string}>>([]);
  const [editingCompetency, setEditingCompetency] = useState<string | null>(null);
  const [newCompetency, setNewCompetency] = useState({ name: '', strength: 0, description: '' });
  const [showAddCompetency, setShowAddCompetency] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      e.target.value = ''; // Reset input
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      e.target.value = ''; // Reset input
      return;
    }

    setUploadingAvatar(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          
          // Send to backend
          await api.post('/user/avatar', { avatar: base64String });
          
          // Refresh user data to get updated avatar
          await refreshUser();
        } catch (error) {
          console.error('Failed to upload avatar:', error);
          alert('Erro ao fazer upload do avatar. Tente novamente.');
        } finally {
          setUploadingAvatar(false);
          // Reset input to allow selecting the same file again
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.onerror = () => {
        alert('Erro ao ler o arquivo. Tente novamente.');
        setUploadingAvatar(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Erro ao fazer upload do avatar. Tente novamente.');
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Load manual competencies
  useEffect(() => {
    const loadCompetencies = async () => {
      try {
        const response = await api.get('/user/competencies');
        setManualCompetencies(response.data.competencies || []);
      } catch (error) {
        console.error('Failed to load competencies:', error);
      }
    };
    loadCompetencies();
  }, []);

  useEffect(() => {
    if (user) {
      setNameValue(user.name || '');
    }
  }, [user]);

  // Sincronizar dados do curso quando mudarem
  useEffect(() => {
    // Força atualização quando courseData mudar
    if (courseData) {
      // Dados já estão sincronizados via contexto
    }
  }, [courseData]);

  const handleNameSave = async () => {
    try {
      await api.put('/user', { name: nameValue });
      await refreshUser();
      setEditingName(false);
    } catch (error) {
      console.error('Failed to update name:', error);
      alert('Erro ao atualizar nome');
    }
  };

  const handleAddCompetency = async () => {
    if (!newCompetency.name.trim()) {
      alert('Por favor, insira um nome para a competência');
      return;
    }
    try {
      const response = await api.post('/user/competencies', newCompetency);
      setManualCompetencies([...manualCompetencies, response.data.competency]);
      setNewCompetency({ name: '', strength: 0, description: '' });
      setShowAddCompetency(false);
    } catch (error) {
      console.error('Failed to add competency:', error);
      alert('Erro ao adicionar competência');
    }
  };

  const handleUpdateCompetency = async (id: string, data: {name?: string; strength?: number; description?: string}) => {
    try {
      const response = await api.put(`/user/competencies/${id}`, data);
      setManualCompetencies(manualCompetencies.map(c => c.id === id ? response.data.competency : c));
      setEditingCompetency(null);
    } catch (error) {
      console.error('Failed to update competency:', error);
      alert('Erro ao atualizar competência');
    }
  };

  const handleDeleteCompetency = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta competência?')) return;
    try {
      await api.delete(`/user/competencies/${id}`);
      setManualCompetencies(manualCompetencies.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete competency:', error);
      alert('Erro ao excluir competência');
    }
  };

  const stats = courseData.stats;
  const { level, name: levelName } = calculateLevel(stats.progress, stats.hoursStudied);
  // Informação de "desde" removida para layout minimalista

  // Calculate completed curriculum items
  const completedCurriculum = useMemo(() => {
    return courseData.curriculum.filter(item => item.status === 'completed');
  }, [courseData]);

  // Calculate active curriculum items
  const activeCurriculum = useMemo(() => {
    return courseData.curriculum.filter(item => item.status === 'active');
  }, [courseData]);

  // Calculate completed projects
  const completedProjects = useMemo(() => {
    return courseData.projects.filter(project => project.status === 'completed' || project.progress === 100);
  }, [courseData]);

  // Calculate active projects
  const activeProjects = useMemo(() => {
    return courseData.projects.filter(project => 
      project.status !== 'completed' && project.progress < 100 && project.progress > 0
    );
  }, [courseData]);

  // Use only manual competencies
  const competencies = useMemo(() => {
    return manualCompetencies.map(c => ({ 
      name: c.name, 
      strength: c.strength, 
      items: [],
      isManual: true,
      id: c.id,
      description: c.description
    }));
  }, [manualCompetencies]);

  // What I'm doing
  const currentActivities = useMemo(() => {
    const activities: Array<{ type: string; title: string; progress?: number; icon: any }> = [];
    
    activeCurriculum.slice(0, 3).forEach(item => {
      activities.push({
        type: 'Estudando',
        title: item.title,
        progress: item.progress,
        icon: BookOpen
      });
    });

    activeProjects.slice(0, 3).forEach(project => {
      activities.push({
        type: 'Desenvolvendo',
        title: project.title,
        progress: project.progress,
        icon: Code
      });
    });

    return activities;
  }, [activeCurriculum, activeProjects]);

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${user?.name}`,
          text: `Confira o perfil de competências de ${user?.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="space-y-8 w-full pb-12 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Perfil do Estudante</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light text-white tracking-tight">Resumo de Competências</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            size="sm"
            className="border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 text-muted-foreground transition-all"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleShare}
            size="sm"
            className="border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 text-muted-foreground transition-all"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings')} 
            size="sm"
            className="border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 text-muted-foreground transition-all"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            size="sm"
            className="border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-muted-foreground transition-all"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-white/5 border border-white/10 p-1 rounded-lg">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="competencies"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
          >
            Competências
          </TabsTrigger>
          <TabsTrigger 
            value="projects"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
          >
            Projetos
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-white/10 bg-transparent"
          >
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="relative group">
                  <div className="relative">
                    <img
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=780606&color=fff`}
                      alt={user?.name}
                      className="h-36 w-36 rounded-full border-2 border-white/10 object-cover bg-transparent"
                    />
                    <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-green-500 border-3 border-[#050506] shadow-lg ring-2 ring-green-500/50" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      {uploadingAvatar ? (
                        <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="h-6 w-6 text-white" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      aria-label="Upload avatar image"
                    />
                  </div>
                </div>
                <div className="flex-1 mb-2">
                  {editingName ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        className="text-4xl font-light bg-transparent border-b-2 border-primary focus:outline-none text-white"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleNameSave}
                        className="h-8 w-8 p-0"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingName(false);
                          setNameValue(user?.name || '');
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-4xl font-light text-white">{user?.name}</h2>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingName(true)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-primary font-semibold text-sm">Nível {level + 1} • {levelName} Nexus</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{user?.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={TrendingUp} label="Progresso" value={`${stats.progress}%`} color="primary" delay={0.1} />
            <StatCard icon={Clock} label="Horas" value={stats.hoursStudied.toFixed(1)} color="green" delay={0.2} />
            <StatCard icon={BookOpen} label="Livros" value={stats.booksRead} color="blue" delay={0.3} />
            <StatCard icon={Code} label="Projetos" value={completedProjects.length} color="purple" delay={0.4} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* O que estou fazendo */}
              <Card className="border-b border-white/10 bg-transparent">
                <CardHeader className="border-b border-white/10 bg-white/5">
                  <CardTitle className="flex items-center gap-2 text-xl font-light text-white">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    O que estou fazendo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <AnimatePresence mode="wait">
                    {currentActivities.length > 0 ? (
                      currentActivities.map((activity, index) => (
                        <ActivityCard key={index} {...activity} index={index} />
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Compass className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma atividade em andamento no momento.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Competências Principais */}
              <Card className="border-b border-white/10 bg-transparent">
                <CardHeader className="border-b border-white/10 bg-white/5">
                  <CardTitle className="flex items-center gap-2 text-xl font-light text-white">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    Competências Desenvolvidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {competencies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {competencies.slice(0, 9).map((comp, index) => (
                        <CompetencyCard key={comp.id || comp.name} {...comp} index={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma competência adicionada ainda. Adicione competências na aba "Competências".</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Projetos em Destaque */}
              {(completedProjects.length > 0 || activeProjects.length > 0) && (
                <Card className="border-b border-white/10 bg-transparent">
                  <CardHeader className="border-b border-white/10 bg-white/5">
                    <CardTitle className="flex items-center gap-2 text-xl font-light text-white">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Code className="h-5 w-5 text-primary" />
                      </div>
                      Projetos em Destaque
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {[...completedProjects.slice(0, 2), ...activeProjects.slice(0, 2)].map((project, index) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/5 p-5 hover:border-primary/20 transition-all duration-200"
                      >
                        <div className="relative">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-primary transition-colors truncate">{project.title}</h3>
                              {project.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                              )}
                            </div>
                            <div className={cn(
                              "ml-4 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                              project.status === 'completed' || project.progress === 100
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-primary/20 text-primary border border-primary/30"
                            )}>
                              {project.status === 'completed' || project.progress === 100 ? 'Concluído' : 'Em Progresso'}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 relative bg-white/10 h-2 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${project.progress}%` }}
                                transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                              />
                            </div>
                            <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-full">{project.progress}%</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Nível e Status */}
              <Card className="border-b border-white/10 bg-transparent">
                <CardHeader className="border-b border-white/10 bg-white/5">
                  <CardTitle className="flex items-center gap-2 text-lg font-light text-white">
                    <Trophy className="h-5 w-5 text-primary" />
                    Nível e Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="relative text-center p-8 border-b border-primary/20">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30" />
                    <div className="relative">
                      <div className="text-6xl font-bold text-primary mb-2 drop-shadow-lg">{level + 1}</div>
                      <div className="text-sm text-white font-semibold mb-1">{levelName} Nexus</div>
                      <div className="text-xs text-muted-foreground">Nível de Experiência</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-white">Sequência</span>
                      </div>
                      <span className="text-sm font-semibold text-white">-</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-white">Velocidade</span>
                      </div>
                      <span className="text-sm font-semibold text-white">-</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Links */}
              <Card className="border-b border-white/10 bg-transparent">
                <CardHeader className="border-b border-white/10 bg-white/5">
                  <CardTitle className="flex items-center gap-2 text-lg font-light text-white">
                    <Globe className="h-5 w-5 text-primary" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <a
                    href={`mailto:${user?.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all group"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm text-white flex-1 truncate">{user?.email}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                  </a>
                  <div className="flex gap-2">
                    {user?.github && (
                      <a
                        href={user.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all group"
                      >
                        <Github className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
                      </a>
                    )}
                    {user?.linkedin && (
                      <a
                        href={user.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all group"
                      >
                        <Linkedin className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
                      </a>
                    )}
                    {user?.twitter && (
                      <a
                        href={user.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all group"
                      >
                        <Twitter className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
                      </a>
                    )}
                    {(!user?.github && !user?.linkedin && !user?.twitter) && (
                      <p className="text-xs text-muted-foreground">Adicione links sociais nas configurações</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Competencies Tab */}
        <TabsContent value="competencies" className="space-y-6">
          {/* Manual Competencies Management */}
          <Card className="border-b border-white/10 bg-transparent">
            <CardHeader className="border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl font-light text-white">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  Competências Manuais
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCompetency(!showAddCompetency)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {showAddCompetency && (
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                  <Input
                    placeholder="Nome da competência"
                    value={newCompetency.name}
                    onChange={(e) => setNewCompetency({ ...newCompetency, name: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Força:</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newCompetency.strength}
                      onChange={(e) => setNewCompetency({ ...newCompetency, strength: parseInt(e.target.value) || 0 })}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <Input
                    placeholder="Descrição (opcional)"
                    value={newCompetency.description}
                    onChange={(e) => setNewCompetency({ ...newCompetency, description: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddCompetency} className="gap-2">
                      <Save className="h-4 w-4" />
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setShowAddCompetency(false);
                      setNewCompetency({ name: '', strength: 0, description: '' });
                    }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
              
              {manualCompetencies.length > 0 ? (
                <div className="space-y-3">
                  {manualCompetencies.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-4 rounded-lg border border-white/10 bg-white/5 hover:border-primary/30 transition-all"
                    >
                      {editingCompetency === comp.id ? (
                        <div className="space-y-3">
                          <Input
                            value={comp.name}
                            onChange={(e) => {
                              const updated = manualCompetencies.map(c => 
                                c.id === comp.id ? { ...c, name: e.target.value } : c
                              );
                              setManualCompetencies(updated);
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground">Força:</label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={comp.strength}
                              onChange={(e) => {
                                const updated = manualCompetencies.map(c => 
                                  c.id === comp.id ? { ...c, strength: parseInt(e.target.value) || 0 } : c
                                );
                                setManualCompetencies(updated);
                              }}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                          <Input
                            placeholder="Descrição (opcional)"
                            value={comp.description || ''}
                            onChange={(e) => {
                              const updated = manualCompetencies.map(c => 
                                c.id === comp.id ? { ...c, description: e.target.value } : c
                              );
                              setManualCompetencies(updated);
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const compData = manualCompetencies.find(c => c.id === comp.id);
                                if (compData) {
                                  handleUpdateCompetency(comp.id, {
                                    name: compData.name,
                                    strength: compData.strength,
                                    description: compData.description
                                  });
                                }
                              }}
                              className="gap-2"
                            >
                              <Save className="h-4 w-4" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCompetency(null);
                                // Reload to get original values
                                api.get('/user/competencies').then(response => {
                                  setManualCompetencies(response.data.competencies || []);
                                });
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-sm font-semibold text-white">{comp.name}</h3>
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{comp.strength}%</span>
                            </div>
                            <div className="relative w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2">
                              <div
                                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                                style={{ width: `${comp.strength}%` }}
                              />
                            </div>
                            {comp.description && (
                              <p className="text-xs text-muted-foreground">{comp.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingCompetency(comp.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCompetency(comp.id)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma competência manual adicionada. Clique em "Adicionar" para criar uma.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeProjects.length > 0 && (
              <Card className="border-b border-white/10 bg-transparent">
                <CardHeader className="border-b border-white/10 bg-white/5">
                  <CardTitle className="flex items-center gap-2 text-lg font-light text-white">
                    <Rocket className="h-5 w-5 text-primary" />
                    Em Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {activeProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/5 p-5 hover:border-primary/20 transition-all duration-200"
                    >
                      <div className="relative">
                        <h3 className="text-base font-semibold text-white mb-2 group-hover:text-primary transition-colors">{project.title}</h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 relative bg-white/10 h-2 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${project.progress}%` }}
                              transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                              className="absolute inset-y-0 left-0 bg-primary rounded-full"
                            />
                          </div>
                          <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-full">{project.progress}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            {completedProjects.length > 0 && (
              <Card className="border-b border-white/10 bg-transparent">
                <CardHeader className="border-b border-white/10 bg-white/5">
                  <CardTitle className="flex items-center gap-2 text-lg font-light text-white">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Concluídos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {completedProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative border-b border-white/10 p-5 hover:border-primary transition-all duration-300"
                    >
                      <div className="relative">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-base font-semibold text-white group-hover:text-green-400 transition-colors">{project.title}</h3>
                          {project.repository && (
                            <a
                              href={project.repository}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                              <LinkIcon className="h-4 w-4 text-primary" />
                            </a>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                        )}
                        {project.technologies && (
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(project.technologies) ? project.technologies : [project.technologies]).map((tech, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 rounded-lg bg-primary/10 text-xs text-primary border border-primary/20"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {activeProjects.length === 0 && completedProjects.length === 0 && (
            <Card className="border-b border-white/10 bg-transparent">
              <CardContent className="text-center py-12">
                <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}