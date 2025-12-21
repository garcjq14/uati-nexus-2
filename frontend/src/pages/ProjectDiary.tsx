import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Plus, Calendar, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';

export default function ProjectDiary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', content: '', tags: '' });

  useEffect(() => {
    if (id) {
      fetchDiary();
      fetchProject();
    }
  }, [id]);

  const fetchDiary = async () => {
    try {
      const response = await api.get(`/projects/${id}/diary`);
      // Normalize tags to always be arrays
      const normalizedEntries = response.data.map((entry: any) => ({
        ...entry,
        tags: Array.isArray(entry.tags) ? entry.tags : entry.tags ? [entry.tags] : []
      }));
      setEntries(normalizedEntries);
    } catch (error) {
      console.error('Failed to fetch diary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const addEntry = async () => {
    if (!newEntry.title || !newEntry.content) return;

    try {
      const tags = newEntry.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await api.post(`/projects/${id}/diary`, {
        ...newEntry,
        tags,
      });

      setNewEntry({ title: '', content: '', tags: '' });
      setShowAddForm(false);
      fetchDiary();
    } catch (error) {
      console.error('Failed to add entry:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-serif">Diário de Bordo Digital</h1>
            {project && <p className="text-muted-foreground">{project.title}</p>}
          </div>
        </div>
        <Button variant="default" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrada
        </Button>
      </div>

      {/* Add Entry Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Entrada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Título da entrada..."
              value={newEntry.title}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
            />
            <textarea
              placeholder="Conteúdo (Markdown suportado)..."
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm min-h-[200px]"
            />
            <Input
              placeholder="Tags (separadas por vírgula)"
              value={newEntry.tags}
              onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={addEntry}>Salvar</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{entry.title}</CardTitle>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(entry.createdAt)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-muted-foreground">
                    {entry.content}
                  </div>
                </div>
                {Array.isArray(entry.tags) && entry.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {entry.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-xs text-primary"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {entries.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma entrada no diário ainda</p>
            <Button className="mt-4" onClick={() => setShowAddForm(true)}>
              Criar Primeira Entrada
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
