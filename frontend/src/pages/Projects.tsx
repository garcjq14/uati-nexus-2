import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCourse } from '../contexts/CourseContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import {
  Folder,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  X,
  Save,
  LayoutGrid,
  List,
  Calendar,
  PenTool,
  Rocket,
  Target,
  Clock,
  Code,
  Sparkles,
  Edit,
  Trash2,
  Layers3,
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { EmptyState } from '../components/empty-states/EmptyState';
import { LoadingSkeleton } from '../components/feedback/LoadingStates';
import { KanbanBoard } from '../components/projects/KanbanBoard';
import { ProjectTimeline } from '../components/projects/ProjectTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ContextualHelp } from '../components/help/ContextualHelp';
import { useToast } from '../components/feedback/ToastSystem';
import { useAchievementChecker } from '../hooks/useAchievementChecker';

function ProgressBar({ progress }: { progress: number }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--width', `${progress}%`);
    }
  }, [progress]);

  return (
    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden relative">
      <div
        ref={barRef}
        className="h-full bg-[#780606] rounded-full progress-bar transition-all duration-300 ease-out"
      />
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const { courseData, loading, refreshCourseData } = useCourse();
  const { success, error: showError } = useToast();
  const { checkAfterAction } = useAchievementChecker();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'timeline'>('list');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isMovingTask, setIsMovingTask] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<(typeof projects)[0] | null>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    type: 'Dev',
    deadline: '',
    repository: '',
    technologies: '',
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { projects } = courseData;

  const filteredProjects = useMemo(() => {
    if (statusFilter === 'todos') return projects;
    return projects.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter]);

  const activeProject =
    (selectedProject && projects.find((p) => p.id === selectedProject)) ||
    projects.find((p) => p.status === 'em_progresso');

  const localTasks = useMemo(() => {
    return activeProject?.tasks || [];
  }, [activeProject]);

  const moveTask = async (taskId: string, newStatus: 'todo' | 'doing' | 'done') => {
    if (isMovingTask) return;
    setIsMovingTask(taskId);
    try {
      await api.put(`/projects/tasks/${taskId}`, { status: newStatus });
      await refreshCourseData();
      success('Tarefa movida com sucesso!');
    } catch (error) {
      console.error('Failed to move task:', error);
      showError('Erro ao mover tarefa. Tente novamente.');
    } finally {
      setIsMovingTask(null);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await api.delete(`/projects/tasks/${taskId}`);
      await refreshCourseData();
      success('Tarefa deletada com sucesso!');
    } catch (error) {
      console.error('Failed to delete task:', error);
      showError('Erro ao deletar tarefa. Tente novamente.');
    }
  };

  const todoTasks = localTasks.filter((t) => t.status === 'todo');
  const doingTasks = localTasks.filter((t) => t.status === 'doing');
  const doneTasks = localTasks.filter((t) => t.status === 'done');

  const stats = useMemo(() => {
    const total = projects.length;
    const emProgresso = projects.filter((p) => p.status === 'em_progresso').length;
    const finalizados = projects.filter((p) => p.status === 'finalizado').length;
    const avgProgress =
      emProgresso > 0
        ? Math.round(
            projects
              .filter((p) => p.status === 'em_progresso')
              .reduce((acc, p) => acc + (p.progress || 0), 0) / emProgresso
          )
        : 0;

    return { total, emProgresso, finalizados, avgProgress };
  }, [projects]);

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      showError('Título é obrigatório');
      return;
    }
    setIsCreatingProject(true);
    try {
      const technologies = newProject.technologies
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload: any = {
        title: newProject.title.trim(),
        description: newProject.description.trim() || null,
        type: newProject.type || 'Dev',
        deadline: newProject.deadline || null,
        repository: newProject.repository.trim() || null,
        technologies: technologies.length > 0 ? JSON.stringify(technologies) : '[]',
        status: 'em_progresso',
        progress: 0,
      };

      // Remove null values for optional fields to avoid issues
      if (!payload.description) delete payload.description;
      if (!payload.deadline) delete payload.deadline;
      if (!payload.repository) delete payload.repository;

      const response = await api.post('/projects', payload);
      console.log('Project created:', response.data);

      // Verificar conquistas automaticamente
      await checkAfterAction('project_created');

      await refreshCourseData();
      
      setShowCreateProject(false);
      setNewProject({
        title: '',
        description: '',
        type: 'Dev',
        deadline: '',
        repository: '',
        technologies: '',
      });
      success('Projeto criado com sucesso!');
    } catch (error: any) {
      console.error('Failed to create project:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao criar projeto. Tente novamente.';
      showError(errorMessage);
    } finally {
      setIsCreatingProject(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton variant="grid" count={6} />;
  }

  if (!loading && projects.length === 0) {
    return (
      <>
        <div className="min-h-screen w-full space-y-8 px-4 py-8">
          <section className="rounded-3xl border border-white/10 bg-[#070708]/90 p-8">
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="h-16 w-16 rounded-full bg-[#780606]/10 flex items-center justify-center mb-6">
                <PenTool className="h-8 w-8 text-[#780606]" />
              </div>
              <h2 className="text-2xl font-serif font-light text-white mb-2">Nenhum projeto ainda</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Comece criando seu primeiro projeto prático (PoW) para aplicar o conhecimento que você está aprendendo.
              </p>
              <Button
                onClick={() => setShowCreateProject(true)}
                className="bg-[#780606] hover:bg-[#780606]/90 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Projeto
              </Button>
            </div>
          </section>
        </div>
        
        {/* Create Project Modal - rendered even when no projects */}
        <Modal
          isOpen={showCreateProject}
          onClose={() => {
            setShowCreateProject(false);
            setNewProject({
              title: '',
              description: '',
              type: 'Dev',
              deadline: '',
              repository: '',
              technologies: '',
            });
          }}
          title="Novo Projeto"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Título *
              </label>
              <Input
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder="Nome do projeto"
                className="bg-white/[0.02] border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Descrição
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Descrição do projeto..."
                className="w-full min-h-[100px] rounded-md bg-white/[0.02] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#780606]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                  Tipo
                </label>
                <select
                  value={newProject.type}
                  onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                  className="w-full h-10 rounded-md bg-white/[0.02] border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                  aria-label="Tipo de projeto"
                >
                  <option value="Dev">Dev</option>
                  <option value="Design">Design</option>
                  <option value="Research">Research</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                  Prazo
                </label>
                <Input
                  type="date"
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                  className="bg-white/[0.02] border-white/10 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Repositório (URL)
              </label>
              <Input
                type="url"
                value={newProject.repository}
                onChange={(e) => setNewProject({ ...newProject, repository: e.target.value })}
                placeholder="https://github.com/..."
                className="bg-white/[0.02] border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Tecnologias (separadas por vírgula)
              </label>
              <Input
                value={newProject.technologies}
                onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                placeholder="React, TypeScript, Node.js"
                className="bg-white/[0.02] border-white/10 text-white"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateProject}
                disabled={!newProject.title.trim() || isCreatingProject}
                className="bg-[#780606] hover:bg-[#780606]/90 text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                {isCreatingProject ? 'Criando...' : 'Criar Projeto'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateProject(false);
                  setNewProject({
                    title: '',
                    description: '',
                    type: 'Dev',
                    deadline: '',
                    repository: '',
                    technologies: '',
                  });
                }}
                disabled={isCreatingProject}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  const handleSelect = (projectId: string) => {
    setSelectedProject(projectId);
    navigate(`/projects/${projectId}`);
  };

  const handleEditProject = (project: (typeof projects)[0]) => {
    setEditingProject(project);
    // Parse technologies from JSON string to comma-separated string
    let technologiesStr = '';
    if (project.technologies) {
      try {
        const techArray = typeof project.technologies === 'string' 
          ? JSON.parse(project.technologies) 
          : project.technologies;
        technologiesStr = Array.isArray(techArray) ? techArray.join(', ') : '';
      } catch {
        technologiesStr = '';
      }
    }
    
    // Format deadline for input
    let deadlineStr = '';
    if (project.deadline) {
      try {
        const deadlineDate = new Date(project.deadline);
        if (!isNaN(deadlineDate.getTime())) {
          deadlineStr = deadlineDate.toISOString().split('T')[0];
        }
      } catch {
        deadlineStr = '';
      }
    }

    setNewProject({
      title: project.title || '',
      description: project.description || '',
      type: project.type || 'Dev',
      deadline: deadlineStr,
      repository: project.repository || '',
      technologies: technologiesStr,
    });
    setShowEditProject(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !newProject.title.trim()) {
      showError('Título é obrigatório');
      return;
    }
    setIsUpdatingProject(true);
    try {
      const technologies = newProject.technologies
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload: any = {
        title: newProject.title.trim(),
        description: newProject.description.trim() || null,
        type: newProject.type || 'Dev',
        deadline: newProject.deadline || null,
        repository: newProject.repository.trim() || null,
        technologies: technologies.length > 0 ? JSON.stringify(technologies) : '[]',
      };

      // Remove null values for optional fields
      if (!payload.description) delete payload.description;
      if (!payload.deadline) delete payload.deadline;
      if (!payload.repository) delete payload.repository;

      await api.put(`/projects/${editingProject.id}`, payload);
      await refreshCourseData();
      setShowEditProject(false);
      setEditingProject(null);
      setNewProject({
        title: '',
        description: '',
        type: 'Dev',
        deadline: '',
        repository: '',
        technologies: '',
      });
      success('Projeto atualizado com sucesso!');
    } catch (error: any) {
      console.error('Failed to update project:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao atualizar projeto. Tente novamente.';
      showError(errorMessage);
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Tem certeza que deseja deletar este projeto? Esta ação não pode ser desfeita.')) {
      return;
    }
    setIsDeletingProject(projectId);
    try {
      await api.delete(`/projects/${projectId}`);
      await refreshCourseData();
      success('Projeto deletado com sucesso!');
      if (selectedProject === projectId) {
        setSelectedProject(null);
      }
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao deletar projeto. Tente novamente.';
      showError(errorMessage);
    } finally {
      setIsDeletingProject(null);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !activeProject) {
      showError('Título da tarefa é obrigatório');
      return;
    }
    setIsAddingTask(true);
    try {
      const taskCount = activeProject.tasks?.length || 0;
      await api.post(`/projects/${activeProject.id}/tasks`, {
        title: newTaskTitle.trim(),
        status: 'todo',
        order: taskCount + 1,
      });

      await refreshCourseData();
      setShowAddTask(false);
      setNewTaskTitle('');
      success('Tarefa adicionada com sucesso!');
    } catch (error) {
      console.error('Failed to add task:', error);
      showError('Erro ao adicionar tarefa. Tente novamente.');
    } finally {
      setIsAddingTask(false);
    }
  };

  return (
    <div className="cv-section space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <section className="rounded-3xl border border-white/10 bg-[#070708]/90 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 sm:space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#780606]">
                Portfólio Prático
              </p>
              <ContextualHelp section="projects" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light text-white tracking-tight">
              Projetos Práticos
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus projetos de aplicação prática (PoW). Organize tarefas, acompanhe progresso e
              transforme conhecimento em resultados tangíveis.
            </p>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-white">{stats.total}</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-white">{stats.emProgresso}</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Em andamento</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-white">{stats.avgProgress}%</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Progresso médio</p>
              </div>
            </div>
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 text-white mb-4 sm:mb-6">
              <div className="h-10 w-10 rounded-xl bg-[#780606]/20 border border-[#780606]/50 flex items-center justify-center">
                <PenTool className="h-5 w-5 text-[#780606]" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Estado do portfólio
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {stats.finalizados} concluídos
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowCreateProject(true)}
                className="bg-[#780606] hover:bg-[#780606]/90 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo projeto
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
          <button
            onClick={() => setStatusFilter('todos')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              statusFilter === 'todos'
                ? 'bg-[#780606] text-white'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('em_progresso')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
              statusFilter === 'em_progresso'
                ? 'bg-[#780606] text-white'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            Em Progresso
          </button>
          <button
            onClick={() => setStatusFilter('finalizado')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              statusFilter === 'finalizado'
                ? 'bg-[#780606] text-white'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            Finalizados
          </button>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'kanban' | 'timeline')}>
          <TabsList className="bg-white/5 border border-white/5">
            <TabsTrigger value="list" className="data-[state=active]:bg-[#780606]">
              <List className="mr-2 h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="kanban" className="data-[state=active]:bg-[#780606]">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-[#780606]">
              <Calendar className="mr-2 h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Views */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'kanban' | 'timeline')}>
        <TabsContent value="list" className="mt-0">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr_1fr]">
            {/* Projects List */}
            <Card className="border-white/5 bg-[#050506]/90">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="text-2xl text-white">Projetos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Clique em um projeto para ver detalhes completos e gerenciar tarefas.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredProjects.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-muted-foreground">
                    Nenhum projeto encontrado com o filtro selecionado.
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className={cn(
                        'group relative w-full rounded-2xl border border-white/10 bg-white/[0.01] p-5 transition-all hover:border-[#780606]/40',
                        selectedProject === project.id && 'border-[#780606]/60 bg-[#780606]/5'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => handleSelect(project.id)}
                          className="flex items-start gap-4 flex-1 min-w-0 text-left"
                        >
                          <div
                            className={cn(
                              'h-12 w-12 rounded-xl border border-white/10 bg-black/40 flex items-center justify-center flex-shrink-0',
                              project.status === 'em_progresso' && 'bg-[#780606]/10 border-[#780606]/20'
                            )}
                          >
                            <Code className="h-6 w-6 text-white/80" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white truncate">{project.title}</h3>
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                                  project.status === 'finalizado'
                                    ? 'text-emerald-400 border-emerald-400/40 bg-emerald-500/5'
                                    : 'text-[#780606] border-[#780606]/40 bg-[#780606]/10'
                                )}
                              >
                                {project.status === 'finalizado' ? 'Finalizado' : 'Em Progresso'}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
                              {project.type}
                            </p>
                            {project.status === 'em_progresso' && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Progresso</span>
                                  <span className="font-semibold text-white">{project.progress}%</span>
                                </div>
                                <ProgressBar progress={project.progress} />
                              </div>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all text-muted-foreground hover:text-white"
                            aria-label="Editar projeto"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            disabled={isDeletingProject === project.id}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg transition-all text-muted-foreground hover:text-red-400 disabled:opacity-50"
                            aria-label="Deletar projeto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-[#780606] transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Kanban Sidebar */}
            <Card className="border-white/10 bg-black/60 h-fit sticky top-24">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Kanban Rápido</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {activeProject?.title || 'Selecione um projeto'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <div className="h-2 w-2 rounded-full bg-[#780606]" />
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-500">
                      A Fazer
                    </span>
                    <span className="text-[10px] text-muted-foreground">{todoTasks.length}</span>
                  </div>
                  {todoTasks.length > 0 ? (
                    todoTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-lg p-3 text-sm text-muted-foreground group relative"
                      >
                        <div className="flex justify-between items-start">
                          <span>{task.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveTask(task.id, 'doing');
                            }}
                            disabled={isMovingTask === task.id}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-[#780606] disabled:opacity-50"
                            aria-label="Mover tarefa para em andamento"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-sm text-muted-foreground min-h-[60px] flex items-center justify-center border-dashed">
                      Nenhuma tarefa pendente
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#780606]">
                      Em Andamento
                    </span>
                    <span className="text-[10px] text-muted-foreground">{doingTasks.length}</span>
                  </div>
                  {doingTasks.length > 0 ? (
                    doingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-[#780606]/5 border border-[#780606]/20 rounded-lg p-3 text-sm text-white shadow-[0_0_15px_rgba(120,6,6,0.1)] group relative"
                      >
                        <div className="flex justify-between items-start">
                          <span>{task.title}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTask(task.id, 'done');
                              }}
                              disabled={isMovingTask === task.id}
                              className="p-1 hover:bg-[#780606]/20 rounded text-green-500 disabled:opacity-50"
                              aria-label="Marcar tarefa como concluída"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-sm text-muted-foreground min-h-[60px] flex items-center justify-center border-dashed">
                      Arraste uma tarefa para cá
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-green-500">
                      Concluído
                    </span>
                    <span className="text-[10px] text-muted-foreground">{doneTasks.length}</span>
                  </div>
                  {doneTasks.length > 0 ? (
                    doneTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 text-sm text-muted-foreground line-through opacity-60"
                      >
                        {task.title}
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-sm text-muted-foreground opacity-60 min-h-[60px] flex items-center justify-center border-dashed">
                      Nenhuma tarefa concluída
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full border-dashed border-white/20 text-muted-foreground hover:text-white hover:border-[#780606]/50 hover:bg-[#780606]/5 transition-all"
                  onClick={() => {
                    if (!activeProject) {
                      showError('Selecione um projeto primeiro');
                      return;
                    }
                    setShowAddTask(true);
                  }}
                  disabled={!activeProject}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Tarefa Rápida
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kanban" className="mt-0">
          {projects.length > 0 ? (
            <Card className="border-white/5 bg-[#050506]/90">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-white">Kanban de Tarefas</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Gerencie tarefas arrastando entre as colunas
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Projeto:
                    </label>
                    <select
                      value={selectedProject || activeProject?.id || ''}
                      onChange={(e) => {
                        const projectId = e.target.value;
                        setSelectedProject(projectId || null);
                      }}
                      className="h-10 rounded-md bg-white/[0.02] border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606] min-w-[200px]"
                    >
                      <option value="">Selecione um projeto</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeProject ? (
                  <KanbanBoard
                    tasks={localTasks as any}
                    onTaskMove={moveTask}
                    onTaskDelete={deleteTask}
                    onAddTask={(status) => {
                      if (!activeProject) return;
                      setShowAddTask(true);
                      localStorage.setItem('newTaskStatus', status);
                    }}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Selecione um projeto para ver o Kanban</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-white/5 bg-[#050506]/90">
              <CardContent className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-[#780606]/10 flex items-center justify-center mx-auto mb-4">
                  <LayoutGrid className="h-8 w-8 text-[#780606]" />
                </div>
                <p className="text-muted-foreground mb-4">Selecione um projeto para ver o Kanban</p>
                <Button variant="outline" onClick={() => setViewMode('list')}>
                  Ver Lista de Projetos
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <Card className="border-white/5 bg-[#050506]/90">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Timeline de Projetos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualize seus projetos em ordem cronológica de prazo
              </p>
            </CardHeader>
            <CardContent>
              <ProjectTimeline projects={filteredProjects as any} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateProject}
        onClose={() => {
          setShowCreateProject(false);
          setNewProject({
            title: '',
            description: '',
            type: 'Dev',
            deadline: '',
            repository: '',
            technologies: '',
          });
        }}
        title="Novo Projeto"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              Título *
            </label>
            <Input
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              placeholder="Nome do projeto"
              className="bg-white/[0.02] border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              Descrição
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Descrição do projeto..."
              className="w-full min-h-[100px] rounded-md bg-white/[0.02] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#780606]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Tipo
              </label>
              <select
                value={newProject.type}
                onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                className="w-full h-10 rounded-md bg-white/[0.02] border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                aria-label="Tipo de projeto"
              >
                <option value="Dev">Dev</option>
                <option value="Design">Design</option>
                <option value="Research">Research</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Prazo
              </label>
              <Input
                type="date"
                value={newProject.deadline}
                onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                className="bg-white/[0.02] border-white/10 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              Repositório (URL)
            </label>
            <Input
              type="url"
              value={newProject.repository}
              onChange={(e) => setNewProject({ ...newProject, repository: e.target.value })}
              placeholder="https://github.com/..."
              className="bg-white/[0.02] border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              Tecnologias (separadas por vírgula)
            </label>
            <Input
              value={newProject.technologies}
              onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
              placeholder="React, TypeScript, Node.js"
              className="bg-white/[0.02] border-white/10 text-white"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreateProject}
              disabled={!newProject.title.trim() || isCreatingProject}
              className="bg-[#780606] hover:bg-[#780606]/90 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {isCreatingProject ? 'Criando...' : 'Criar Projeto'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateProject(false);
                setNewProject({
                  title: '',
                  description: '',
                  type: 'Dev',
                  deadline: '',
                  repository: '',
                  technologies: '',
                });
              }}
              disabled={isCreatingProject}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditProject}
        onClose={() => {
          setShowEditProject(false);
          setEditingProject(null);
          setNewProject({
            title: '',
            description: '',
            type: 'Dev',
            deadline: '',
            repository: '',
            technologies: '',
          });
        }}
        title="Editar Projeto"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              Título *
            </label>
            <Input
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              placeholder="Nome do projeto"
              className="bg-white/[0.02] border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              Descrição
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Descrição do projeto..."
              className="w-full min-h-[100px] rounded-md bg-white/[0.02] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#780606]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Tipo
              </label>
              <select
                value={newProject.type}
                onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                className="w-full h-10 rounded-md bg-white/[0.02] border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                aria-label="Tipo de projeto"
              >
                <option value="Dev">Dev</option>
                <option value="Design">Design</option>
                <option value="Research">Research</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Prazo
              </label>
              <Input
                type="date"
                value={newProject.deadline}
                onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                className="bg-white/[0.02] border-white/10 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              Repositório (URL)
            </label>
            <Input
              type="url"
              value={newProject.repository}
              onChange={(e) => setNewProject({ ...newProject, repository: e.target.value })}
              placeholder="https://github.com/..."
              className="bg-white/[0.02] border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              Tecnologias (separadas por vírgula)
            </label>
            <Input
              value={newProject.technologies}
              onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
              placeholder="React, TypeScript, Node.js"
              className="bg-white/[0.02] border-white/10 text-white"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleUpdateProject}
              disabled={!newProject.title.trim() || isUpdatingProject}
              className="bg-[#780606] hover:bg-[#780606]/90 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {isUpdatingProject ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditProject(false);
                setEditingProject(null);
                setNewProject({
                  title: '',
                  description: '',
                  type: 'Dev',
                  deadline: '',
                  repository: '',
                  technologies: '',
                });
              }}
              disabled={isUpdatingProject}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddTask}
        onClose={() => {
          setShowAddTask(false);
          setNewTaskTitle('');
        }}
        title="Adicionar Tarefa"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              Título da Tarefa *
            </label>
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Ex: Implementar autenticação"
              className="bg-white/[0.02] border-white/10 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTaskTitle.trim()) {
                  handleAddTask();
                }
              }}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim() || isAddingTask}
              className="bg-[#780606] hover:bg-[#780606]/90 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {isAddingTask ? 'Adicionando...' : 'Adicionar Tarefa'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddTask(false);
                setNewTaskTitle('');
              }}
              disabled={isAddingTask}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}