import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCourse } from '../contexts/CourseContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  ArrowLeft,
  Play,
  BookOpen,
  Rocket,
  Edit3,
  Save,
  X,
  CheckCircle2,
  Layers,
  FileText,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { cn } from '../lib/utils';

const ProgressBar = ({ value }: { value: number }) => {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full bg-[#780606] transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Em andamento',
  completed: 'Concluído',
  locked: 'Bloqueado',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'text-emerald-400 border-emerald-400/40 bg-emerald-500/5',
  completed: 'text-blue-400 border-blue-400/40 bg-blue-500/5',
  locked: 'text-muted-foreground border-white/10 bg-white/[0.02]',
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Em andamento' },
  { value: 'locked', label: 'Bloqueado' },
  { value: 'completed', label: 'Concluído' },
];

export default function BlockDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courseData, refreshCourseData } = useCourse();
  const [block, setBlock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBlock, setEditedBlock] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '', content: '' });
  const [isEditingSyllabus, setIsEditingSyllabus] = useState(false);
  const [editedSyllabus, setEditedSyllabus] = useState('');

  const calculateProgressFromTopics = (topics: any[]): number => {
    if (!topics || topics.length === 0) return 0;
    const completed = topics.filter((topic) => topic.status === 'completed').length;
    return Math.round((completed / topics.length) * 100);
  };

  useEffect(() => {
    if (id) {
      fetchBlockDetails();
    }
  }, [id]);

  useEffect(() => {
    if (block?.topics && block.topics.length > 0) {
      const autoProgress = calculateProgressFromTopics(block.topics);
      if (autoProgress !== block.progress) {
        // Update progress automatically
        api.patch(`/curriculum/${id}`, { progress: autoProgress }).catch(console.error);
        setBlock((prev: any) => (prev ? { ...prev, progress: autoProgress } : prev));
        setEditedBlock((prev: any) => (prev ? { ...prev, progress: autoProgress } : prev));
      }
    }
  }, [block?.topics, id]);

  const fetchBlockDetails = async () => {
    try {
      const response = await api.get(`/curriculum/${id}`);
      setBlock(response.data);
      setEditedBlock(response.data);
      setEditedSyllabus(response.data.syllabus || '');
    } catch (error) {
      console.error('Failed to fetch block details:', error);
      if (courseData) {
        const found = courseData.curriculum.find((c) => c.id === id);
        if (found) {
          setBlock(found);
          setEditedBlock(found);
          setEditedSyllabus((found as any).syllabus || '');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.title.trim() || !id) return;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const response = await api.post('/topics', {
        curriculumId: id,
        title: newTopic.title.trim(),
        description: newTopic.description.trim() || null,
        content: newTopic.content.trim() || null,
      });
      await fetchBlockDetails();
      await refreshCourseData();
      setNewTopic({ title: '', description: '', content: '' });
      setIsAddingTopic(false);
      setStatusMessage('Tópico adicionado. Progresso atualizado automaticamente.');
    } catch (error) {
      console.error('Failed to add topic:', error);
      setStatusMessage('Erro ao adicionar tópico. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditSyllabus = () => {
    setEditedSyllabus(block?.syllabus || '');
    setIsEditingSyllabus(true);
  };

  const handleCancelEditSyllabus = () => {
    setEditedSyllabus(block?.syllabus || '');
    setIsEditingSyllabus(false);
  };

  const handleSaveSyllabus = async () => {
    if (!id) return;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const response = await api.patch(`/curriculum/${id}`, {
        syllabus: editedSyllabus.trim() || null,
      });
      setBlock(response.data);
      setEditedBlock(response.data);
      setIsEditingSyllabus(false);
      await refreshCourseData();
      setStatusMessage('Ementa atualizada com sucesso.');
    } catch (error) {
      console.error('Failed to save syllabus:', error);
      setStatusMessage('Erro ao salvar ementa. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = () => {
    setEditedBlock({ ...block });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedBlock(block);
    setIsEditing(false);
    setStatusMessage(null);
  };

  const handleSaveChanges = async () => {
    if (!editedBlock) return;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      // Calculate progress from topics if they exist, otherwise use manual value
      const finalProgress = editedBlock.topics && editedBlock.topics.length > 0
        ? calculateProgressFromTopics(editedBlock.topics)
        : Math.min(100, Math.max(0, Number(editedBlock.progress) || 0));

      const response = await api.patch(`/curriculum/${id}`, {
        code: editedBlock.code?.trim(),
        title: editedBlock.title?.trim(),
        description: editedBlock.description?.trim() || null,
        status: editedBlock.status,
        progress: finalProgress,
        syllabus: editedBlock.syllabus?.trim() || null,
      });
      setBlock(response.data);
      setEditedBlock(response.data);
      setIsEditing(false);
      await refreshCourseData();
      setStatusMessage('Módulo atualizado com sucesso.');
    } catch (error) {
      console.error('Failed to save changes:', error);
      setStatusMessage('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartBlock = async () => {
    if (!block) return;
    try {
      await api.put(`/curriculum/${block.id}/progress`, {
        progress: 0,
        status: 'active',
      });
      await refreshCourseData();
      await fetchBlockDetails();
    } catch (error) {
      console.error('Failed to start block:', error);
    }
  };

  if (loading || !block) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#780606]"></div>
      </div>
    );
  }

  const displayBlock = isEditing ? editedBlock : block;

  return (
    <div className="cv-section space-y-8 max-w-7xl mx-auto">
      <section className="rounded-3xl border border-white/10 bg-[#070708]/90 p-4 sm:p-6 lg:p-8 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/curriculum')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Editar módulo
                </Button>
              )}
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#780606] mb-2">
                {displayBlock.code}
              </p>
              {isEditing ? (
                <Input
                  value={displayBlock.title || ''}
                  onChange={(e) => setEditedBlock({ ...editedBlock, title: e.target.value })}
                  className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light bg-white/[0.02] border-white/10 text-white"
                />
              ) : (
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light text-white tracking-tight">
                  {displayBlock.title}
                </h1>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                    Código
                  </label>
                  <Input
                    value={displayBlock.code || ''}
                    onChange={(e) => setEditedBlock({ ...editedBlock, code: e.target.value })}
                    className="bg-white/[0.02] border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={displayBlock.description || ''}
                    onChange={(e) => setEditedBlock({ ...editedBlock, description: e.target.value })}
                    className="w-full min-h-[100px] rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                      Status
                    </label>
                    <select
                      value={displayBlock.status || 'locked'}
                      onChange={(e) => setEditedBlock({ ...editedBlock, status: e.target.value })}
                      className="w-full rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(!displayBlock.topics || displayBlock.topics.length === 0) && (
                    <div>
                      <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                        Progresso (%)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={displayBlock.progress || 0}
                        onChange={(e) =>
                          setEditedBlock({ ...editedBlock, progress: Number(e.target.value) })
                        }
                        className="bg-white/[0.02] border-white/10 text-white"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Adicione tópicos para calcular automaticamente
                      </p>
                    </div>
                  )}
                  {displayBlock.topics && displayBlock.topics.length > 0 && (
                    <div>
                      <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                        Progresso (automático)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={calculateProgressFromTopics(displayBlock.topics)}
                        disabled
                        className="bg-white/[0.02] border-white/10 text-white opacity-60"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Calculado automaticamente: {displayBlock.topics.filter((t: any) => t.status === 'completed').length} de {displayBlock.topics.length} tópicos concluídos
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="bg-[#780606] hover:bg-[#780606]/90 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
                {statusMessage && (
                  <p className={cn('text-xs', statusMessage.includes('sucesso') ? 'text-emerald-400' : 'text-red-400')}>
                    {statusMessage}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {displayBlock.description || 'Sem descrição disponível.'}
              </p>
            )}
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Progresso
                  {displayBlock.topics && displayBlock.topics.length > 0 && (
                    <span className="ml-2 text-[10px] text-emerald-400">(automático)</span>
                  )}
                </p>
                <p className="text-3xl font-semibold text-white">
                  {displayBlock.topics && displayBlock.topics.length > 0
                    ? calculateProgressFromTopics(displayBlock.topics)
                    : displayBlock.progress || 0}%
                </p>
                <ProgressBar
                  value={
                    displayBlock.topics && displayBlock.topics.length > 0
                      ? calculateProgressFromTopics(displayBlock.topics)
                      : displayBlock.progress || 0
                  }
                />
                {displayBlock.topics && displayBlock.topics.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {displayBlock.topics.filter((t: any) => t.status === 'completed').length} de {displayBlock.topics.length} tópicos concluídos
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Status
                </p>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                    STATUS_STYLES[displayBlock.status] || STATUS_STYLES.locked
                  )}
                >
                  {STATUS_LABELS[displayBlock.status] || 'Em definição'}
                </span>
              </div>
              {!isEditing && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                  {displayBlock.status === 'locked' ? (
                    <Button
                      onClick={handleStartBlock}
                      className="bg-[#780606] hover:bg-[#780606]/90 text-white w-full"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar módulo
                    </Button>
                  ) : displayBlock.status === 'active' ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/curriculum/${displayBlock.id}/topics`}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Continuar estudos
                      </Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card className="border-white/5 bg-[#050506]/90">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-white">Ementa do módulo</CardTitle>
                {!isEditingSyllabus && !isEditing && (
                  <Button variant="outline" size="sm" onClick={handleStartEditSyllabus}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    {displayBlock.syllabus ? 'Editar ementa' : 'Adicionar ementa'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingSyllabus || isEditing ? (
                <>
                  <textarea
                    value={isEditingSyllabus ? editedSyllabus : (displayBlock.syllabus || '')}
                    onChange={(e) => {
                      if (isEditingSyllabus) {
                        setEditedSyllabus(e.target.value);
                      } else {
                        setEditedBlock({ ...editedBlock, syllabus: e.target.value });
                      }
                    }}
                    placeholder="Digite a ementa completa do módulo..."
                    className="w-full min-h-[300px] rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606] font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    A ementa descreve o conteúdo programático e objetivos do módulo.
                  </p>
                  {isEditingSyllabus && (
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveSyllabus}
                        disabled={isSaving}
                        className="bg-[#780606] hover:bg-[#780606]/90 text-white"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Salvando...' : 'Salvar ementa'}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEditSyllabus} disabled={isSaving}>
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </>
              ) : displayBlock.syllabus ? (
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {displayBlock.syllabus}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhuma ementa cadastrada para este módulo.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleStartEditSyllabus}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Adicionar ementa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-[#050506]/90">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-white">Tópicos do módulo</CardTitle>
                <div className="flex items-center gap-2">
                  {!isAddingTopic && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingTopic(true)}
                      disabled={isSaving}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Novo tópico
                    </Button>
                  )}
                  {displayBlock.topics && displayBlock.topics.length > 0 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/curriculum/${displayBlock.id}/topics`}>
                        Ver todos
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAddingTopic && (
                <div className="rounded-xl border border-[#780606]/40 bg-[#780606]/5 p-4 space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                      Título do tópico *
                    </label>
                    <Input
                      value={newTopic.title}
                      onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                      placeholder="Ex: Introdução à Programação"
                      className="bg-white/[0.02] border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={newTopic.description}
                      onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                      placeholder="Breve descrição do tópico..."
                      className="w-full min-h-[80px] rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                      Conteúdo
                    </label>
                    <textarea
                      value={newTopic.content}
                      onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                      placeholder="Conteúdo detalhado do tópico (opcional)..."
                      className="w-full min-h-[120px] rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddTopic}
                      disabled={!newTopic.title.trim() || isSaving}
                      className="bg-[#780606] hover:bg-[#780606]/90 text-white"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? 'Adicionando...' : 'Adicionar tópico'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingTopic(false);
                        setNewTopic({ title: '', description: '', content: '' });
                      }}
                      disabled={isSaving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {displayBlock.topics && displayBlock.topics.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {displayBlock.topics.slice(0, 5).map((topic: any) => (
                      <div
                        key={topic.id}
                        className="rounded-xl border border-white/10 bg-white/[0.01] p-4 hover:border-[#780606]/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{topic.title}</p>
                            {topic.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {topic.description}
                              </p>
                            )}
                          </div>
                          <Link
                            to={`/topics/${topic.id}`}
                            className="ml-4 text-[#780606] hover:text-[#780606]/80"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  {displayBlock.topics.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      +{displayBlock.topics.length - 5} tópicos adicionais
                    </p>
                  )}
                </>
              ) : !isAddingTopic ? (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum tópico cadastrado para este módulo.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setIsAddingTopic(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar primeiro tópico
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {displayBlock.pow && (
            <Card className="border-white/5 bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-[#780606]" />
                  <CardTitle className="text-white">Projeto Integrador</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-1">{displayBlock.pow.title}</h3>
                  {displayBlock.pow.description && (
                    <p className="text-sm text-muted-foreground">{displayBlock.pow.description}</p>
                  )}
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/projects/${displayBlock.pow.id}`}>
                    Ver projeto completo
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-white/5 bg-card">
            <CardHeader>
              <CardTitle className="text-white">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to={`/notes?curriculum=${displayBlock.id}`}>
                  <span>Ver fichamentos</span>
                  <FileText className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to={`/library?curriculum=${displayBlock.id}`}>
                  <span>Recursos relacionados</span>
                  <Layers className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}