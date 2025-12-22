import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Edit, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id]);

  const fetchNote = async () => {
    try {
      const response = await api.get(`/notes/${id}`);
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
            : []
      };
      setNote(normalizedNote);
    } catch (error) {
      console.error('Failed to fetch note:', error);
    } finally {
      setLoading(false);
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
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-sm text-primary"
                >
                  <Tag className="h-3 w-3" />
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
