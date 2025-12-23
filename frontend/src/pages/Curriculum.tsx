import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenCheck,
  Target,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Circle,
  Activity,
  Sparkles,
  ListChecks,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useCourse } from '../contexts/CourseContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { LoadingSkeleton } from '../components/feedback/LoadingStates';
import { useToast } from '../components/feedback/ToastSystem';
import { ContextualHelp } from '../components/help/ContextualHelp';
import { Modal } from '../components/ui/modal';
import { cn } from '../lib/utils';
import api from '../lib/api';

type ModuleStatus = 'locked' | 'active' | 'completed' | string;

type ModuleMilestone = {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
};

type CurriculumModule = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  order?: number | null;
  progress?: number | null;
  status: ModuleStatus;
  block?: string | null;
  milestones?: string | null;
};

type ModuleFormState = {
  id?: string;
  title: string;
  code: string;
  description: string;
  block: string;
  status: ModuleStatus;
  milestonesInput: string;
  progress: number;
};

const curriculumHelp = [
  {
    id: 'curriculum-1',
    title: 'Organize seus blocos',
    content:
      'Use blocos para agrupar módulos por tema ou sprint. Clique em um bloco para filtrar rapidamente o que precisa ser estudado agora.',
  },
  {
    id: 'curriculum-2',
    title: 'Marcos de domínio',
    content:
      'Cada módulo pode ter marcos personalizados. Marque-os conforme avança e deixamos o progresso atualizado automaticamente.',
  },
  {
    id: 'curriculum-3',
    title: 'Integração com projetos',
    content:
      'Ao concluir um módulo, conecte-o a um projeto (PoW) para demonstrar o conhecimento aplicado.',
  },
];

const defaultMilestones = ['Fundamentos', 'Prática guiada', 'Projeto aplicado'];

const formatBlockLabel = (value?: string | null) => value?.trim() || 'Trilha principal';

const parseMilestones = (raw?: string | null): ModuleMilestone[] => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item, index) => {
          if (typeof item === 'string') {
            return { id: `m-${index}`, title: item, completed: false };
          }
          if (typeof item === 'object' && item !== null) {
            return {
              id: item.id ?? `m-${index}`,
              title: item.title ?? `Marco ${index + 1}`,
              description: item.description ?? '',
              completed: Boolean(item.completed),
            };
          }
          return null;
        })
        .filter(Boolean) as ModuleMilestone[];
    }
  } catch (error) {
    console.warn('Failed to parse milestones', error);
  }
  return [];
};

const serializeMilestones = (items: ModuleMilestone[]) => JSON.stringify(items);

const calculateProgressFromMilestones = (milestones: ModuleMilestone[]): number => {
  if (!milestones || milestones.length === 0) return 0;
  const completed = milestones.filter((m) => m.completed).length;
  return Math.round((completed / milestones.length) * 100);
};

const moduleFormDefaults: ModuleFormState = {
  title: '',
  code: '',
  description: '',
  block: '',
  status: 'active',
  milestonesInput: defaultMilestones.join('\n'),
  progress: 0,
};

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

export default function Curriculum() {
  const navigate = useNavigate();
  
  // Todos os hooks devem ser chamados antes de qualquer retorno condicional
  // useCourse pode lançar um erro se não estiver dentro do provider, mas isso é esperado
  // e será tratado no componente de erro do provider ou no App.tsx
  const courseContext = useCourse();
  const { courseData, loading, refreshCourseData } = courseContext;
  const { success, error: showError } = useToast();

  const curriculum = courseData.curriculum;
  const modules = useMemo(
    () => curriculum as CurriculumModule[],
    [curriculum]
  );

  const [selectedBlock, setSelectedBlock] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingModuleId, setUpdatingModuleId] = useState<string | null>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleFormMode, setModuleFormMode] = useState<'create' | 'edit'>('create');
  const [moduleForm, setModuleForm] = useState<ModuleFormState>({ ...moduleFormDefaults });
  const [shouldUpdateMilestones, setShouldUpdateMilestones] = useState(true);
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [confirmDeleteModule, setConfirmDeleteModule] = useState<CurriculumModule | null>(null);
  const [isDeletingModule, setIsDeletingModule] = useState(false);
  const [modulesCollapsed, setModulesCollapsed] = useState(false);
  const formFieldIds = {
    title: 'new-module-title',
    code: 'new-module-code',
    description: 'new-module-description',
    block: 'new-module-block',
    status: 'new-module-status',
    milestones: 'new-module-milestones',
    progress: 'new-module-progress',
  };

  const resetModuleForm = () => {
    setModuleForm({ ...moduleFormDefaults });
    setModuleFormMode('create');
    setShouldUpdateMilestones(true);
  };

  const openCreateModal = () => {
    resetModuleForm();
    setShowModuleModal(true);
  };

  const openEditModal = (module: CurriculumModule) => {
    const milestones = parseMilestones(module.milestones);
    setModuleForm({
      id: module.id,
      title: module.title ?? '',
      code: module.code ?? '',
      description: module.description ?? '',
      block: module.block ?? '',
      status: module.status,
      milestonesInput:
        milestones.length > 0
          ? milestones.map((item) => item.title).join('\n')
          : defaultMilestones.join('\n'),
      progress: milestones.length > 0 
        ? calculateProgressFromMilestones(milestones)
        : (module.progress ?? 0),
    });
    setModuleFormMode('edit');
    setShouldUpdateMilestones(false);
    setShowModuleModal(true);
  };

  const handleModuleFieldChange = (field: keyof ModuleFormState, value: string | number) => {
    setModuleForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildMilestonesPayload = () => {
    const milestoneLines = moduleForm.milestonesInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const milestones = milestoneLines.length > 0 ? milestoneLines : defaultMilestones;
    return milestones.map((title, index) => ({
      id: moduleFormMode === 'edit' ? `edit-${moduleForm.id}-${index}` : `custom-${Date.now()}-${index}`,
      title,
      completed: false,
    }));
  };

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) {
      showError('O título do módulo é obrigatório.');
      return;
    }

    setIsSavingModule(true);
    try {
      // Sempre construir milestones para garantir que o backend calcule o progresso
      const milestonesPayload = buildMilestonesPayload();
      
      const payload: Record<string, unknown> = {
        code: moduleForm.code.trim() || undefined,
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim() || null,
        status: moduleForm.status,
        block: moduleForm.block.trim() || null,
        milestones: JSON.stringify(milestonesPayload), // Sempre enviar milestones
      };

      if (moduleFormMode === 'create') {
        await api.post('/curriculum', payload);
        success('Módulo criado com sucesso!');
      } else if (moduleForm.id) {
        await api.patch(`/curriculum/${moduleForm.id}`, payload);
        success('Módulo atualizado com sucesso!');
      }

      await refreshCourseData();
      setShowModuleModal(false);
      resetModuleForm();
    } catch (error: unknown) {
      console.error('Failed to save module', error);
      const axiosError = error as { 
        response?: { 
          data?: { 
            error?: string; 
            details?: string;
            code?: string;
          }; 
          status?: number 
        }; 
        message?: string; 
        name?: string 
      };
      
      // Tratar erros de rede
      if (axiosError?.name === 'NetworkError' || axiosError?.message?.includes('Network Error')) {
        showError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        return;
      }
      
      // Tratar erro de falta de curso
      if (axiosError?.response?.status === 404) {
        const responseData = axiosError?.response?.data as {
          error?: string;
          requiresCourseCreation?: boolean;
        } | undefined;
        const errorText = responseData?.error?.toLowerCase() || '';

        if (responseData?.requiresCourseCreation || errorText.includes('no course')) {
          showError('Você precisa criar um curso antes de adicionar módulos. Use o botão "Criar Curso" no topo para adicionar um curso.');
          return;
        }

        if (errorText.includes('no major') || errorText.includes('major selected')) {
          showError('Você precisa criar um curso primeiro. Vá para Configurações Iniciais para criar seu curso.');
          return;
        }
        if (errorText.includes('user not found')) {
          showError('Usuário não encontrado. Por favor, faça login novamente.');
          return;
        }
      }
      
      // Tratar erro de foreign key (usuário não existe)
      if (axiosError?.response?.status === 400) {
        const errorText = axiosError?.response?.data?.error?.toLowerCase() || '';
        if (errorText.includes('invalid user') || errorText.includes('user id')) {
          showError('Usuário não encontrado no banco de dados. Por favor, faça login novamente.');
          return;
        }
      }
      
      // Mostrar detalhes do erro se disponível
      const errorDetails = axiosError?.response?.data?.details || '';
      const errorCode = axiosError?.response?.data?.code || '';
      let errorMessage = axiosError?.response?.data?.error || axiosError?.message || 'Não foi possível salvar o módulo.';
      
      // Se houver detalhes, adicionar à mensagem
      if (errorDetails) {
        errorMessage += ` (${errorDetails})`;
      }
      
      // Se for erro de schema do banco, sugerir migration
      if (errorCode === 'P2021' || errorDetails?.includes('no such column') || errorDetails?.includes('userId')) {
        errorMessage = 'O banco de dados precisa ser atualizado. Execute: cd backend && npx prisma migrate dev';
      }
      
      // Se for erro de foreign key constraint
      if (errorCode === 'P2003' || errorMessage.includes('Foreign key constraint')) {
        errorMessage = 'Erro ao criar módulo: usuário não encontrado. Por favor, faça login novamente.';
      }
      
      showError(errorMessage);
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!confirmDeleteModule) return;
    setIsDeletingModule(true);
    try {
      await api.delete(`/curriculum/${confirmDeleteModule.id}`);
      await refreshCourseData();
      success('Módulo removido com sucesso!');
    } catch (error) {
      console.error('Failed to delete module', error);
      showError('Não foi possível remover o módulo.');
    } finally {
      setIsDeletingModule(false);
      setConfirmDeleteModule(null);
    }
  };

  const stats = useMemo(() => {
    if (!modules.length) {
      return { total: 0, active: 0, completed: 0, locked: 0, progress: 0 };
    }
    const active = modules.filter((mod) => mod.status === 'active').length;
    const completed = modules.filter((mod) => mod.status === 'completed').length;
    const locked = modules.filter((mod) => mod.status === 'locked').length;
    const progress = Math.round(
      modules.reduce((acc, mod) => acc + (mod.progress ?? 0), 0) / modules.length
    );
    return { total: modules.length, active, completed, locked, progress };
  }, [modules]);

  const blockSummary = useMemo(() => {
    const summary = modules.reduce<Record<
      string,
      { label: string; total: number; active: number; completed: number }
    >>((acc, module) => {
      const label = formatBlockLabel(module.block);
      if (!acc[label]) {
        acc[label] = { label, total: 0, active: 0, completed: 0 };
      }
      acc[label].total += 1;
      if (module.status === 'active') acc[label].active += 1;
      if (module.status === 'completed') acc[label].completed += 1;
      return acc;
    }, {});
    return Object.values(summary).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [modules]);

  const blockOptions = useMemo(() => blockSummary.map((block) => block.label), [blockSummary]);

  const filteredModules = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return modules
      .filter((module) => {
        if (selectedBlock === 'todos') return true;
        return formatBlockLabel(module.block) === selectedBlock;
      })
      .filter((module) => {
        if (!normalizedSearch) return true;
        return (
          module.title.toLowerCase().includes(normalizedSearch) ||
          module.code.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [modules, selectedBlock, searchTerm]);

  const handleMilestoneToggle = async (module: CurriculumModule, milestoneId: string) => {
    const milestones = parseMilestones(module.milestones);
    const updated = milestones.map((item) =>
      item.id === milestoneId ? { ...item, completed: !item.completed } : item
    );
    // O backend calcula o progresso automaticamente baseado nos marcos completados
    setUpdatingModuleId(module.id);
    try {
      await api.patch(`/curriculum/${module.id}`, {
        milestones: serializeMilestones(updated),
      });
      await refreshCourseData();
      success('Marco atualizado! O progresso foi recalculado automaticamente.');
    } catch (error) {
      console.error('Failed to update milestones', error);
      showError('Não foi possível atualizar os marcos.');
    } finally {
      setUpdatingModuleId(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton variant="grid" count={6} />;
  }

  return (
    <div className="cv-section space-y-6">
      <Card className="relative overflow-hidden border border-white/5 bg-card rounded-xl group">
        <div className="absolute right-0 top-0 h-64 w-64 opacity-[0.02] pointer-events-none">
          <BookOpenCheck className="h-full w-full" />
        </div>
        <CardHeader className="p-4 sm:p-6 lg:p-8 xl:p-10 pb-4 sm:pb-6 xl:pb-8">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <p className="text-xs sm:text-sm xl:text-base font-mono uppercase tracking-[0.3em] text-[#780606]">Curriculum Vivo</p>
              <ContextualHelp section="curriculum" helpItems={curriculumHelp} />
            </div>
          </div>
          {/* Major title removed - no longer part of CourseData */}
          <div className="flex items-start gap-3 mb-3 sm:mb-4 xl:mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-serif font-light leading-tight tracking-tight text-white flex-1">
              Curriculum Vivo
            </h1>
          </div>
          <p className="text-muted-foreground max-w-lg text-xs sm:text-sm xl:text-base leading-relaxed font-light">
            Planeje sua evolução por blocos, destrave módulos, monitore marcos e conecte o aprendizado às entregas práticas (PoW).
          </p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 lg:px-8 xl:px-10 pb-4 sm:pb-6 lg:pb-8 xl:pb-10 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 xl:gap-5 mb-3 sm:mb-4 lg:mb-6 xl:mb-8">
            <Card density="compact" className="bg-card border border-white/5 rounded-xl">
              <CardContent className="flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 h-full min-h-[100px] sm:min-h-[120px]">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#780606]/10 flex items-center justify-center mb-2 sm:mb-3">
                  <ListChecks className="h-5 w-5 sm:h-6 sm:w-6 text-[#780606] stroke-[1.5]" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{stats.total}</p>
                <p className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground text-center">Módulos</p>
              </CardContent>
            </Card>
            <Card density="compact" className="bg-card border border-white/5 rounded-xl">
              <CardContent className="flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 h-full min-h-[100px] sm:min-h-[120px]">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#780606]/10 flex items-center justify-center mb-2 sm:mb-3">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-[#780606] stroke-[1.5]" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{stats.active}</p>
                <p className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground text-center">Em andamento</p>
              </CardContent>
            </Card>
            <Card density="compact" className="bg-card border border-white/5 rounded-xl">
              <CardContent className="flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 h-full min-h-[100px] sm:min-h-[120px]">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#780606]/10 flex items-center justify-center mb-2 sm:mb-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#780606] stroke-[1.5]" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{stats.completed}</p>
                <p className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground text-center">Dominados</p>
              </CardContent>
            </Card>
            <Card density="compact" className="bg-card border border-white/5 rounded-xl">
              <CardContent className="flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 h-full min-h-[100px] sm:min-h-[120px]">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#780606]/10 flex items-center justify-center mb-2 sm:mb-3">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-[#780606] stroke-[1.5]" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{stats.progress}%</p>
                <p className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground text-center">Progresso médio</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 xl:gap-5">
            <Button 
              variant="default" 
              className="bg-[#780606] hover:bg-[#780606]/90 text-white font-medium shadow-[0_0_20px_#7806064D] rounded-lg px-4 py-3 sm:px-8 sm:py-6 xl:px-10 xl:py-7 transition-none text-sm sm:text-base xl:text-lg touch-manipulation" 
              style={{ minHeight: '44px' }}
              onClick={openCreateModal}
            >
              <span className="hidden sm:inline">NOVO MÓDULO</span>
              <span className="sm:hidden">NOVO</span>
              <Plus className="ml-2 h-4 w-4 xl:h-5 xl:w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-card border border-white/5 rounded-xl">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                Filtrar e priorizar
              </p>
              <CardTitle className="text-base sm:text-lg font-semibold text-white">Módulos do Currículo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 space-y-3 sm:space-y-4">
            {blockSummary.length > 0 && (
              <div className="grid gap-3 sm:gap-4 xl:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {blockSummary.map((block) => (
                  <button
                    key={block.label}
                    type="button"
                    onClick={() => setSelectedBlock(block.label)}
                    className={cn(
                      'rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:p-4 text-left transition-none hover:border-[#780606]/40 touch-manipulation',
                      selectedBlock === block.label && 'border-[#780606]/60 bg-[#780606]/5'
                    )}
                    style={{ minHeight: '44px' }}
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                      <span className="truncate">{block.label}</span>
                      <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#780606] flex-shrink-0 ml-2" />
                    </div>
                    <p className="text-xl sm:text-2xl font-semibold text-white">{block.total}</p>
                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-amber-400 flex-shrink-0" />
                        {block.active} ativos
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                        {block.completed} concluídos
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {modules.length === 0 ? (
          <Card className="bg-card border border-white/5 rounded-xl">
            <CardContent className="p-12 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#780606]/40 bg-[#780606]/10 text-[#780606]">
                <ListChecks className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Comece mapeando seus módulos</h3>
              <p className="text-sm text-muted-foreground">
                Crie blocos, organize marcos e acompanhe o progresso em tempo real. Esta visão já está pronta para CRUD completo.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button onClick={openCreateModal} className="bg-[#780606] hover:bg-[#780606]/85 text-white transition-none">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar módulo
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border border-white/5 rounded-xl">
            <CardHeader className="p-6 pb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                  Grade Curricular
                </p>
                <CardTitle className="text-lg font-semibold text-white">Módulos</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModulesCollapsed((prev) => !prev)}
                className="h-9 text-xs bg-white/[0.02] border-white/10 hover:bg-white/10"
              >
                {modulesCollapsed ? 'Expandir' : 'Minimizar'}
              </Button>
            </CardHeader>
            {!modulesCollapsed && (
              <CardContent className="px-6 pb-6 pt-0 space-y-4">
                {filteredModules.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-10 text-center text-muted-foreground">
                    Nenhum módulo corresponde aos filtros ativos.
                  </div>
                ) : (
                  filteredModules.map((module) => {
                    const milestones = parseMilestones(module.milestones);
                    return (
                      <div
                        key={module.id}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-4 hover:border-[#780606]/40 transition-none"
                      >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                              {module.code}
                            </p>
                            {module.block && (
                              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                • {formatBlockLabel(module.block)}
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl font-semibold text-white">{module.title}</h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            {module.description || 'Sem descrição detalhada.'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(module)}
                              className="hover:text-white text-muted-foreground transition-none"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDeleteModule(module)}
                              className="text-red-300 hover:text-red-200 transition-none"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remover
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/curriculum/${module.id}`)}
                              className="rounded-full hover:bg-[#780606]/10 hover:text-[#780606] transition-none"
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progresso (calculado automaticamente)</span>
                          <span className="text-white font-semibold">
                            {(() => {
                              const calculatedProgress = milestones.length > 0 
                                ? calculateProgressFromMilestones(milestones)
                                : (module.progress ?? 0);
                              return calculatedProgress;
                            })()}%
                          </span>
                        </div>
                        <SolidProgressBar value={(() => {
                          const calculatedProgress = milestones.length > 0 
                            ? calculateProgressFromMilestones(milestones)
                            : (module.progress ?? 0);
                          return calculatedProgress;
                        })()} />
                      </div>

                      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#780606]" />
                            Marcos de domínio
                          </p>
                          {milestones.length > 0 ? (
                            <div className="space-y-2">
                              {milestones.map((milestone) => (
                                <button
                                  key={milestone.id}
                                  type="button"
                                  onClick={() => handleMilestoneToggle(module, milestone.id)}
                                  className={cn(
                                    'w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-none',
                                    milestone.completed
                                      ? 'border-emerald-400/40 bg-emerald-500/5 text-white'
                                      : 'border-white/5 bg-white/[0.02] text-muted-foreground hover:border-white/30 hover:text-white'
                                  )}
                                  disabled={updatingModuleId === module.id}
                                >
                                  {milestone.completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold">
                                      {milestone.title}
                                    </p>
                                    {milestone.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {milestone.description}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-white/5 bg-white/[0.02] p-4 text-sm text-muted-foreground">
                              Nenhum marco cadastrado para este módulo.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
            )}
          </Card>
        )}
      </div>

      <Modal
        isOpen={showModuleModal}
        onClose={() => {
          if (!isSavingModule) {
            setShowModuleModal(false);
            resetModuleForm();
          }
        }}
        title={moduleFormMode === 'create' ? 'Novo módulo' : 'Editar módulo'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={formFieldIds.title} className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Título *
              </label>
              <Input
                id={formFieldIds.title}
                value={moduleForm.title}
                onChange={(event) => handleModuleFieldChange('title', event.target.value)}
                placeholder="Ex: Algoritmos I"
                className="bg-white/[0.02] border-white/10 text-white"
              />
            </div>
            <div>
              <label htmlFor={formFieldIds.code} className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Código
              </label>
              <Input
                id={formFieldIds.code}
                value={moduleForm.code}
                onChange={(event) => handleModuleFieldChange('code', event.target.value)}
                placeholder="Ex: CS101"
                className="bg-white/[0.02] border-white/10 text-white"
              />
            </div>
          </div>
          <div>
            <label htmlFor={formFieldIds.description} className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              Descrição
            </label>
            <textarea
              id={formFieldIds.description}
              value={moduleForm.description}
              onChange={(event) => handleModuleFieldChange('description', event.target.value)}
              placeholder="Resumo do que será dominado neste módulo..."
              className="w-full min-h-[100px] rounded-md bg-white/[0.02] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#780606]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={formFieldIds.block} className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Bloco
              </label>
              <Input
                id={formFieldIds.block}
                value={moduleForm.block}
                onChange={(event) => handleModuleFieldChange('block', event.target.value)}
                placeholder="Ex: Bloco 1 - Fundamentos"
                className="bg-white/[0.02] border-white/10 text-white"
              />
            </div>
            <div>
              <label htmlFor={formFieldIds.status} className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Status inicial
              </label>
              <select
                id={formFieldIds.status}
                value={moduleForm.status}
                onChange={(event) => handleModuleFieldChange('status', event.target.value)}
                className="w-full h-10 rounded-md bg-white/[0.02] border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
              >
                <option value="active">Ativo</option>
                <option value="locked">Bloqueado</option>
                <option value="completed">Concluído</option>
              </select>
            </div>
          </div>
          {moduleFormMode === 'edit' && (
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              <input
                type="checkbox"
                checked={shouldUpdateMilestones}
                onChange={(event) => setShouldUpdateMilestones(event.target.checked)}
                className="accent-[#780606]"
              />
              Atualizar marcos (o progresso será recalculado automaticamente)
            </label>
          )}
          {(moduleFormMode === 'create' || shouldUpdateMilestones) && (
            <div>
              <label htmlFor={formFieldIds.milestones} className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                Marcos (um por linha)
              </label>
              <textarea
                id={formFieldIds.milestones}
                value={moduleForm.milestonesInput}
                onChange={(event) => handleModuleFieldChange('milestonesInput', event.target.value)}
                className="w-full min-h-[120px] rounded-md bg-white/[0.02] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#780606]"
              />
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (!isSavingModule) {
                  setShowModuleModal(false);
                  resetModuleForm();
                }
              }}
              disabled={isSavingModule}
              className="transition-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveModule}
              disabled={!moduleForm.title.trim() || isSavingModule}
              className="bg-[#780606] hover:bg-[#780606]/90 text-white transition-none"
            >
              {isSavingModule ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {moduleFormMode === 'create' ? 'Criar' : 'Salvar'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(confirmDeleteModule)}
        onClose={() => {
          if (!isDeletingModule) {
            setConfirmDeleteModule(null);
          }
        }}
        title="Remover módulo"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover <span className="text-white font-semibold">{confirmDeleteModule?.title}</span>? Essa ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setConfirmDeleteModule(null)} disabled={isDeletingModule} className="transition-none">
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteModule}
              disabled={isDeletingModule}
              className="bg-red-600 hover:bg-red-500 text-white transition-none"
            >
              {isDeletingModule ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover módulo'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}