import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
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
      // Normalize references to always be arrays
      const normalizedNote = {
        ...response.data,
        title: response.data.title || '',
        content: response.data.content || '',
        references: Array.isArray(response.data.references) ? response.data.references : response.data.references ? [response.data.references] : []
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
