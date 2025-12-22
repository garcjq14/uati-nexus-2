import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Edit, Tag } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    try {
      const response = await api.get(`/notes/${id}`);
      const normalizedNote = {
        ...response.data,
        title: response.data.title || '',
        content: response.data.content || '',
        tags: parseArrayField(response.data.tags),
        references: parseArrayField(response.data.references)
      };
      setNote(normalizedNote);
    } catch (error) {
      console.error('Failed to fetch note:', error);
    } finally {
      setLoading(false);
    }
  }, [id, parseArrayField]);

  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id, fetchNote]);


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
                <span
                  key={`${tag}-${idx}`}
                  className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-sm text-primary"
                >
                  {tag}
                </span>
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
