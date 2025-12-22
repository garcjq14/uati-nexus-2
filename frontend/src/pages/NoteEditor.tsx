import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Save, Eye, X, Tag } from 'lucide-react';
import { useAchievementChecker } from '../hooks/useAchievementChecker';
import api from '../lib/api';

interface Note {
  id?: string;
  title: string;
  content: string;
  connections: string[];
  tags: string[];
  references: string[];
}

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { checkAfterAction } = useAchievementChecker();
  const isNew = !id;
  const [note, setNote] = useState<Note>({
    title: '',
    content: '',
    connections: [],
    tags: [],
    references: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [referenceInput, setReferenceInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  const fetchNote = useCallback(async () => {
    if (!id) return;
    try {
      const response = await api.get<Note>(`/notes/${id}`);
      // Normalize tags and references to always be arrays
      const normalizedNote = {
        ...response.data,
        title: response.data.title || '',
        content: response.data.content || '',
        tags: Array.isArray(response.data.tags) 
          ? response.data.tags.filter((t: any) => t && typeof t === 'string' && t.trim())
          : response.data.tags && typeof response.data.tags === 'string'
            ? [response.data.tags].filter((t: string) => t.trim())
            : [],
        references: Array.isArray(response.data.references) 
          ? response.data.references.filter((r: any) => r && typeof r === 'string' && r.trim())
          : response.data.references && typeof response.data.references === 'string'
            ? [response.data.references].filter((r: string) => r.trim())
            : [],
        connections: []
      };
      setNote(normalizedNote);
    } catch (error) {
      console.error('Failed to fetch note:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isNew && id) {
      fetchNote();
    }
  }, [id, isNew, fetchNote]);

  const addTag = () => {
    const cleanTag = tagInput.trim();
    if (cleanTag && !note.tags.includes(cleanTag)) {
      setNote({ ...note, tags: [...note.tags, cleanTag] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNote({ ...note, tags: note.tags.filter((t) => t !== tag) });
  };

  const addReference = () => {
    const cleanRef = referenceInput.trim();
    if (cleanRef && !note.references.includes(cleanRef)) {
      setNote({ ...note, references: [...note.references, cleanRef] });
      setReferenceInput('');
    }
  };

  const removeReference = (ref: string) => {
    setNote({ ...note, references: note.references.filter((r) => r !== ref) });
  };


  const handleSave = async () => {
    if (!note.title || !note.content) {
      alert('Título e conteúdo são obrigatórios');
      return;
    }

    try {
      const cleanTags = (note.tags || []).filter((t: string) => t && typeof t === 'string' && t.trim());
      const cleanReferences = (note.references || []).filter((r: string) => r && typeof r === 'string' && r.trim());
      
      const payload = { 
        title: note.title.trim(),
        content: note.content.trim(),
        tags: cleanTags,
        references: cleanReferences
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
                value={note.title}
                onChange={(e) => setNote({ ...note, title: e.target.value })}
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
                    {note.content}
                  </div>
                </div>
              ) : (
                <textarea
                  value={note.content}
                  onChange={(e) => setNote({ ...note, content: e.target.value })}
                  placeholder="Explique o conceito como se estivesse ensinando para alguém..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm min-h-[300px]"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Nova tag..."
                />
                <Button onClick={addTag}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag: string) => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-sm text-primary"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-primary/70"
                      aria-label={`Remover tag ${tag}`}
                      title={`Remover tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addReference();
                    }
                  }}
                  placeholder="Adicionar referência..."
                />
                <Button onClick={addReference}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {note.references.map((ref: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-full bg-secondary/20 px-3 py-1 text-sm text-secondary-foreground"
                  >
                    {ref}
                    <button
                      onClick={() => removeReference(ref)}
                      className="hover:text-muted-foreground"
                      aria-label={`Remover referência ${ref}`}
                      title={`Remover referência ${ref}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
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
