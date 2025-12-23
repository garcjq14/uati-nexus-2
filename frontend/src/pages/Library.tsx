import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  Headphones,
  LayoutGrid,
  List,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Video,
  X,
} from 'lucide-react';
import type { LucideIcon } from '../types/lucide';
import { useCourse } from '../contexts/CourseContext';
import api from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import { EmptyState } from '../components/empty-states/EmptyState';
import { LoadingSkeleton } from '../components/feedback/LoadingStates';
import { useToast } from '../components/ui/toast';

type CourseResource = NonNullable<ReturnType<typeof useCourse>['courseData']>['resources'][number];

type ResourceFormState = {
  title: string;
  author: string;
  format: string;
  status: 'a_fazer' | 'lendo' | 'concluido';
  url: string;
  description: string;
  notes: string;
  tags: string;
};

const formatIcons: Record<string, LucideIcon> = {
  Livro: BookOpen,
  Audio: Headphones,
  PDF: FileText,
  Video: Video,
};

const statusTokens: Record<
  'a_fazer' | 'lendo' | 'concluido',
  { label: string; chip: string; badge: string }
> = {
  a_fazer: {
    label: 'Na fila',
    chip: 'bg-white/5 text-white border-white/10',
    badge: 'bg-gradient-to-r from-slate-800/70 to-slate-600/30 text-slate-200 border border-white/5',
  },
  lendo: {
    label: 'Em leitura',
    chip: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    badge: 'bg-gradient-to-r from-amber-500/30 to-orange-500/40 text-white border border-amber-400/40',
  },
  concluido: {
    label: 'Concluído',
    chip: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    badge:
      'bg-gradient-to-r from-emerald-500/40 to-teal-500/40 text-white border border-emerald-400/50',
  },
};

const formatFilterOptions = [
  { label: 'Todos os formatos', value: 'Todos' },
  { label: 'Livros', value: 'Livro' },
  { label: 'Artigos / PDF', value: 'PDF' },
  { label: 'Vídeos', value: 'Video' },
  { label: 'Áudio', value: 'Audio' },
];

const statusFilterOptions = [
  { label: 'Status: todos', value: 'todos' },
  { label: 'Na fila', value: 'a_fazer' },
  { label: 'Em leitura', value: 'lendo' },
  { label: 'Concluídos', value: 'concluido' },
] as const;

const sortOptions = [
  { label: 'Mais recentes', value: 'recent' },
  { label: 'Título (A-Z)', value: 'title' },
  { label: 'Maior progresso', value: 'progress' },
] as const;

const viewModes = [
  { label: 'Lista dinâmica', value: 'list', icon: List },
  { label: 'Quadro Kanban', value: 'board', icon: LayoutGrid },
] as const;

const milestoneLevels = [
  { name: 'Explorador', limit: 0 },
  { name: 'Leitor Ávido', limit: 5 },
  { name: 'Erudito', limit: 15 },
  { name: 'Mestre do Saber', limit: 30 },
];

const boardColumns = [
  { key: 'a_fazer', title: 'Fila estratégica', description: 'Itens aguardando foco' },
  { key: 'lendo', title: 'Em imersão', description: 'Conteúdos em leitura ativa' },
  { key: 'concluido', title: 'Vitórias registradas', description: 'Temas consolidados' },
] as const;

const defaultFormState: ResourceFormState = {
  title: '',
  author: '',
  format: 'Livro',
  status: 'a_fazer',
  url: '',
  description: '',
  notes: '',
  tags: '',
};

const calculateAutoProgress = (resource: CourseResource): number => {
  // Se o status é concluído, progresso é 100%
  if (resource.status === 'concluido') {
    return 100;
  }
  
  // Se o status é a_fazer, progresso é 0%
  if (resource.status === 'a_fazer') {
    return 0;
  }
  
  // Se o status é lendo, calcular baseado em annotations e capítulos
  if (resource.status === 'lendo' && resource.annotations && resource.annotations.length > 0) {
    const uniqueChapters = new Set(
      resource.annotations
        .map((a) => a.chapter)
        .filter((chapter): chapter is string => Boolean(chapter))
    );
    const estimatedChapters = resource.estimatedChapters || 10;
    const completedChapters = uniqueChapters.size;
    return Math.min(Math.round((completedChapters / estimatedChapters) * 100), 100);
  }
  
  // Se está lendo mas não tem annotations, retornar 0%
  return 0;
};

const parseTags = (tags?: string | string[] | null) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const getDateValue = (value?: string | null) => (value ? new Date(value).getTime() : 0);

const formatDate = (value?: string | null) => {
  if (!value) return 'Sem data';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return 'Sem data';
  }
};

export default function Library() {
  const navigate = useNavigate();
  const { courseData, loading, refreshCourseData } = useCourse();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [formatFilter, setFormatFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilterOptions)[number]['value']>('todos');
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['value']>('recent');
  const [viewMode, setViewMode] = useState<(typeof viewModes)[number]['value']>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formState, setFormState] = useState<ResourceFormState>(defaultFormState);
  const [activeResource, setActiveResource] = useState<CourseResource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<CourseResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  const resources = courseData.resources;
  const hasResources = resources.length > 0;

  const filteredResources = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return resources
      .filter((resource) => (formatFilter === 'Todos' ? true : resource.format === formatFilter))
      .filter((resource) => (statusFilter === 'todos' ? true : resource.status === statusFilter))
      .filter((resource) => {
        if (!query) return true;
        const tags = parseTags(resource.tags);
        return (
          resource.title.toLowerCase().includes(query) ||
          (resource.author ?? '').toLowerCase().includes(query) ||
          (resource.description ?? resource.notes ?? '').toLowerCase().includes(query) ||
          tags.some((tag) => tag.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title, 'pt-BR');
        }
        if (sortBy === 'progress') {
          return calculateAutoProgress(b) - calculateAutoProgress(a);
        }
        const aDate = getDateValue(a.updatedAt ?? a.createdAt);
        const bDate = getDateValue(b.updatedAt ?? b.createdAt);
        return bDate - aDate;
      });
  }, [resources, formatFilter, statusFilter, debouncedSearch, sortBy]);

  const boardData = useMemo(() => {
    return {
      a_fazer: filteredResources.filter((r) => r.status === 'a_fazer'),
      lendo: filteredResources.filter((r) => r.status === 'lendo'),
      concluido: filteredResources.filter((r) => r.status === 'concluido'),
    };
  }, [filteredResources]);

  const readingQueue = useMemo(
    () =>
      resources
        .filter((resource) => resource.status === 'lendo')
        .sort(
          (a, b) =>
            getDateValue(b.updatedAt ?? b.createdAt) - getDateValue(a.updatedAt ?? a.createdAt)
        )
        .slice(0, 5),
    [resources]
  );

  const recentlyAdded = useMemo(
    () =>
      [...resources]
        .sort(
          (a, b) =>
            getDateValue(b.createdAt ?? b.updatedAt) - getDateValue(a.createdAt ?? a.updatedAt)
        )
        .slice(0, 6),
    [resources]
  );

  const formatBreakdown = useMemo(() => {
    const total = resources.length || 1;
    return formatFilterOptions
      .filter((option) => option.value !== 'Todos')
      .map((option) => {
        const count = resources.filter((resource) => resource.format === option.value).length;
        return {
          label: option.label,
          value: option.value,
          count,
          percent: Math.round((count / total) * 100),
        };
      });
  }, [resources]);

  const totalCompleted = resources.filter((resource) => resource.status === 'concluido').length;
  const totalReading = resources.filter((resource) => resource.status === 'lendo').length;
  const totalQueue = resources.filter((resource) => resource.status === 'a_fazer').length;
  const completionRate = resources.length
    ? Math.round((totalCompleted / resources.length) * 100)
    : 0;

  const currentMilestoneIndex = milestoneLevels.findIndex((level, index) => {
    const next = milestoneLevels[index + 1];
    return totalCompleted >= level.limit && (!next || totalCompleted < next.limit);
  });

  const currentMilestone =
    milestoneLevels[currentMilestoneIndex] ?? milestoneLevels[milestoneLevels.length - 1];
  const nextMilestone = milestoneLevels[currentMilestoneIndex + 1];

  const progressToNext = nextMilestone
    ? ((totalCompleted - currentMilestone.limit) /
        (nextMilestone.limit - currentMilestone.limit)) *
      100
    : 100;

  const topFormat = formatBreakdown.reduce<{ label: string; count: number } | null>(
    (acc, item) => {
      if (!acc || item.count > acc.count) {
        return { label: item.label, count: item.count };
      }
      return acc;
    },
    null
  );

  const handleResetFilters = () => {
    setFormatFilter('Todos');
    setStatusFilter('todos');
    setSortBy('recent');
    setViewMode('list');
    setSearchTerm('');
  };

  const handleOpenCreateForm = () => {
    setFormMode('create');
    setFormState(defaultFormState);
    setActiveResource(null);
    setIsFormOpen(true);
  };

  const handleEditResource = (resource: CourseResource) => {
    setFormMode('edit');
    setActiveResource(resource);
    setFormState({
      title: resource.title ?? '',
      author: resource.author ?? '',
      format: resource.format ?? 'Livro',
      status: (resource.status as ResourceFormState['status']) ?? 'a_fazer',
      url: resource.url ?? '',
      description: (resource.description ?? '') as string,
      notes: resource.notes ?? '',
      tags: parseTags(resource.tags).join(', '),
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setActiveResource(null);
    setFormState(defaultFormState);
  };

  const handleFormChange = (field: keyof ResourceFormState, value: string | number) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitForm = async () => {
    if (!formState.title.trim()) {
      showToast('Informe um título para o recurso.', 'error');
      return;
    }

    const tags = formState.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formState.title.trim(),
        format: formState.format,
        status: formState.status,
        tags: JSON.stringify(tags),
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (formState.author.trim()) {
        payload.author = formState.author.trim();
      }
      if (formState.url.trim()) {
        payload.url = formState.url.trim();
      }
      if (formState.description.trim()) {
        payload.description = formState.description.trim();
      }
      if (formState.notes.trim()) {
        payload.notes = formState.notes.trim();
      }

      if (formMode === 'create') {
        await api.post('/resources', payload);
        showToast('Recurso adicionado à biblioteca!', 'success');
      } else if (activeResource) {
        await api.put(`/resources/${activeResource.id}`, payload);
        showToast('Recurso atualizado com sucesso.', 'success');
      }

      await refreshCourseData();
      closeForm();
    } catch (error: any) {
      console.error('Failed to save resource', error);
      const errorMessage = error?.response?.data?.details || error?.response?.data?.error || 'Não foi possível salvar o recurso.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/resources/${resourceToDelete.id}`);
      await refreshCourseData();
      showToast('Recurso removido.', 'success');
      setResourceToDelete(null);
    } catch (error) {
      console.error('Failed to delete resource', error);
      showToast('Não foi possível remover o recurso.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (
    resource: CourseResource,
    status: ResourceFormState['status']
  ) => {
    if (resource.status === status) return;
    setUpdatingStatusId(resource.id);
    try {
      await api.put(`/resources/${resource.id}`, { status });
      await refreshCourseData();
      showToast('Status atualizado.', 'success');
    } catch (error) {
      console.error('Failed to update status', error);
      showToast('Não foi possível atualizar o status.', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton variant="grid" count={6} />;
  }

  return (
    <div className="cv-section space-y-8 max-w-7xl mx-auto pb-16">
      {ToastComponent}
      <section className="rounded-xl border border-white/5 bg-card p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-6 max-w-2xl">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#780606]">
                Biblioteca
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-serif font-light leading-tight tracking-tight text-white">
                Biblioteca & Recursos
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Priorize leituras, avance com clareza e conquiste marcos com uma experiência pensada
              para estudar sem atrito.
            </p>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:p-4">
                <p className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Total de itens
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{resources.length}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:p-4">
                <p className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Em leitura
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{totalReading}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:p-4">
                <p className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Concluídos
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{totalCompleted}</p>
              </div>
            </div>
          </div>
          <div className="w-full max-w-sm rounded-xl border border-white/5 bg-card p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#780606]/10 flex items-center justify-center flex-shrink-0">
                <BookmarkCheck className="h-5 w-5 sm:h-6 sm:w-6 text-[#780606] stroke-[1.5]" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  Nível atual
                </p>
                <p className="text-base sm:text-xl font-semibold text-white truncate">{currentMilestone.name}</p>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 space-y-2">
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground gap-2">
                <span className="truncate">
                  Próximo: {nextMilestone ? nextMilestone.name : 'Você chegou ao topo 🎉'}
                </span>
                {nextMilestone && (
                  <span className="flex-shrink-0">
                    {totalCompleted}/{nextMilestone.limit}
                  </span>
                )}
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-[#780606] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
            <Button
              onClick={handleOpenCreateForm}
              className="mt-4 sm:mt-6 w-full bg-[#780606] hover:bg-[#780606]/90 text-white text-sm sm:text-base touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo recurso</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:gap-4 lg:gap-6 xl:gap-8 grid-cols-1 xl:grid-cols-[2fr_1fr]">
        <Card className="border-white/5 bg-card rounded-xl">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                  Organize sua biblioteca
                </p>
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-[#780606] flex-shrink-0" />
                  <span className="truncate">Filtros e Visualização</span>
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-white text-xs sm:text-sm touch-manipulation flex-shrink-0"
                style={{ minHeight: '44px' }}
                onClick={handleResetFilters}
              >
                <RefreshCcw className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Limpar filtros</span>
                <span className="sm:hidden">Limpar</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Busque por título, autor ou tags..."
                  className="bg-white/5 pl-9 text-white placeholder:text-muted-foreground text-sm sm:text-base"
                />
              </div>
              <Button
                className="bg-[#780606] hover:bg-[#780606]/90 text-white text-sm sm:text-base touch-manipulation"
                style={{ minHeight: '44px' }}
                onClick={handleOpenCreateForm}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Adicionar recurso</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formatFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormatFilter(option.value)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all',
                    formatFilter === option.value
                      ? 'border-[#780606] bg-[#780606]/10 text-white'
                      : 'border-white/10 text-muted-foreground hover:border-white/40 hover:text-white'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {statusFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-all',
                    statusFilter === option.value
                      ? 'border-[#780606] bg-[#780606]/10 text-white'
                      : 'border-white/10 text-muted-foreground hover:border-white/40 hover:text-white'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ordenar</p>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as (typeof sortOptions)[number]['value'])
                  }
                  className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                  aria-label="Ordenar recursos"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                {viewModes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = viewMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setViewMode(mode.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all',
                        isActive
                          ? 'border-[#780606] bg-[#780606]/10 text-white'
                          : 'border-white/10 text-muted-foreground hover:border-white/40 hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card rounded-xl">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Métricas
                </p>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-[#780606]" />
                  Radar de foco
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Fila ativa', value: totalQueue, hint: 'Aguardando dedicação' },
              { label: 'Imersões em curso', value: totalReading, hint: 'Lendo agora' },
              { label: 'Taxa de conclusão', value: `${completionRate}%`, hint: 'Do que já foi finalizado' },
              {
                label: 'Formato favorito',
                value: topFormat ? topFormat.label : 'Descobrindo',
                hint: topFormat ? `${topFormat.count} itens` : 'Colha novos formatos',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1"
              >
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-2xl font-semibold text-white">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {hasResources ? (
        <div
          className={cn(
            'grid gap-6',
            viewMode === 'list' ? 'xl:grid-cols-[2.2fr_0.9fr]' : 'xl:grid-cols-[2.2fr_0.8fr]'
          )}
        >
          <Card className="border-white/5 bg-card rounded-xl">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                    {viewMode === 'list' ? 'Lista' : 'Quadro Kanban'}
                  </p>
                  <CardTitle className="text-white">
                    {viewMode === 'list' ? 'Coleção em destaque' : 'Quadro visual de estudo'}
                  </CardTitle>
                </div>
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {filteredResources.length} itens
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {viewMode === 'list' ? (
                filteredResources.length ? (
                  filteredResources.map((resource) => (
                    <ResourceListCard
                      key={resource.id}
                      resource={resource}
                      onNavigate={() => navigate(`/resources/${resource.id}`)}
                      onEdit={() => handleEditResource(resource)}
                      onDelete={() => setResourceToDelete(resource)}
                      onStatusChange={(status) => handleStatusChange(resource, status)}
                      updating={updatingStatusId === resource.id}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      Nenhum resultado com os filtros atuais. Ajuste a busca e tente novamente.
                    </p>
                  </div>
                )
              ) : (
                <div className="grid gap-3 sm:gap-4 xl:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {boardColumns.map((column) => (
                    <div
                      key={column.key}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:p-4 space-y-2 sm:space-y-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{column.title}</p>
                        <p className="text-xs text-muted-foreground">{column.description}</p>
                      </div>
                      {boardData[column.key as keyof typeof boardData].length ? (
                        boardData[column.key as keyof typeof boardData].map((resource) => (
                          <ResourceBoardCard
                            key={resource.id}
                            resource={resource}
                            onNavigate={() => navigate(`/resources/${resource.id}`)}
                            onEdit={() => handleEditResource(resource)}
                            onDelete={() => setResourceToDelete(resource)}
                            onStatusChange={(status) => handleStatusChange(resource, status)}
                            updating={updatingStatusId === resource.id}
                          />
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs text-muted-foreground">
                          Nenhum item aqui ainda
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/5 bg-card rounded-xl">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      Fila de leitura
                    </p>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Clock className="h-5 w-5 text-[#780606]" />
                      Em progresso
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {readingQueue.length ? (
                  readingQueue.map((resource) => {
                    const Icon = formatIcons[resource.format] || FileText;
                    return (
                      <div
                        key={resource.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3"
                      >
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white line-clamp-1">{resource.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Atualizado em {formatDate(resource.updatedAt ?? resource.createdAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-white"
                          onClick={() => navigate(`/resources/${resource.id}`)}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nada em leitura por enquanto. Escolha um item e marque como “lendo”.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-card rounded-xl">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      Distribuição
                    </p>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="h-5 w-5 text-[#780606]" />
                      Formatos
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formatBreakdown.map((item) => (
                  <div key={item.value} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.label}</span>
                      <span>
                        {item.count} • {item.percent}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-[#780606] rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-card rounded-xl">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      Timeline
                    </p>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Sparkles className="h-5 w-5 text-[#780606]" />
                      Últimas conquistas
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentlyAdded.length ? (
                  recentlyAdded.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3"
                    >
                      <div className="text-xs text-muted-foreground w-16">
                        {formatDate(resource.createdAt ?? resource.updatedAt)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white line-clamp-1">{resource.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {
                            statusTokens[resource.status as keyof typeof statusTokens]?.label ??
                            'Em progresso'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 text-muted-foreground hover:text-white"
                          onClick={() => handleEditResource(resource)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 text-muted-foreground hover:text-white"
                          onClick={() => navigate(`/resources/${resource.id}`)}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Adicione recursos para ver a linha do tempo aqui.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Construa sua biblioteca"
          description="Adicione livros, artigos, podcasts e vídeos que deseja estudar. Vamos ajudar a organizar tudo."
          actionLabel="Cadastrar primeiro recurso"
          onAction={handleOpenCreateForm}
        />
      )}

      <ResourceFormSheet
        isOpen={isFormOpen}
        mode={formMode}
        state={formState}
        onClose={closeForm}
        onChange={handleFormChange}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteDialog
        resource={resourceToDelete}
        onCancel={() => setResourceToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

type ResourceCardProps = {
  resource: CourseResource;
  onNavigate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ResourceFormState['status']) => void;
  updating: boolean;
};

function ResourceListCard({
  resource,
  onNavigate,
  onEdit,
  onDelete,
  onStatusChange,
  updating,
}: ResourceCardProps) {
  const Icon = formatIcons[resource.format] || FileText;
  const tags = parseTags(resource.tags);
  const progress = calculateAutoProgress(resource);
  const statusToken =
    statusTokens[resource.status as keyof typeof statusTokens] ?? statusTokens.a_fazer;

  return (
    <article className="rounded-xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-[#780606]/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex flex-1 gap-4">
          <div className="h-14 w-14 flex-shrink-0 rounded-2xl bg-white/5 text-muted-foreground flex items-center justify-center">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-white">{resource.title}</p>
              {resource.url && (
                <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Possui link
                </span>
              )}
            </div>
            {resource.author && (
              <p className="text-sm text-muted-foreground">por {resource.author}</p>
            )}
            {resource.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1">
                <Bookmark className="h-3 w-3" />
                {resource.format}
              </span>
              <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs', statusToken.badge)}>
                <BookmarkCheck className="h-3 w-3" />
                {statusToken.label}
              </span>
              <span>{formatDate(resource.updatedAt ?? resource.createdAt)}</span>
            </div>
            {(Array.isArray(tags) && tags.length > 0 || progress > 0) && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {Array.isArray(tags) && tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
                {Array.isArray(tags) && tags.length > 4 && (
                  <span className="opacity-70">+{tags.length - 4} tags</span>
                )}
                {progress > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-28 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-[#780606] rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-white font-semibold">{progress}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:w-56">
          <select
            value={resource.status}
            disabled={updating}
            onChange={(event) =>
              onStatusChange(event.target.value as ResourceFormState['status'])
            }
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
            aria-label="Alterar status do recurso"
          >
            <option value="a_fazer">Na fila</option>
            <option value="lendo">Em leitura</option>
            <option value="concluido">Concluído</option>
          </select>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 text-muted-foreground hover:text-white"
              onClick={onNavigate}
            >
              <ArrowUpRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 text-muted-foreground hover:text-white"
              onClick={() => resource.url && window.open(resource.url, '_blank', 'noopener')}
              disabled={!resource.url}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 text-muted-foreground hover:text-white"
              onClick={onEdit}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 text-red-400 hover:text-red-300"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ResourceBoardCard({
  resource,
  onNavigate,
  onEdit,
  onDelete,
  onStatusChange,
  updating,
}: ResourceCardProps) {
  const Icon = formatIcons[resource.format] || FileText;
  const progress = calculateAutoProgress(resource);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">{resource.title}</p>
          {resource.author && (
            <p className="text-xs text-muted-foreground line-clamp-1">{resource.author}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 text-muted-foreground hover:text-white"
          onClick={onNavigate}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        {resource.format}
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-[#780606] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-white font-semibold">{progress}%</span>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={resource.status}
          disabled={updating}
          onChange={(event) =>
            onStatusChange(event.target.value as ResourceFormState['status'])
          }
          className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
          aria-label="Alterar status do recurso"
        >
          <option value="a_fazer">Na fila</option>
          <option value="lendo">Em leitura</option>
          <option value="concluido">Concluído</option>
        </select>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 text-muted-foreground hover:text-white"
            onClick={onEdit}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 text-red-400 hover:text-red-300"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

type ResourceFormSheetProps = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  state: ResourceFormState;
  onClose: () => void;
  onChange: (field: keyof ResourceFormState, value: string | number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

function ResourceFormSheet({
  isOpen,
  mode,
  state,
  onClose,
  onChange,
  onSubmit,
  isSubmitting,
}: ResourceFormSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 xs:p-4"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))'
      }}
    >
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative z-[10000] w-full max-w-3xl max-h-[85vh] sm:max-h-[90vh] rounded-xl border border-white/10 bg-card overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-3 top-3 sm:right-5 sm:top-5 text-muted-foreground hover:text-white z-10"
          onClick={onClose}
          aria-label="Fechar formulário"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1">
          <div className="space-y-4 sm:space-y-6">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#780606]">
              {mode === 'create' ? 'Novo recurso' : 'Editar recurso'}
            </p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-light text-white leading-tight">
              {mode === 'create' ? 'Adicionar à biblioteca' : 'Aprimorar informações'}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Título *
              </label>
              <Input
                value={state.title}
                onChange={(event) => onChange('title', event.target.value)}
                placeholder="Ex: Design Patterns"
                className="bg-white/5 text-white placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Autor
              </label>
              <Input
                value={state.author}
                onChange={(event) => onChange('author', event.target.value)}
                placeholder="Opcional"
                className="bg-white/5 text-white placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Formato
              </label>
              <select
                value={state.format}
                onChange={(event) => onChange('format', event.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                aria-label="Formato do recurso"
              >
                <option value="Livro">Livro</option>
                <option value="PDF">PDF</option>
                <option value="Video">Vídeo</option>
                <option value="Audio">Áudio</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Status
              </label>
              <select
                value={state.status}
                onChange={(event) =>
                  onChange('status', event.target.value as ResourceFormState['status'])
                }
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                aria-label="Status do recurso"
              >
                <option value="a_fazer">Na fila</option>
                <option value="lendo">Em leitura</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                URL
              </label>
              <Input
                value={state.url}
                onChange={(event) => onChange('url', event.target.value)}
                placeholder="https://..."
                className="bg-white/5 text-white placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Tags (separe por vírgula)
              </label>
              <Input
                value={state.tags}
                onChange={(event) => onChange('tags', event.target.value)}
                placeholder="estratégia, redes, ux"
                className="bg-white/5 text-white placeholder:text-muted-foreground"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Descrição
              </label>
              <textarea
                value={state.description}
                onChange={(event) => onChange('description', event.target.value)}
                placeholder="Por que este recurso é importante para o seu estudo?"
                className="w-full min-h-[100px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#780606]"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Notas pessoais
              </label>
              <textarea
                value={state.notes}
                onChange={(event) => onChange('notes', event.target.value)}
                placeholder="Resumo rápido, insights ou direcionamentos"
                className="w-full min-h-[100px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#780606]"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="outline" className="text-muted-foreground" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="bg-[#780606] hover:bg-[#780606]/90 text-white"
            >
              {isSubmitting ? 'Salvando...' : mode === 'create' ? 'Adicionar' : 'Atualizar'}
            </Button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

type ConfirmDeleteDialogProps = {
  resource: CourseResource | null;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

function ConfirmDeleteDialog({ resource, onCancel, onConfirm, isDeleting }: ConfirmDeleteDialogProps) {
  if (!resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <Trash2 className="h-5 w-5" />
          <div>
            <p className="text-lg font-semibold text-white">Remover recurso</p>
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Tem certeza de que deseja remover{' '}
          <span className="text-white font-medium">{resource.title}</span> da biblioteca?
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" className="text-muted-foreground" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            className="bg-red-500 text-white hover:bg-red-500/90"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Removendo...' : 'Remover'}
          </Button>
        </div>
      </div>
    </div>
  );
}
