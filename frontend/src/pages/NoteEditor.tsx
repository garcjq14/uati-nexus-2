import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useAchievementChecker } from '../hooks/useAchievementChecker';
import api from '../lib/api';

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { checkAfterAction } = useAchievementChecker();
  const isNew = !id;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [referencesInput, setReferencesInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  const parseArrayField = useCallback((value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item: unknown) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
        }
      } catch {
        return value
          .split(value.includes('\n') ? '\n' : ',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return value
        .split(value.includes('\n') ? '\n' : ',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }, []);

  const fetchNote = useCallback(async () => {
    if (!id) return;
    try {
      const response = await api.get(`/notes/${id}`);
      const data = response.data || {};
      const parsedTags = parseArrayField(data.tags);
      const parsedReferences = parseArrayField(data.references);

      setTitle(data.title || '');
      setContent(data.content || '');
      setTagsInput(parsedTags.join(', '));
      setReferencesInput(parsedReferences.join('\n'));
    } catch (error) {
      console.error('Failed to fetch note:', error);
    } finally {
      setLoading(false);
    }
  }, [id, parseArrayField]);

  useEffect(() => {
    if (!isNew && id) {
      fetchNote();
    }
  }, [id, isNew, fetchNote]);

  const parsedTags = useMemo(() => {
    return tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }, [tagsInput]);

  const parsedReferences = useMemo(() => {
    return referencesInput
      .split('\n')
      .map((ref) => ref.trim())
      .filter(Boolean);
  }, [referencesInput]);

  const handleSave = async () => {
    if (!title || !content) {
      alert('Título e conteúdo são obrigatórios');
      return;
    }

    try {
      const payload = { 
        title,
        content,
        tags: parsedTags,
        references: parsedReferences
      };
      if (isNew) {
        await api.post('/notes', payload);
        
        // Verificar conquistas automaticamente
        await checkAfterAction('note_created');
      } else {
        await api.put(`/notes/${id}`, payload);
      }
      navigate('/notes');
    } catch (error) {
      console.error('Failed to save note:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      alert(errorMessage || 'Erro ao salvar ficha');
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/notes')} className="touch-manipulation">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif">
              {isNew ? 'Nova Ficha' : 'Editar Ficha'}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="touch-manipulation">
            <Eye className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{showPreview ? 'Editar' : 'Preview'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conceito (Título)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do conceito..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Explicação Feynman</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? 'Editar' : 'Preview'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-muted-foreground">
                    {content}
                  </div>
                </div>
              ) : (
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  placeholder="Explique o conceito como se estivesse ensinando para alguém..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm min-h-[300px]"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags (separe com vírgulas)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ex: algoritmos, estruturas de dados"
                className="w-full rounded-lg border border-border bg-background p-3 text-sm min-h-[120px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referências (uma por linha)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={referencesInput}
                onChange={(e) => setReferencesInput(e.target.value)}
                placeholder="Livro ABC - Capítulo 3&#10;Artigo: https://exemplo.com"
                className="w-full rounded-lg border border-border bg-background p-3 text-sm min-h-[160px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Button variant="default" className="w-full" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Ficha
          </Button>
        </div>
      </div>
    </div>
  );
}
