import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  ArrowLeft,
  FileText,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  PenTool,
  Layers,
  Edit3,
  Save,
  X,
  Trash2
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { Input } from '../components/ui/input';

const STATUS_MAP: Record<
  string,
  { label: string; badge: string; description: string; helper: string }
> = {
  not_read: {
    label: 'Não lido',
    badge: 'text-muted-foreground border-white/10 bg-white/[0.02]',
    description: 'Ainda não iniciado',
    helper: 'Comece o tópico para desbloquear anotações.'
  },
  reading: {
    label: 'Em estudo',
    badge: 'text-amber-300 border-amber-300/30 bg-amber-500/5',
    description: 'Estudo ativo',
    helper: 'Continue lendo e agregando recursos.'
  },
  completed: {
    label: 'Concluído',
    badge: 'text-emerald-300 border-emerald-300/30 bg-emerald-500/5',
    description: 'Tópico dominado',
    helper: 'Revise periodicamente para reter o conteúdo.'
  }
};

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTopic, setEditedTopic] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTopic();
    }
  }, [id]);

  const fetchTopic = async () => {
    try {
      const response = await api.get(`/topics/${id}`);
      setTopic(response.data);
      setEditedTopic(response.data);
    } catch (error) {
      console.error('Failed to fetch topic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => {
    setEditedTopic({ ...topic });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedTopic(topic);
    setIsEditing(false);
    setStatusMessage(null);
  };

  const handleSaveChanges = async () => {
    if (!editedTopic || !id) return;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const response = await api.patch(`/topics/${id}`, {
        title: editedTopic.title?.trim(),
        description: editedTopic.description?.trim() || null,
        content: editedTopic.content?.trim() || null,
        status: editedTopic.status,
      });
      setTopic(response.data);
      setEditedTopic(response.data);
      setIsEditing(false);
      setStatusMessage('Tópico atualizado com sucesso.');
    } catch (error) {
      console.error('Failed to save changes:', error);
      setStatusMessage('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !topic) return;
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o tópico "${topic.title}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setStatusMessage(null);
    try {
      await api.delete(`/topics/${id}`);
      if (topic.curriculum?.id) {
        navigate(`/curriculum/${topic.curriculum.id}`);
      } else {
        navigate('/curriculum');
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
      setStatusMessage('Erro ao excluir tópico. Tente novamente.');
      setIsDeleting(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await api.put(`/topics/${id}/status`, { status });
      setTopic((prev: any) => ({ ...prev, status }));
      if (editedTopic) {
        setEditedTopic((prev: any) => ({ ...prev, status }));
      }
      // Update curriculum progress automatically
      if (topic?.curriculum?.id) {
        try {
          const curriculumResponse = await api.get(`/curriculum/${topic.curriculum.id}`);
          const topics = curriculumResponse.data.topics || [];
          if (topics.length > 0) {
            const completed = topics.filter((t: any) => t.status === 'completed').length;
            const autoProgress = Math.round((completed / topics.length) * 100);
            await api.patch(`/curriculum/${topic.curriculum.id}`, { progress: autoProgress });
          }
        } catch (e) {
          // Silently fail - progress update is not critical
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const statusConfig = useMemo(() => {
    if (!topic) return STATUS_MAP.not_read;
    return STATUS_MAP[topic.status] || STATUS_MAP.not_read;
  }, [topic]);

  if (loading || !topic) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#780606]"></div>
      </div>
    );
  }

  const hasResources = topic.resources && topic.resources.length > 0;
  const displayTopic = isEditing ? editedTopic : topic;

  return (
    <div className="cv-section space-y-8 max-w-7xl mx-auto">
      <section className="rounded-3xl border border-white/10 bg-[#070708]/90 p-8 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {!isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleStartEdit}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Editar tópico
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
                </>
              )}
              {topic.curriculum?.id && (
                <Button variant="outline" size="sm" className="ml-auto" asChild>
                  <Link to={`/curriculum/${topic.curriculum.id}`}>
                    Ver módulo
                    <Layers className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#780606] mb-2">
                {displayTopic.curriculum?.code || 'Tópico Autônomo'}
              </p>
              {isEditing ? (
                <Input
                  value={displayTopic.title || ''}
                  onChange={(e) => setEditedTopic({ ...editedTopic, title: e.target.value })}
                  className="text-4xl font-serif font-light bg-white/[0.02] border-white/10 text-white"
                />
              ) : (
                <h1 className="text-4xl font-serif font-light text-white tracking-tight">
                  {displayTopic.title}
                </h1>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={displayTopic.description || ''}
                    onChange={(e) => setEditedTopic({ ...editedTopic, description: e.target.value })}
                    className="w-full min-h-[100px] rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                  />
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
              displayTopic.description && (
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {displayTopic.description}
                </p>
              )
            )}
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Status
                </p>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                    statusConfig.badge
                  )}
                >
                  {statusConfig.label}
                </span>
                <p className="text-xs text-muted-foreground mt-2">{statusConfig.helper}</p>
              </div>
              {!isEditing && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatus('not_read')}
                    disabled={topic.status === 'not_read'}
                    className="w-full"
                  >
                    Reiniciar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatus('reading')}
                    disabled={topic.status === 'reading'}
                    className="w-full"
                  >
                    Marcar como lendo
                  </Button>
                  <Button
                    className="bg-[#780606] hover:bg-[#780606]/90 text-white w-full"
                    size="sm"
                    onClick={() => updateStatus('completed')}
                    disabled={topic.status === 'completed'}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Concluir tópico
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">

          <Card className="border-white/5 bg-[#050506]/90">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Conteúdo do tópico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                    Conteúdo detalhado
                  </label>
                  <textarea
                    value={displayTopic.content || ''}
                    onChange={(e) => setEditedTopic({ ...editedTopic, content: e.target.value })}
                    placeholder="Digite o conteúdo detalhado do tópico..."
                    className="w-full min-h-[300px] rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606] font-mono"
                  />
                </div>
              ) : displayTopic.content ? (
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {displayTopic.content}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum conteúdo cadastrado para este tópico.
                  </p>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={handleStartEdit}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Adicionar conteúdo
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <div className="space-y-6">
          <Card className="border-white/5 bg-card">
            <CardHeader>
              <CardTitle className="text-white">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to={`/notes?topic=${topic.id}`}>
                  <span>Abrir fichamentos</span>
                  <FileText className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to={`/library?topic=${topic.id}`}>
                  <span>Buscar recursos</span>
                  <BookOpen className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link to={`/notes/new?topic=${topic.id}`}>
                  <span>Criar nota rápida</span>
                  <PenTool className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {topic.note && (
            <Card className="border-white/5 bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#780606]" />
                  <CardTitle className="text-white text-lg">Fichamento vinculado</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <h3 className="text-base font-semibold text-white">{topic.note.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {topic.note.content}
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/notes/${topic.note.id}`}>Abrir fichamento</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {hasResources && (
            <Card className="border-white/5 bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#780606]" />
                  <CardTitle className="text-white text-lg">Recursos Relacionados</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topic.resources.slice(0, 3).map((resource: any) => (
                    <div
                      key={resource.id}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1"
                    >
                      <p className="font-semibold text-white text-sm">{resource.title}</p>
                      {resource.author && (
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {resource.author}
                        </p>
                      )}
                      {resource.url && (
                        <Button variant="ghost" size="sm" className="mt-2" asChild>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            Abrir <ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                  {topic.resources.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{topic.resources.length - 3} recursos adicionais
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

