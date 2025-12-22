import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Save, Eye, X } from 'lucide-react';
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
  const [connectionInput, setConnectionInput] = useState('');
  const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  const fetchNote = useCallback(async () => {
    if (!id) return;
    try {
      const response = await api.get<Note>(`/notes/${id}`);
      // Normalize tags to always be arrays
      const normalizedNote = {
        ...response.data,
        tags: Array.isArray(response.data.tags) ? response.data.tags : response.data.tags ? [response.data.tags] : [],
        connections: Array.isArray(response.data.connections) ? response.data.connections : response.data.connections ? [response.data.connections] : [],
        references: Array.isArray(response.data.references) ? response.data.references : response.data.references ? [response.data.references] : []
      };
      setNote(normalizedNote);
    } catch (error) {
      console.error('Failed to fetch note:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAvailableNotes = useCallback(async () => {
    try {
      const response = await api.get<Note[]>('/notes');
      setAvailableNotes(response.data.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to fetch available notes:', error);
    }
  }, [id]);

  useEffect(() => {
    if (!isNew && id) {
      fetchNote();
    }
    fetchAvailableNotes();
  }, [id, isNew, fetchNote, fetchAvailableNotes]);

  const addTag = () => {
    const tagsArray = Array.isArray(note.tags) ? note.tags : [];
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !tagsArray.map((t) => t.toLowerCase()).includes(cleanTag)) {
      setNote({ ...note, tags: [...tagsArray, cleanTag] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    const tagsArray = Array.isArray(note.tags) ? note.tags : [];
    setNote({ ...note, tags: tagsArray.filter((t) => t !== tag) });
    setTagInput('');
  };

  const addReference = () => {
    if (referenceInput.trim() && !note.references.includes(referenceInput.trim())) {
      setNote({ ...note, references: [...note.references, referenceInput.trim()] });
      setReferenceInput('');
    }
  };

  const removeReference = (ref: string) => {
    setNote({ ...note, references: note.references.filter((r) => r !== ref) });
  };

  const addConnection = () => {
    if (connectionInput && !note.connections.includes(connectionInput)) {
      setNote({ ...note, connections: [...note.connections, connectionInput] });
      setConnectionInput('');
    }
  };

  const removeConnection = (connId: string) => {
    setNote({ ...note, connections: note.connections.filter((c) => c !== connId) });
  };

  const handleSave = async () => {
    if (!note.title || !note.content) {
      alert('Título e conteúdo são obrigatórios');
      return;
    }

    try {
      const cleanTags = Array.from(new Set((note.tags || []).map((t) => t.trim()).filter(Boolean)));
      const payload = { ...note, tags: cleanTags };
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
              <CardTitle>Conexões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={connectionInput}
                  onChange={(e) => setConnectionInput(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  aria-label="Selecione uma ficha para conectar"
                  title="Selecione uma ficha para conectar"
                >
                  <option value="">Selecione uma ficha...</option>
                  {availableNotes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
                <Button onClick={addConnection}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {note.connections.map((connId) => {
                  const connectedNote = availableNotes.find((n) => n.id === connId);
                  return (
                    <div
                      key={connId}
                      className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-sm text-primary"
                    >
                      {connectedNote?.title || connId}
                      <button
                        onClick={() => removeConnection(connId)}
                        className="hover:text-primary/70"
                        aria-label={`Remover conexão com ${connectedNote?.title || connId}`}
                        title={`Remover conexão com ${connectedNote?.title || connId}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
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
                  onKeyPress={(e) => e.key === 'Enter' && addReference()}
                  placeholder="Adicionar referência..."
                />
                <Button onClick={addReference}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {note.references.map((ref, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm"
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
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Nova tag..."
                />
                <Button onClick={addTag}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(note.tags) && note.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-sm text-primary"
                  >
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

          <Button variant="default" className="w-full" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Ficha
          </Button>
        </div>
      </div>
    </div>
  );
}
