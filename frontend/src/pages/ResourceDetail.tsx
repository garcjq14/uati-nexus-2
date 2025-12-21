import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, ExternalLink, BookOpen, Plus, Edit3, Save, X, Trash2, FileText, Video, Headphones, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { useCourse } from '../contexts/CourseContext';

const formatIcons: Record<string, any> = {
  Livro: BookOpen,
  PDF: FileText,
  Video: Video,
  Audio: Headphones,
};

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshCourseData } = useCourse();
  const [resource, setResource] = useState<any>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResource, setEditedResource] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({ chapter: '', content: '' });
  const [showAddAnnotation, setShowAddAnnotation] = useState(false);
  const [progressInput, setProgressInput] = useState<number | ''>('');
  const [pagesReadInput, setPagesReadInput] = useState<string>('');
  const [totalPagesInput, setTotalPagesInput] = useState<string>('');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  useEffect(() => {
    if (id) {
      fetchResource();
      fetchAnnotations();
    }
  }, [id]);

  const fetchResource = async () => {
    try {
      const response = await api.get(`/resources/${id}`);
      setResource(response.data);
      setEditedResource(response.data);
    } catch (error) {
      console.error('Failed to fetch resource:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnotations = async () => {
    try {
      const response = await api.get(`/resources/${id}/annotations`);
      setAnnotations(response.data);
    } catch (error) {
      console.error('Failed to fetch annotations:', error);
    }
  };

  const handleStartEdit = () => {
    setEditedResource({ ...resource });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedResource(resource);
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!editedResource) return;
    setIsSaving(true);
    try {
      const response = await api.put(`/resources/${id}`, {
        title: editedResource.title?.trim(),
        author: editedResource.author?.trim() || null,
        format: editedResource.format,
        url: editedResource.url?.trim() || null,
        status: editedResource.status,
        description: editedResource.description?.trim() || null,
      });
      setResource(response.data);
      setEditedResource(response.data);
      setIsEditing(false);
      await refreshCourseData();
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o recurso "${resource.title}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await api.delete(`/resources/${id}`);
      await refreshCourseData();
      navigate('/library');
    } catch (error) {
      console.error('Failed to delete resource:', error);
      setIsDeleting(false);
    }
  };

  const addAnnotation = async () => {
    if (!newAnnotation.content.trim()) return;
    try {
      await api.post(`/resources/${id}/annotations`, newAnnotation);
      setNewAnnotation({ chapter: '', content: '' });
      setShowAddAnnotation(false);
      fetchAnnotations();
    } catch (error) {
      console.error('Failed to add annotation:', error);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await api.put(`/resources/${id}`, { status });
      setResource((prev: any) => ({ ...prev, status }));
      if (editedResource) {
        setEditedResource((prev: any) => ({ ...prev, status }));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const calculateProgress = () => {
    if (!resource || !annotations.length) return 0;
    const uniqueChapters = new Set(annotations.map(a => a.chapter).filter(Boolean));
    const estimatedChapters = resource.estimatedChapters || 10;
    const completedChapters = uniqueChapters.size;
    return Math.min(Math.round((completedChapters / estimatedChapters) * 100), 100);
  };

  const autoProgress = calculateProgress();
  const progressToShow = (isEditing ? editedResource : resource)?.progress ?? autoProgress;

  useEffect(() => {
    if (resource) {
      setProgressInput(resource.progress ?? autoProgress);
      if (resource.pagesRead) setPagesReadInput(String(resource.pagesRead));
      if (resource.estimatedChapters) setTotalPagesInput(String(resource.estimatedChapters));
    }
  }, [resource, autoProgress]);

  const handleUpdateProgressPercent = async () => {
    if (progressInput === '' || progressInput < 0) return;
    setUpdatingProgress(true);
    try {
      const progress = Math.max(0, Math.min(100, Number(progressInput)));
      const response = await api.put(`/resources/${id}`, { progress });
      setResource(response.data);
      setEditedResource(response.data);
      await refreshCourseData();
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleUpdateProgressPages = async () => {
    const read = Number(pagesReadInput);
    const total = Number(totalPagesInput);
    if (!read || !total || total <= 0) return;
    const percent = Math.min(100, Math.round((read / total) * 100));
    setUpdatingProgress(true);
    try {
      const response = await api.put(`/resources/${id}`, { progress: percent, estimatedChapters: total, pagesRead: read });
      setResource(response.data);
      setEditedResource(response.data);
      await refreshCourseData();
      setProgressInput(percent);
    } catch (error) {
      console.error('Failed to update progress by pages:', error);
    } finally {
      setUpdatingProgress(false);
    }
  };
  const displayResource = isEditing ? editedResource : resource;
  const Icon = displayResource?.format ? formatIcons[displayResource.format] || FileText : FileText;

  if (loading || !resource) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#780606]"></div>
      </div>
    );
  }

  return (
    <div className="cv-section space-y-8 max-w-7xl mx-auto">
      <section className="rounded-3xl border border-white/10 bg-[#070708]/90 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/library')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {!isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleStartEdit}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Editar recurso
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
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#780606] mb-2">
                {displayResource.format || 'Recurso'}
              </p>
              {isEditing ? (
                <Input
                  value={displayResource.title || ''}
                  onChange={(e) => setEditedResource({ ...editedResource, title: e.target.value })}
                  className="text-4xl font-serif font-light bg-white/[0.02] border-white/10 text-white"
                />
              ) : (
                <h1 className="text-4xl font-serif font-light text-white tracking-tight">
                  {displayResource.title}
                </h1>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                      Autor
                    </label>
                    <Input
                      value={displayResource.author || ''}
                      onChange={(e) => setEditedResource({ ...editedResource, author: e.target.value })}
                      className="bg-white/[0.02] border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                      Formato
                    </label>
                    <select
                      value={displayResource.format || 'Livro'}
                      onChange={(e) => setEditedResource({ ...editedResource, format: e.target.value })}
                      className="w-full h-10 rounded-md bg-white/[0.02] border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                    >
                      <option value="Livro">Livro</option>
                      <option value="PDF">PDF</option>
                      <option value="Video">Vídeo</option>
                      <option value="Audio">Áudio</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                    URL
                  </label>
                  <Input
                    type="url"
                    value={displayResource.url || ''}
                    onChange={(e) => setEditedResource({ ...editedResource, url: e.target.value })}
                    className="bg-white/[0.02] border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={displayResource.description || ''}
                    onChange={(e) => setEditedResource({ ...editedResource, description: e.target.value })}
                    className="w-full min-h-[100px] rounded-md bg-white/[0.02] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
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
              </div>
            ) : (
              displayResource.author && (
                <p className="text-sm text-muted-foreground">por {displayResource.author}</p>
              )
            )}
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-[#780606]/20 border border-[#780606]/50 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-[#780606]" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Status
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {displayResource.status === 'a_fazer' ? 'A Fazer' : displayResource.status === 'lendo' ? 'Lendo' : 'Concluído'}
                  </p>
                </div>
              </div>
              {!isEditing && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                  {['a_fazer', 'lendo', 'concluido'].map((status) => (
                    <Button
                      key={status}
                      variant={resource.status === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStatus(status)}
                      disabled={resource.status === status}
                      className={resource.status === status ? 'bg-[#780606] hover:bg-[#780606]/90 text-white' : 'w-full'}
                    >
                      {status === 'a_fazer' ? 'A Fazer' : status === 'lendo' ? 'Lendo' : 'Concluído'}
                    </Button>
                  ))}
                </div>
              )}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Progresso</span>
                  <span className="font-medium text-white">{progressToShow}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-[#780606]"
                    style={{ width: `${progressToShow}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {annotations.length > 0
                    ? `${new Set(annotations.map(a => a.chapter).filter(Boolean)).size} capítulos anotados`
                    : 'Você pode ajustar manualmente ou adicionar anotações para calcular automaticamente.'}
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={progressInput}
                      onChange={(e) => setProgressInput(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Progresso %"
                      className="w-28 bg-white/5 border-white/10 text-white"
                    />
                    <Button size="sm" onClick={handleUpdateProgressPercent} disabled={updatingProgress || progressInput === ''} className="gap-2">
                      <Save className="h-4 w-4" />
                      Aplicar %
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Input
                      type="number"
                      min={0}
                      value={pagesReadInput}
                      onChange={(e) => setPagesReadInput(e.target.value)}
                      placeholder="Lidas"
                      className="w-24 bg-white/5 border-white/10 text-white"
                    />
                    <span className="text-muted-foreground text-sm">/</span>
                    <Input
                      type="number"
                      min={1}
                      value={totalPagesInput}
                      onChange={(e) => setTotalPagesInput(e.target.value)}
                      placeholder="Total"
                      className="w-24 bg-white/5 border-white/10 text-white"
                    />
                    <Button size="sm" onClick={handleUpdateProgressPages} disabled={updatingProgress || !pagesReadInput || !totalPagesInput} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Calcular
                    </Button>
                  </div>
                </div>
              </div>
              {displayResource.url && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  asChild
                >
                  <a href={displayResource.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Recurso
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {displayResource.description && (
            <Card className="border-white/5 bg-[#050506]/90">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Descrição</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {displayResource.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-white/5 bg-[#050506]/90">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-white">Anotações</CardTitle>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddAnnotation(!showAddAnnotation)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Anotação
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {showAddAnnotation && !isEditing && (
                <div className="space-y-3 rounded-xl border border-[#780606]/40 bg-[#780606]/5 p-4">
                  <Input
                    placeholder="Capítulo ou Seção (opcional)"
                    value={newAnnotation.chapter}
                    onChange={(e) => setNewAnnotation({ ...newAnnotation, chapter: e.target.value })}
                    className="bg-white/[0.02] border-white/10 text-white"
                  />
                  <textarea
                    placeholder="Sua anotação..."
                    value={newAnnotation.content}
                    onChange={(e) => setNewAnnotation({ ...newAnnotation, content: e.target.value })}
                    className="w-full min-h-[120px] rounded-md bg-white/[0.02] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#780606]"
                  />
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      onClick={addAnnotation}
                      disabled={!newAnnotation.content.trim()}
                      className="bg-[#780606] hover:bg-[#780606]/90 text-white"
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddAnnotation(false);
                        setNewAnnotation({ chapter: '', content: '' });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="rounded-xl border border-white/10 bg-white/[0.01] p-4"
                  >
                    {annotation.chapter && (
                      <div className="mb-2 text-sm font-semibold text-[#780606]">
                        {annotation.chapter}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">{annotation.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(annotation.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>

              {annotations.length === 0 && !showAddAnnotation && (
                <div className="text-center py-12 rounded-xl border border-dashed border-white/10">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Nenhuma anotação ainda</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Adicione uma para começar!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}