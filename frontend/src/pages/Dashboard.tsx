import { useMemo, useState, useEffect } from 'react';
import { useCourse } from '../contexts/CourseContext';
import { trackDashboardVisit } from '../lib/activityTracker';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import {
  BookOpen,
  Clock,
  GraduationCap,
  ArrowUpRight,
  CheckCircle,
  Sparkles,
  Compass,
  PenTool,
  Play,
  Target,
  Zap,
  Activity,
  X,
  Lightbulb,
  Rocket,
  Plus,
  Edit,
  Trash2,
  Save
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../components/ui/skeleton';
import { ContextualHelp } from '../components/help/ContextualHelp';
import api from '../lib/api';
import { useToast } from '../components/feedback/ToastSystem';
import { useAchievementChecker } from '../hooks/useAchievementChecker';
import { CreateCourseModal } from '../components/courses/CreateCourseModal';

const SolidProgressBar = ({ value }: { value: number }) => {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden relative">
      <div 
        className="h-full bg-[#780606] rounded-full transition-all duration-300 ease-out"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
};

const FocusBar = ({ value }: { value: number }) => {
  const safeValue = Math.max(5, Math.min(100, value));
  return (
    <svg viewBox="0 0 12 100" className="h-20 w-8">
      <rect width="12" height="100" rx="6" fill="rgba(255,255,255,0.06)" />
      <rect
        width="12"
        height={safeValue}
        y={100 - safeValue}
        rx="6"
        fill="#780606"
      />
    </svg>
  );
};

const QUICK_SHORTCUTS = [
  {
    title: 'Plano de Curso',
    description: 'Reorganize sua grade',
    icon: GraduationCap,
    href: '/curriculum',
    accent: 'from-[#780606]/30 via-transparent to-transparent'
  },
  {
    title: 'Revisão Express',
    description: 'Flashcards pendentes',
    icon: BookOpen,
    href: '/spaced-repetition',
    accent: 'from-blue-500/30 via-transparent to-transparent'
  },
  {
    title: 'Projetos Ativos',
    description: 'Progresso e tarefas',
    icon: PenTool,
    href: '/projects',
    accent: 'from-amber-500/30 via-transparent to-transparent'
  },
  {
    title: 'Biblioteca Viva',
    description: 'Novos insumos',
    icon: Compass,
    href: '/library',
    accent: 'from-emerald-500/30 via-transparent to-transparent'
  }
] as const;

const DAY_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'] as const;

export default function Dashboard() {
  const { courseData, currentCourse, loading, refreshCourseData, updateCourse } = useCourse();
  const { success, error: showError } = useToast();
  const { checkAfterAction } = useAchievementChecker();
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  
  // Track dashboard visit for achievements
  useEffect(() => {
    trackDashboardVisit();
    // Verificar conquistas após visitar o dashboard
    setTimeout(() => {
      checkAfterAction('dashboard_visit');
    }, 500);
  }, [checkAfterAction]);
  
  const [showWelcome, setShowWelcome] = useState(() => {
    // Initialize welcome state based on localStorage
    const hasSeenWelcome = localStorage.getItem('hasSeenDashboardWelcome');
    const initialSetupCompleted = localStorage.getItem('initialSetupCompleted');
    return !hasSeenWelcome && !!initialSetupCompleted;
  });
  const [dismissedWelcome, setDismissedWelcome] = useState(false);
  const [isEditingCourseTitle, setIsEditingCourseTitle] = useState(false);
  const [courseTitleValue, setCourseTitleValue] = useState('');
  
  // CRUD States
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingProject, setEditingProject] = useState<{ id: string; title: string; description?: string; type: string; deadline?: string } | null>(null);
  const [editingModule, setEditingModule] = useState<{ id: string; progress: number; status: string } | null>(null);
  const [editingFlashcard, setEditingFlashcard] = useState<{ id: string; front: string; back: string; deck?: string } | null>(null);
  const [editingActivity, setEditingActivity] = useState<{ id: string; title: string; type: string; day: string } | null>(null);
  
  // Form states
  const [projectForm, setProjectForm] = useState({ title: '', description: '', type: 'Dev', deadline: '' });
  const [moduleForm, setModuleForm] = useState({ progress: 0, status: 'active' });
  const [flashcardForm, setFlashcardForm] = useState({ front: '', back: '', deck: 'default' });
  const [activityForm, setActivityForm] = useState({ title: '', type: 'Leitura', day: 'SEG' });
  const [weeklyActivities, setWeeklyActivities] = useState<Array<{ id: string; title: string; type: string; day: string; time?: string; createdAt: string }>>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [weeklyFocusData, setWeeklyFocusData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loadingFocusData, setLoadingFocusData] = useState(false);

  useEffect(() => {
    // Update welcome state when courseData becomes available
    if (showWelcome && courseData) {
      // State is already set in useState initializer, no need to set again
    }
  }, [courseData, showWelcome]);

  const fetchWeeklyActivities = async () => {
    setLoadingActivities(true);
    try {
      // Calculate current week start (Monday)
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(today.setDate(diff));
      weekStart.setHours(0, 0, 0, 0);

      const response = await api.get('/weekly-schedule', {
        params: { weekStart: weekStart.toISOString() },
      });
      const schedules = response.data || [];
      // Map schedules to weekly format and limit to 5
      const mapped = schedules.slice(0, 5).map((schedule: { id: string; title: string; type: string; day: string; time?: string }) => ({
        id: schedule.id,
        title: schedule.title,
        type: schedule.type,
        day: schedule.day,
        time: schedule.time || undefined,
        createdAt: new Date().toISOString()
      }));
      setWeeklyActivities(mapped);
    } catch {
      setWeeklyActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (courseData) {
      fetchWeeklyActivities();
      fetchWeeklyFocusData();
    }
  }, [courseData]);


  const getActivityColor = (type: string): string => {
    const colors: Record<string, string> = {
      'Leitura': 'text-blue-400',
      'Sprint': 'text-[#780606]',
      'Estudo': 'text-green-400',
      'Projeto': 'text-purple-400'
    };
    return colors[type] || 'text-muted-foreground';
  };

  const getActivityBarColor = (type: string): string => {
    const colors: Record<string, string> = {
      'Leitura': 'bg-blue-500/50',
      'Sprint': 'bg-[#780606]/50',
      'Estudo': 'bg-green-500/50',
      'Projeto': 'bg-purple-500/50'
    };
    return colors[type] || 'bg-white/20';
  };

  const fetchWeeklyFocusData = async () => {
    setLoadingFocusData(true);
    try {
      const response = await api.get('/timer/history');
      const sessions = response.data || [];
      
      // Get sessions from the last 7 days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentSessions = sessions.filter((session: { createdAt: string; duration: number }) => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate >= sevenDaysAgo;
      });

      // Group sessions by day of week (0 = Sunday, 1 = Monday, etc.)
      const dailyMinutes: number[] = [0, 0, 0, 0, 0, 0, 0];
      
      recentSessions.forEach((session: { createdAt: string; duration: number }) => {
        const sessionDate = new Date(session.createdAt);
        const dayOfWeek = sessionDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        dailyMinutes[dayOfWeek] += session.duration || 0;
      });

      // Calculate focus percentage (assuming 4 hours = 100% focus for a day)
      // Max 240 minutes (4 hours) = 100%
      const maxMinutesPerDay = 240;
      const focusPercentages = dailyMinutes.map(minutes => {
        const percentage = Math.min(100, Math.round((minutes / maxMinutesPerDay) * 100));
        // Ensure minimum of 5% for visual representation if there's any activity
        return minutes > 0 ? Math.max(5, percentage) : 0;
      });

      setWeeklyFocusData(focusPercentages);
    } catch {
      setWeeklyFocusData([0, 0, 0, 0, 0, 0, 0]);
    } finally {
      setLoadingFocusData(false);
    }
  };

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    setDismissedWelcome(true);
    localStorage.setItem('hasSeenDashboardWelcome', 'true');
  };

  const isNewUser = useMemo(() => {
    const stats = courseData.stats;
    return stats.progress === 0 && stats.hoursStudied === 0 && stats.booksRead === 0;
  }, [courseData]);

  const activeProject = useMemo(() => {
    return courseData.projects.find((p) => p.status === 'em_progresso' && p.priority) || null;
  }, [courseData]);

  const stats = courseData.stats;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
        </div>
      </div>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={showCreateCourseModal}
        onClose={() => setShowCreateCourseModal(false)}
      />
    </div>
  );
}
  const highlightedModules = courseData.curriculum
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);

  // CRUD Functions
  const handleCreateProject = async () => {
    try {
      await api.post('/projects', projectForm);
      
      // Verificar conquistas automaticamente
      await checkAfterAction('project_created');
      
      await refreshCourseData();
      success('Projeto criado com sucesso!');
      setShowProjectModal(false);
      setProjectForm({ title: '', description: '', type: 'Dev', deadline: '' });
    } catch {
      showError('Erro ao criar projeto');
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    try {
      await api.put(`/projects/${editingProject.id}`, projectForm);
      success('Projeto atualizado!');
      setShowProjectModal(false);
      setEditingProject(null);
      setProjectForm({ title: '', description: '', type: 'Dev', deadline: '' });
      await refreshCourseData();
    } catch {
      showError('Erro ao atualizar projeto');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este projeto?')) return;
    try {
      await api.delete(`/projects/${id}`);
      success('Projeto deletado!');
      await refreshCourseData();
    } catch {
      showError('Erro ao deletar projeto');
    }
  };

  const handleUpdateModule = async () => {
    if (!editingModule) return;
    try {
      await api.put(`/curriculum/${editingModule.id}`, moduleForm);
      success('Módulo atualizado!');
      setShowModuleModal(false);
      setEditingModule(null);
      setModuleForm({ progress: 0, status: 'active' });
      await refreshCourseData();
    } catch {
      showError('Erro ao atualizar módulo');
    }
  };

  const handleCreateFlashcard = async () => {
    try {
      await api.post('/flashcards', flashcardForm);
      
      // Verificar conquistas automaticamente
      await checkAfterAction('flashcard_created');
      
      success('Flashcard criado!');
      setShowFlashcardModal(false);
      setFlashcardForm({ front: '', back: '', deck: 'default' });
      await refreshCourseData();
    } catch {
      showError('Erro ao criar flashcard');
    }
  };

  const handleUpdateFlashcard = async () => {
    if (!editingFlashcard) return;
    try {
      await api.put(`/flashcards/${editingFlashcard.id}`, flashcardForm);
      success('Flashcard atualizado!');
      setShowFlashcardModal(false);
      setEditingFlashcard(null);
      setFlashcardForm({ front: '', back: '', deck: 'default' });
      await refreshCourseData();
    } catch {
      showError('Erro ao atualizar flashcard');
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este flashcard?')) return;
    try {
      await api.delete(`/flashcards/${id}`);
      success('Flashcard deletado!');
      await refreshCourseData();
    } catch {
      showError('Erro ao deletar flashcard');
    }
  };

  const handleCreateActivity = async () => {
    try {
      await api.post('/activities', activityForm);
      success('Atividade criada!');
      setShowActivityModal(false);
      setActivityForm({ title: '', type: 'Leitura', day: 'SEG' });
      await refreshCourseData();
      await fetchWeeklyActivities();
      await fetchWeeklyFocusData();
    } catch {
      showError('Erro ao criar atividade');
    }
  };

  const handleUpdateActivity = async () => {
    if (!editingActivity) return;
    try {
      await api.put(`/activities/${editingActivity.id}`, activityForm);
      success('Atividade atualizada!');
      setShowActivityModal(false);
      setEditingActivity(null);
      setActivityForm({ title: '', type: 'Leitura', day: 'SEG' });
      await refreshCourseData();
      await fetchWeeklyActivities();
      await fetchWeeklyFocusData();
    } catch {
      showError('Erro ao atualizar atividade');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta atividade?')) return;
    try {
      await api.delete(`/activities/${id}`);
      success('Atividade deletada!');
      await refreshCourseData();
      await fetchWeeklyActivities();
      await fetchWeeklyFocusData();
    } catch {
      showError('Erro ao deletar atividade');
    }
  };

  const openEditProject = (project: { id: string; title: string; description?: string; type: string; deadline?: string }) => {
    setEditingProject(project);
    setProjectForm({ title: project.title, description: project.description || '', type: project.type, deadline: project.deadline || '' });
    setShowProjectModal(true);
  };

  const openEditModule = (module: { id: string; progress: number; status: string }) => {
    setEditingModule(module);
    setModuleForm({ progress: module.progress, status: module.status });
    setShowModuleModal(true);
  };

  const handleStartEditCourseTitle = () => {
    const currentTitle = getDisplayCourseTitle();
    setCourseTitleValue(currentTitle);
    setIsEditingCourseTitle(true);
  };

  const handleSaveCourseTitle = async () => {
    const trimmedValue = courseTitleValue.trim();
    if (!trimmedValue) {
      showError('O título não pode estar vazio');
      return;
    }

    if (!currentCourse) {
      showError('Nenhum curso selecionado');
      return;
    }

    try {
      // Update course via API
      await updateCourse(currentCourse.id, trimmedValue);
      localStorage.setItem('customCourseTitle', trimmedValue);
      setIsEditingCourseTitle(false);
      setCourseTitleValue('');
      success('Título do curso atualizado!');
      await refreshCourseData();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && 
        typeof error.response === 'object' && error.response !== null && 'data' in error.response &&
        typeof error.response.data === 'object' && error.response.data !== null && 'error' in error.response.data
        ? String(error.response.data.error)
        : 'Erro ao salvar título do curso';
      showError(errorMessage);
    }
  };

  const handleCancelEditCourseTitle = () => {
    setIsEditingCourseTitle(false);
    setCourseTitleValue('');
  };

  const getDisplayCourseTitle = () => {
    // Use real course name from context
    if (currentCourse) {
      return currentCourse.title;
    }
    // Fallback to localStorage if no course yet
    return localStorage.getItem('customCourseTitle') || 'Seu Curso';
  };

  return (
    <div className="cv-section grid grid-cols-1 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 w-full max-w-full overflow-x-hidden">
      {/* Left Column - Main Content */}
      <div className="lg:col-span-2 space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-6 min-w-0 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-end">
          <ContextualHelp section="dashboard" />
        </div>
        {/* Welcome Message for New Users */}
        {showWelcome && !dismissedWelcome && (
          <Card className="relative overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl">
            <div className="absolute right-0 top-0 h-32 w-32 opacity-[0.05] pointer-events-none">
              <Rocket className="h-full w-full" />
            </div>
            <CardContent className="p-4 sm:p-6 relative">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <h3 className="text-base sm:text-lg font-semibold text-white">Bem-vindo ao UATI Nexus!</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                    Sua jornada de aprendizado autodidata começa aqui. Explore o Dashboard para ver seu progresso, 
                    acesse a Biblioteca para adicionar recursos, e comece seus primeiros projetos práticos.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/30 hover:bg-primary/10 hover:text-primary transition-none text-xs sm:text-sm"
                      asChild
                    >
                      <Link to="/curriculum" className="flex items-center">
                        <span className="hidden sm:inline">Ver Grade Curricular</span>
                        <span className="sm:hidden">Grade</span>
                        <ArrowUpRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/30 hover:bg-primary/10 hover:text-primary transition-none text-xs sm:text-sm"
                      asChild
                    >
                      <Link to="/library" className="flex items-center">
                        <span className="hidden sm:inline">Explorar Biblioteca</span>
                        <span className="sm:hidden">Biblioteca</span>
                        <ArrowUpRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleDismissWelcome}
                  className="text-muted-foreground hover:text-white flex-shrink-0 touch-manipulation"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                  aria-label="Fechar mensagem de boas-vindas"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Start Guide for New Users */}
        {isNewUser && !showWelcome && (
          <Card className="border border-white/5 bg-card rounded-xl">
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                    Guia Rápido
                  </p>
                  <p className="text-xs sm:text-sm text-white/80 truncate">Comece sua jornada em 3 passos</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 xs:px-4 sm:px-6 pb-3 xs:pb-4 sm:pb-6 pt-0">
              <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 xs:gap-3 sm:gap-4 p-2.5 xs:p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex h-7 w-7 xs:h-7 xs:w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs sm:text-sm flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs xs:text-xs sm:text-sm font-semibold text-white mb-1">Explore sua Grade Curricular</h4>
                    <p className="text-[10px] xs:text-[11px] sm:text-xs text-muted-foreground mb-2 leading-relaxed">
                      Veja os módulos do seu curso e entenda o caminho de aprendizado.
                    </p>
                    <Button variant="outline" size="sm" className="h-8 xs:h-9 text-xs transition-none touch-manipulation" asChild>
                      <Link to="/curriculum">Ver Grade</Link>
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-2 xs:gap-3 sm:gap-4 p-2.5 xs:p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs sm:text-sm flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">Adicione Recursos à Biblioteca</h4>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-2">
                      Organize livros, artigos e vídeos que você vai estudar.
                    </p>
                    <Button variant="outline" size="sm" className="h-7 text-xs transition-none touch-manipulation" asChild>
                      <Link to="/library">Adicionar Recurso</Link>
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs sm:text-sm flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">Crie seu Primeiro Projeto</h4>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-2">
                      Aplique o que aprendeu em um projeto prático (PoW).
                    </p>
                    <Button variant="outline" size="sm" className="h-7 text-xs transition-none touch-manipulation" asChild>
                      <Link to="/projects">Novo Projeto</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Course Overview */}
        <Card className="relative overflow-hidden border border-white/5 bg-card rounded-xl group">
          <div className="absolute right-0 top-0 h-64 w-64 opacity-[0.02] pointer-events-none">
            <GraduationCap className="h-full w-full" />
          </div>
          <CardHeader className="p-4 sm:p-6 lg:p-8 pb-4 sm:pb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-[#780606]">Visão Geral do Semestre</p>
            </div>
            {/* Major title removed - no longer part of CourseData */}
            <div className="flex items-start gap-3 mb-4">
              {isEditingCourseTitle ? (
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <Input
                    value={courseTitleValue}
                    onChange={(e) => setCourseTitleValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveCourseTitle();
                      } else if (e.key === 'Escape') {
                        handleCancelEditCourseTitle();
                      }
                    }}
                    className="text-2xl sm:text-3xl lg:text-5xl font-serif font-light leading-tight tracking-tight text-white bg-white/5 border-white/10 h-auto py-2 flex-1 min-w-0"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveCourseTitle}
                    className="bg-[#780606] hover:bg-[#780606]/90 flex-shrink-0"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEditCourseTitle}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl lg:text-5xl font-serif font-light leading-tight tracking-tight text-white flex-1 min-w-0 break-words">
                    {getDisplayCourseTitle()}
                  </h2>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {currentCourse ? (
                      <button
                        onClick={handleStartEditCourseTitle}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors touch-manipulation"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                        title="Editar título do curso"
                        aria-label="Editar título do curso"
                      >
                        <Edit className="h-5 w-5 text-muted-foreground hover:text-white" />
                      </button>
                    ) : (
                      <Button
                        onClick={() => setShowCreateCourseModal(true)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden xs:inline">Criar Curso</span>
                        <span className="xs:hidden">Criar</span>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
            <p className="text-muted-foreground max-w-lg text-xs sm:text-sm leading-relaxed font-light">
              Continue seu progresso no módulo atual. A constância é a chave para o domínio autodidata.
            </p>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 pt-0 flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
            <Button 
              variant="default" 
              className="bg-[#780606] hover:bg-[#780606]/90 text-white font-medium shadow-[0_0_20px_#7806064D] rounded-lg px-4 py-3 sm:px-8 sm:py-6 transition-none text-sm sm:text-base" 
              asChild
            >
              <Link to="/curriculum" className="flex items-center justify-center">
                <span className="hidden xs:inline">VER GRADE</span>
                <span className="xs:hidden">GRADE</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#780606]/40 hover:text-white rounded-lg px-4 py-3 sm:px-8 sm:py-6 transition-none text-sm sm:text-base" 
              asChild
            >
              <Link to="/settings">
                <span className="hidden sm:inline">ALTERAR CURSO</span>
                <span className="sm:hidden">ALTERAR</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Shortcuts */}
        <Card className="bg-card border border-white/5 rounded-xl">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                  Atalhos Rápidos
                </p>
                <p className="text-xs sm:text-sm text-white/80 truncate">Acesse áreas críticas em um clique</p>
              </div>
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#780606] flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {QUICK_SHORTCUTS.map((action) => (
                <Link
                  key={action.title}
                  to={action.href}
                  className="group relative rounded-2xl border border-white/5 bg-white/[0.01] p-3 sm:p-4 touch-manipulation"
                  style={{ minHeight: '44px' }}
                >
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 ${action.accent}`}
                  />
                  <div className="relative flex flex-col gap-2 sm:gap-3">
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-white/5 bg-black/40 flex items-center justify-center text-white/80 group-hover:text-white flex-shrink-0">
                        <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-white flex-shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-white truncate">{action.title}</p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-2">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 xs:gap-2.5 sm:gap-3 md:gap-4">
          {/* Progress Card */}
          <Card density="compact" className="bg-card border border-white/5 rounded-xl group">
            <CardContent className="flex flex-col items-center justify-center p-2.5 xs:p-3 sm:p-4 md:p-6 h-full min-h-[100px] xs:min-h-[120px] sm:min-h-[140px] md:min-h-[160px]">
              <div className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-[#780606]/10 flex items-center justify-center mb-2 xs:mb-2.5 sm:mb-3 md:mb-5">
                <CheckCircle className="h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#780606] stroke-[1.5]" />
              </div>
              <p className="text-xl xs:text-2xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 xs:mb-1 sm:mb-1 md:mb-2">{stats.progress}%</p>
              <p className="text-[7px] xs:text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.15em] xs:tracking-[0.2em] text-muted-foreground text-center leading-tight">Conclusão</p>
            </CardContent>
          </Card>

          {/* Hours Card */}
          <Card density="compact" className="bg-card border border-white/5 rounded-xl group">
            <CardContent className="flex flex-col items-center justify-center p-2.5 xs:p-3 sm:p-4 md:p-6 h-full min-h-[100px] xs:min-h-[120px] sm:min-h-[140px] md:min-h-[160px]">
              <div className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-[#780606]/10 flex items-center justify-center mb-2 xs:mb-2.5 sm:mb-3 md:mb-5">
                <Clock className="h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#780606] stroke-[1.5]" />
              </div>
              <p className="text-xl xs:text-2xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 xs:mb-1 sm:mb-1 md:mb-2">{stats.hoursStudied.toFixed(1)}h</p>
              <p className="text-[7px] xs:text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.15em] xs:tracking-[0.2em] text-muted-foreground text-center leading-tight">Horas</p>
            </CardContent>
          </Card>

          {/* Books Card */}
          <Card density="compact" className="bg-card border border-white/5 rounded-xl group">
            <CardContent className="flex flex-col items-center justify-center p-2.5 xs:p-3 sm:p-4 md:p-6 h-full min-h-[100px] xs:min-h-[120px] sm:min-h-[140px] md:min-h-[160px]">
              <div className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-[#780606]/10 flex items-center justify-center mb-2 xs:mb-2.5 sm:mb-3 md:mb-5">
                <BookOpen className="h-4 w-4 xs:h-4.5 xs:w-4.5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#780606] stroke-[1.5]" />
              </div>
              <p className="text-xl xs:text-2xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 xs:mb-1 sm:mb-1 md:mb-2">{stats.booksRead}</p>
              <p className="text-[7px] xs:text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.15em] xs:tracking-[0.2em] text-muted-foreground text-center leading-tight">Livros</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Project & Study Momentum */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <Card className="bg-card border border-white/5 rounded-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1 sm:mb-2">
                    Projeto Ativo
                  </p>
                  <p className="text-base sm:text-lg font-bold text-white truncate">
                    {activeProject?.title || 'Nenhum projeto ativo'}
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 ml-2 sm:ml-3 flex-shrink-0">
                  {activeProject?.priority && (
                    <span className="inline-flex items-center rounded-full border border-[#780606]/20 bg-[#780606]/10 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-[#780606] uppercase tracking-[0.2em]">
                      <span className="hidden sm:inline">Prioridade</span>
                      <span className="sm:hidden">PRI</span>
                    </span>
                  )}
                  {activeProject && (
                    <>
                      <button onClick={() => openEditProject({ ...activeProject, deadline: activeProject.deadline || undefined })} className="p-1.5 rounded hover:bg-white/5 transition-colors touch-manipulation" style={{ minWidth: '44px', minHeight: '44px' }} title="Editar projeto" aria-label="Editar projeto">
                        <Edit className="h-4 w-4 text-muted-foreground hover:text-white" />
                      </button>
                      <button onClick={() => handleDeleteProject(activeProject.id)} className="p-1.5 rounded hover:bg-white/5 transition-colors touch-manipulation" style={{ minWidth: '44px', minHeight: '44px' }} title="Deletar projeto" aria-label="Deletar projeto">
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-400" />
                      </button>
                    </>
                  )}
                  <button onClick={() => { setEditingProject(null); setProjectForm({ title: '', description: '', type: 'Dev', deadline: '' }); setShowProjectModal(true); }} className="p-1.5 rounded hover:bg-white/5 transition-colors touch-manipulation" style={{ minWidth: '44px', minHeight: '44px' }} title="Novo projeto" aria-label="Novo projeto">
                    <Plus className="h-4 w-4 text-muted-foreground hover:text-[#780606]" />
                  </button>
                </div>
              </div>
              
              {activeProject && (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso</span>
                    <span className="font-semibold text-white">{activeProject.progress}%</span>
                  </div>
                  <SolidProgressBar value={activeProject.progress} />
                </div>
              )}

              {activeProject?.tasks?.length ? (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">Sprint atual</p>
                  <ul className="space-y-2">
                    {activeProject.tasks.slice(0, 3).map((task) => (
                      <li key={task.id} className="flex items-center gap-2.5 text-sm text-white/90">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#780606] flex-shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : activeProject ? (
                <p className="text-xs text-muted-foreground pt-2 border-t border-white/5">Nenhuma tarefa associada.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-card border border-white/5 rounded-xl">
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                    Ritmo Visual
                  </p>
                  <p className="text-base sm:text-lg font-light text-white truncate">Mapa de Foco semanal</p>
                </div>
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-[#780606] flex-shrink-0 ml-2" />
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {loadingFocusData ? (
                  <div className="col-span-7 text-center text-xs sm:text-sm text-muted-foreground">Carregando dados de foco...</div>
                ) : (
                  weeklyFocusData.map((value, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 sm:gap-2">
                      <FocusBar value={value} />
                      <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                        {DAY_LABELS[idx]}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Os blocos mostram consistência diária. Mantenha-se acima de 70% para preservar o streak.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column - Sidebar Widgets */}
      <div className="space-y-6 min-w-0 max-w-full overflow-x-hidden">
        {/* Flashcards Widget */}
        <Card className="bg-card border border-white/5 rounded-xl relative overflow-hidden group">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Flashcards</p>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-[#780606]"></div>
                <button onClick={() => { setEditingFlashcard(null); setFlashcardForm({ front: '', back: '', deck: 'default' }); setShowFlashcardModal(true); }} className="p-1 rounded hover:bg-white/5 touch-manipulation" style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Novo flashcard" aria-label="Novo flashcard">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
            <div className="mb-6 sm:mb-8 mt-2">
              <p className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2 leading-none tracking-tight">{stats.flashcardsDue}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Cartas acumuladas para revisão</p>
            </div>
            <Button
              variant="outline"
              className="w-full border border-white/10 bg-white/[0.02] rounded-lg py-4 sm:py-6 text-xs sm:text-sm font-medium transition-none touch-manipulation"
              style={{ minHeight: '44px' }}
              asChild
            >
              <Link to="/spaced-repetition" className="flex items-center justify-center gap-2">
                <span className="hidden sm:inline">INICIAR SESSÃO</span>
                <span className="sm:hidden">INICIAR</span>
                <Play className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Modules Focus */}
        <Card className="bg-card border border-white/5 rounded-xl">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Módulos em Foco</p>
                <p className="text-xs sm:text-sm text-white/80 truncate">Próximos passos do plano</p>
              </div>
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-[#780606] flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 space-y-2 sm:space-y-3">
            {highlightedModules.map((module) => (
              <div key={module.id} className="group flex items-center gap-2 sm:gap-3 lg:gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:p-4 hover:bg-white/[0.04] touch-manipulation">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border border-white/10 bg-black/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] sm:text-xs font-mono tracking-[0.2em] text-muted-foreground break-words leading-tight text-center px-1">
                    {module.code}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-white line-clamp-2 break-words">{module.title}</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[0.2em] truncate">{module.status}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base sm:text-lg font-bold text-white">{module.progress}%</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] hidden sm:block">andamento</p>
                </div>
                <button onClick={() => openEditModule(module)} className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-1.5 rounded hover:bg-white/5 transition-opacity touch-manipulation flex-shrink-0" style={{ minWidth: '44px', minHeight: '44px' }} title="Editar módulo" aria-label="Editar módulo">
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))}
            {!highlightedModules.length && (
              <p className="text-sm text-muted-foreground">Nenhum módulo disponível.</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Planner Widget */}
        <Card className="bg-card border border-white/5 rounded-xl">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground truncate">Planner Semanal</p>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <Link
                  to="/weekly-planner"
                  className="p-1 rounded hover:bg-white/5 touch-manipulation"
                  style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Novo planejamento"
                  aria-label="Novo planejamento"
                >
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
                <Link
                  to="/weekly-planner"
                  className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] text-[#780606] hover:text-[#780606]/80 uppercase tracking-wider touch-manipulation"
                >
                  <Zap className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                  <span className="hidden sm:inline">Ver tudo</span>
                  <span className="sm:hidden">Ver</span>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 space-y-2 sm:space-y-3">
            {loadingActivities ? (
              <p className="text-sm text-muted-foreground">Carregando atividades...</p>
            ) : weeklyActivities.length > 0 ? (
              weeklyActivities.map((activity) => (
                <div key={activity.id} className="group flex items-center gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5 touch-manipulation">
                  <div className="flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black/40 border border-white/10 shrink-0">
                    <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground">{activity.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[9px] sm:text-[10px] ${getActivityColor(activity.type)} font-mono mb-0.5 uppercase tracking-wider`}>{activity.type}</p>
                    <p className="text-xs sm:text-sm font-medium text-white truncate">{activity.title}</p>
                    {activity.time && (
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
                    )}
                  </div>
                  <div className={`w-1 h-6 sm:h-8 rounded-full ${getActivityBarColor(activity.type)} shrink-0`}></div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum planejamento semanal.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CRUD Modals */}
      {/* Project Modal */}
      <Modal isOpen={showProjectModal} onClose={() => { setShowProjectModal(false); setEditingProject(null); }} title={editingProject ? 'Editar Projeto' : 'Novo Projeto'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Título</label>
            <Input value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} placeholder="Nome do projeto" />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Descrição</label>
            <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" rows={3} placeholder="Descrição do projeto" />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Tipo</label>
            <select value={projectForm.type} onChange={(e) => setProjectForm({ ...projectForm, type: e.target.value })} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" aria-label="Tipo do projeto">
              <option value="Dev">Dev</option>
              <option value="Design">Design</option>
              <option value="Research">Research</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Prazo</label>
            <Input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowProjectModal(false); setEditingProject(null); }}>Cancelar</Button>
            <Button onClick={editingProject ? handleUpdateProject : handleCreateProject}>
              <Save className="mr-2 h-4 w-4" />
              {editingProject ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Module Modal */}
      <Modal isOpen={showModuleModal} onClose={() => { setShowModuleModal(false); setEditingModule(null); }} title="Editar Módulo" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Progresso (%)</label>
            <Input type="number" min="0" max="100" value={moduleForm.progress} onChange={(e) => setModuleForm({ ...moduleForm, progress: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Status</label>
            <select value={moduleForm.status} onChange={(e) => setModuleForm({ ...moduleForm, status: e.target.value })} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" aria-label="Status do módulo">
              <option value="locked">Bloqueado</option>
              <option value="active">Ativo</option>
              <option value="completed">Concluído</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowModuleModal(false); setEditingModule(null); }}>Cancelar</Button>
            <Button onClick={handleUpdateModule}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Flashcard Modal */}
      <Modal isOpen={showFlashcardModal} onClose={() => { setShowFlashcardModal(false); setEditingFlashcard(null); }} title={editingFlashcard ? 'Editar Flashcard' : 'Novo Flashcard'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Frente</label>
            <textarea value={flashcardForm.front} onChange={(e) => setFlashcardForm({ ...flashcardForm, front: e.target.value })} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" rows={3} placeholder="Frente do flashcard" />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Verso</label>
            <textarea value={flashcardForm.back} onChange={(e) => setFlashcardForm({ ...flashcardForm, back: e.target.value })} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" rows={3} placeholder="Verso do flashcard" />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Deck</label>
            <Input value={flashcardForm.deck} onChange={(e) => setFlashcardForm({ ...flashcardForm, deck: e.target.value })} placeholder="Nome do deck" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowFlashcardModal(false); setEditingFlashcard(null); }}>Cancelar</Button>
            {editingFlashcard && (
              <Button variant="outline" onClick={() => handleDeleteFlashcard(editingFlashcard.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </Button>
            )}
            <Button onClick={editingFlashcard ? handleUpdateFlashcard : handleCreateFlashcard}>
              <Save className="mr-2 h-4 w-4" />
              {editingFlashcard ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Activity Modal */}
      <Modal isOpen={showActivityModal} onClose={() => { setShowActivityModal(false); setEditingActivity(null); }} title={editingActivity ? 'Editar Atividade' : 'Nova Atividade'} size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Título</label>
            <Input value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} placeholder="Nome da atividade" />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Tipo</label>
            <select value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" aria-label="Tipo de atividade">
              <option value="Leitura">Leitura</option>
              <option value="Sprint">Sprint</option>
              <option value="Estudo">Estudo</option>
              <option value="Projeto">Projeto</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Dia</label>
            <select value={activityForm.day} onChange={(e) => setActivityForm({ ...activityForm, day: e.target.value })} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" aria-label="Dia da semana">
              {DAY_LABELS.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowActivityModal(false); setEditingActivity(null); }}>Cancelar</Button>
            {editingActivity && (
              <Button variant="outline" onClick={() => handleDeleteActivity(editingActivity.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </Button>
            )}
            <Button onClick={editingActivity ? handleUpdateActivity : handleCreateActivity}>
              <Save className="mr-2 h-4 w-4" />
              {editingActivity ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={showCreateCourseModal}
        onClose={() => setShowCreateCourseModal(false)}
      />
    </div>
  );
}