import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  ArrowLeft,
  Rocket,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  Edit3,
  Save,
  X,
  Trash2,
  Plus,
  Target,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { useCourse } from '../contexts/CourseContext';
import { useToast } from '../components/feedback/ToastSystem';

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

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshCourseData } = useCourse();
  const { success, error: showError } = useToast();
  interface Project {
    id: string;
    title: string;
    description?: string;
    type: string;
    status: string;
    progress: number;
    deadline?: string | null;
    repository?: string | null;
    technologies?: string | string[];
    requirements?: string | null;
  }

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  interface Milestone {
    id: string;
    title: string;
    description?: string | null;
    completed: boolean;
    order: number;
  }
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '' });

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchMilestones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
      setEditedProject(response.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
      showError('Erro ao carregar projeto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestones = async () => {
    try {
      const response = await api.get(`/projects/${id}/milestones`);
      setMilestones(response.data);
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.title.trim() || !id) return;
    try {
      const response = await api.post(`/projects/${id}/milestones`, {
        title: newMilestone.title.trim(),
        description: newMilestone.description.trim() || null,
      });
      console.log('Milestone created:', response.data);
      setNewMilestone({ title: '', description: '' });
      setShowAddMilestone(false);
      await fetchMilestones();
      await fetchProject(); // Refresh to get updated progress
      await refreshCourseData();
      success('Marco adicionado com sucesso!');
    } catch (error: any) {
      console.error('Failed to add milestone:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao adicionar marco. Tente novamente.';
      showError(errorMessage);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    try {
      await api.put(`/milestones/${milestoneId}`, { completed });
      await fetchMilestones();
      await fetchProject(); // Refresh to get updated progress
      await refreshCourseData();
      success(completed ? 'Marco concluído!' : 'Marco reaberto!');
    } catch (error) {
      console.error('Failed to toggle milestone:', error);
      showError('Erro ao atualizar marco. Tente novamente.');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Tem certeza que deseja deletar este marco?')) return;
    try {
      await api.delete(`/milestones/${milestoneId}`);
      await fetchMilestones();
      await fetchProject(); // Refresh to get updated progress
      await refreshCourseData();
      success('Marco deletado com sucesso!');
    } catch (error) {
      console.error('Failed to delete milestone:', error);
      showError('Erro ao deletar marco. Tente novamente.');
    }
  };

  const handleStartEdit = () => {
    if (project) {
      setEditedProject({ ...project });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!editedProject || !id) return;
    setIsSaving(true);
    try {
      const technologies =
        typeof editedProject.technologies === 'string'
          ? editedProject.technologies
          : JSON.stringify(editedProject.technologies || []);

      const response = await api.put(`/projects/${id}`, {
        title: editedProject.title?.trim(),
        description: editedProject.description?.trim() || null,
        type: editedProject.type,
        status: editedProject.status,
        progress: Math.min(100, Math.max(0, editedProject.progress || 0)),
        deadline: editedProject.deadline || null,
        repository: editedProject.repository?.trim() || null,
        technologies,
        requirements: editedProject.requirements?.trim() || null,
      });

      setProject(response.data);
      setEditedProject(response.data);
      setIsEditing(false);
      await refreshCourseData();
      success('Projeto atualizado com sucesso!');
    } catch (error) {
      console.error('Failed to save changes:', error);
      showError('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !project) return;
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o projeto "${project.title}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      await refreshCourseData();
      success('Projeto excluído com sucesso!');
      navigate('/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
      showError('Erro ao excluir projeto. Tente novamente.');
      setIsDeleting(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="cv-section space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#780606]"></div>
        </div>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Não definido';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const displayProject = isEditing ? editedProject : project;
  const technologiesArray = (() => {
    if (!displayProject?.technologies) return [];
    if (typeof displayProject.technologies === 'string') {
      try {
        return displayProject.technologies ? JSON.parse(displayProject.technologies) : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(displayProject.technologies) ? displayProject.technologies : [];
  })();

  return (
    <div className="cv-section space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <section className="rounded-3xl border border-white/10 bg-[#070708]/90 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/projects')}
                className="text-muted-foreground hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#780606]">
                Detalhes do Projeto
              </p>
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={displayProject?.title || ''}
                  onChange={(e) => editedProject && setEditedProject({ ...editedProject, title: e.target.value })}
                  className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light bg-white/[0.02] border-white/10 text-white h-auto py-2"
                />
                <select
                  value={displayProject?.type || 'Dev'}
                  onChange={(e) => editedProject && setEditedProject({ ...editedProject, type: e.target.value })}
                  className="h-10 rounded-md bg-white/[0.02] border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                  title="Tipo do projeto"
                  aria-label="Tipo do projeto"
                >
                  <option value="Dev">Dev</option>
                  <option value="Design">Design</option>
                  <option value="Research">Research</option>
                </select>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light text-white tracking-tight mb-2">
                  {displayProject?.title}
                </h1>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  {displayProject?.type}
                </p>
              </div>
            )}
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEdit}
                className="border-white/10 hover:bg-white/[0.05]"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-300 hover:border-red-400/50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 xl:grid-cols-[2fr_1fr]">
        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* Status and Progress */}
          <Card className="border-white/5 bg-[#050506]/90">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                    Status e Progresso
                  </p>
                  <CardTitle className="text-xl text-white">Acompanhamento</CardTitle>
                </div>
                {isEditing ? (
                  <select
                    value={displayProject?.status || 'em_progresso'}
                    onChange={(e) => editedProject && setEditedProject({ ...editedProject, status: e.target.value })}
                    className="h-8 rounded-md bg-white/[0.02] border border-white/10 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                    title="Status do projeto"
                    aria-label="Status do projeto"
                  >
                    <option value="em_progresso">Em Progresso</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                      displayProject?.status === 'finalizado'
                        ? 'text-emerald-400 border-emerald-400/40 bg-emerald-500/5'
                        : 'text-[#780606] border-[#780606]/40 bg-[#780606]/10'
                    )}
                  >
                    {displayProject?.status === 'finalizado' ? 'Finalizado' : 'Em Progresso'}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={displayProject?.progress || 0}
                        onChange={(e) =>
                          editedProject && setEditedProject({ ...editedProject, progress: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 h-8 bg-white/[0.02] border-white/10 text-white text-sm"
                      />
                      <span className="text-[#780606] font-bold">%</span>
                    </div>
                  ) : (
                    <span className="text-[#780606] font-bold">{displayProject?.progress || 0}%</span>
                  )}
                </div>
                <ProgressBar progress={displayProject?.progress || 0} />
              </div>
              {isEditing && (
                <div className="flex gap-3 pt-6 border-t border-white/5 mt-6">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="bg-[#780606] hover:bg-[#780606]/90 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="border-white/10 hover:bg-white/[0.05]"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="border-white/5 bg-[#050506]/90">
            <CardHeader className="p-6 pb-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                Descrição
              </p>
              <CardTitle className="text-xl text-white">Sobre o Projeto</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isEditing ? (
                <textarea
                  value={displayProject?.description || ''}
                  onChange={(e) => editedProject && setEditedProject({ ...editedProject, description: e.target.value })}
                  placeholder="Descreva o projeto..."
                  className="w-full min-h-[120px] rounded-md bg-white/[0.02] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#780606]"
                />
              ) : (
                <p className="text-muted-foreground">
                  {displayProject?.description || 'Nenhuma descrição definida'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="border-white/5 bg-[#050506]/90">
            <CardHeader className="p-6 pb-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                Requisitos
              </p>
              <CardTitle className="text-xl text-white">Especificações</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isEditing ? (
                <textarea
                  value={displayProject?.requirements || ''}
                  onChange={(e) => editedProject && setEditedProject({ ...editedProject, requirements: e.target.value })}
                  placeholder="Descreva os requisitos do projeto..."
                  className="w-full min-h-[150px] rounded-md bg-white/[0.02] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#780606]"
                />
              ) : (
                <div className="whitespace-pre-wrap text-muted-foreground">
                  {displayProject?.requirements || 'Nenhum requisito definido'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card className="border-white/5 bg-[#050506]/90">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                    Marcos
                  </p>
                  <CardTitle className="text-xl text-white">Marcos do Projeto</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    O progresso é calculado automaticamente com base nos marcos concluídos
                  </p>
                </div>
                {!isEditing && (
                  <Button
                    size="sm"
                    onClick={() => setShowAddMilestone(true)}
                    className="bg-[#780606] hover:bg-[#780606]/90 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Marco
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {milestones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum marco definido ainda</p>
                  <p className="text-xs mt-1">Adicione marcos para acompanhar o progresso do projeto</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-lg border transition-all',
                        milestone.completed
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-white/[0.02] border-white/10'
                      )}
                    >
                      <button
                        onClick={() => handleToggleMilestone(milestone.id, !milestone.completed)}
                        className={cn(
                          'mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-all',
                          milestone.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-white/30 hover:border-[#780606]'
                        )}
                        aria-label={milestone.completed ? 'Marcar como não concluído' : 'Marcar como concluído'}
                      >
                        {milestone.completed && (
                          <CheckCircle2 className="h-full w-full text-white" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4
                          className={cn(
                            'font-medium',
                            milestone.completed ? 'text-green-400 line-through' : 'text-white'
                          )}
                        >
                          {milestone.title}
                        </h4>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors flex-shrink-0"
                        title="Deletar marco"
                        aria-label="Deletar marco"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Technologies */}
          <Card className="border-white/10 bg-black/60">
            <CardHeader className="p-6 pb-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                Tecnologias
              </p>
              <CardTitle className="text-lg text-white">Stack Tecnológico</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isEditing ? (
                <Input
                  value={technologiesArray.join(', ')}
                  onChange={(e) => {
                    if (!editedProject) return;
                    const techs = e.target.value.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
                    setEditedProject({ ...editedProject, technologies: JSON.stringify(techs) });
                  }}
                  placeholder="React, TypeScript, Node.js (separadas por vírgula)"
                  className="bg-white/[0.02] border-white/10 text-white"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {technologiesArray.length > 0 ? (
                    technologiesArray.map((tech: string, index: number) => (
                      <span
                        key={index}
                        className="rounded-full bg-[#780606]/20 border border-[#780606]/30 px-3 py-1 text-sm text-[#780606]"
                      >
                        {tech}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Nenhuma tecnologia definida</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deadline and Repository */}
          <Card className="border-white/10 bg-black/60">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#780606]" />
                <CardTitle className="text-lg text-white">Prazo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isEditing ? (
                <Input
                  type="date"
                  value={
                    displayProject?.deadline
                      ? new Date(displayProject.deadline).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => editedProject && setEditedProject({ ...editedProject, deadline: e.target.value || null })}
                  className="bg-white/[0.02] border-white/10 text-white"
                />
              ) : (
                <p className="text-lg font-semibold text-white">{formatDate(displayProject?.deadline || null)}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/60">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-[#780606]" />
                <CardTitle className="text-lg text-white">Repositório</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {isEditing ? (
                <Input
                  type="url"
                  value={displayProject?.repository || ''}
                  onChange={(e) => editedProject && setEditedProject({ ...editedProject, repository: e.target.value })}
                  placeholder="https://github.com/..."
                  className="bg-white/[0.02] border-white/10 text-white"
                />
              ) : displayProject?.repository ? (
                <Button variant="outline" asChild className="border-white/10 hover:bg-white/[0.05]">
                  <a href={displayProject.repository} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir no GitHub
                  </a>
                </Button>
              ) : (
                <p className="text-muted-foreground">Nenhum repositório definido</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-white/10 bg-black/60">
            <CardHeader className="p-6 pb-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                Ações
              </p>
              <CardTitle className="text-lg text-white">Ferramentas</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 space-y-3">
              <Button
                variant="outline"
                className="w-full border-white/10 hover:bg-white/[0.05] justify-start"
                asChild
              >
                <Link to={`/projects/${id}/checklist`}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Checklist de Entrega
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/10 hover:bg-white/[0.05] justify-start"
                asChild
              >
                <Link to={`/projects/${id}/diary`}>
                  <Clock className="mr-2 h-4 w-4" />
                  Diário de Bordo
                </Link>
              </Button>
              {project.status === 'finalizado' && (
                <Button
                  className="w-full bg-[#780606] hover:bg-[#780606]/90 text-white justify-start"
                  asChild
                >
                  <Link to={`/projects/${id}/celebration`}>Ver Celebração</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestone && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddMilestone(false)}
          />
          <div
            className="relative z-[10000] w-full max-w-md rounded-lg border border-white/10 bg-[#050506] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="text-lg font-semibold text-white">Adicionar Marco</h2>
              <button
                onClick={() => setShowAddMilestone(false)}
                className="rounded p-1 hover:bg-white/10 transition-colors"
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                  Título *
                </label>
                <Input
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  placeholder="Nome do marco"
                  className="bg-white/[0.02] border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                  Descrição
                </label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  placeholder="Descrição do marco..."
                  className="w-full min-h-[100px] rounded-md bg-white/[0.02] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#780606]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddMilestone}
                  disabled={!newMilestone.title.trim()}
                  className="bg-[#780606] hover:bg-[#780606]/90 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddMilestone(false);
                    setNewMilestone({ title: '', description: '' });
                  }}
                  className="border-white/10 hover:bg-white/[0.05]"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}