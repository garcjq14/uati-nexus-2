import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Edit, Tag, Link as LinkIcon, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<any>(null);
  const [connectedNotes, setConnectedNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id]);

  const fetchNote = async () => {
    try {
      const response = await api.get(`/notes/${id}`);
      // Normalize tags, connections, and references to always be arrays
      const normalizedNote = {
        ...response.data,
        tags: Array.isArray(response.data.tags) ? response.data.tags : response.data.tags ? [response.data.tags] : [],
        connections: Array.isArray(response.data.connections) ? response.data.connections : response.data.connections ? [response.data.connections] : [],
        references: Array.isArray(response.data.references) ? response.data.references : response.data.references ? [response.data.references] : []
      };
      setNote(normalizedNote);
      if (normalizedNote.connectedNotes) {
        setConnectedNotes(Array.isArray(normalizedNote.connectedNotes) ? normalizedNote.connectedNotes : []);
      }
    } catch (error) {
      console.error('Failed to fetch note:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeTag = async (tagToRemove: string) => {
    if (!note || !id) return;
    
    try {
      const updatedTags = Array.isArray(note.tags) 
        ? note.tags.filter((tag: string) => tag !== tagToRemove)
        : [];
      
      const updatedNote = {
        ...note,
        tags: updatedTags
      };
      
      await api.put(`/notes/${id}`, updatedNote);
      setNote(updatedNote);
    } catch (error) {
      console.error('Failed to remove tag:', error);
      alert('Erro ao remover tag');
    }
  };

  if (loading || !note) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/notes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-serif">{note.title}</h1>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/notes/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Explicação Feynman</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-muted-foreground">
              {note.content}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      {Array.isArray(note.tags) && note.tags.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <CardTitle>Tags</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag: string, idx: number) => (
                <div
                  key={idx}
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
      )}

      {/* Connections */}
      {connectedNotes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              <CardTitle>Conexões</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {connectedNotes.map((connectedNote) => (
                <Link
                  key={connectedNote.id}
                  to={`/notes/${connectedNote.id}`}
                  className="block rounded-lg border border-border p-3 transition-colors hover:border-primary hover:bg-secondary"
                >
                  <h3 className="font-semibold">{connectedNote.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {connectedNote.content}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* References */}
      {Array.isArray(note.references) && note.references.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-6">
              {note.references.map((ref: string, idx: number) => (
                <li key={idx} className="text-muted-foreground">
                  {ref}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
