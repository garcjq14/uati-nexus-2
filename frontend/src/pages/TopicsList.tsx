import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { BookOpen, Search, CheckCircle2, Clock, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { cn } from '../lib/utils';

export default function TopicsList() {
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (curriculumId) {
      fetchTopics();
    }
  }, [curriculumId]);

  const fetchTopics = async () => {
    try {
      const response = await api.get(`/topics/curriculum/${curriculumId}`);
      setTopics(response.data);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTopics = topics.filter((topic) =>
    topic.title.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'reading':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      default:
        return <Lock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-success text-success';
      case 'reading':
        return 'border-yellow-400 text-yellow-400';
      default:
        return 'border-muted text-muted-foreground';
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif">Tópicos de Estudo</h1>
        <Button variant="outline" onClick={() => navigate('/curriculum')}>
          Voltar
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar tópicos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTopics.map((topic) => (
          <Card
            key={topic.id}
            className={cn(
              'cursor-pointer transition-all hover:border-primary',
              getStatusColor(topic.status)
            )}
            onClick={() => navigate(`/topics/${topic.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(topic.status)}
                    <h3 className="font-semibold">{topic.title}</h3>
                  </div>
                  {topic.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {topic.description}
                    </p>
                  )}
                  {topic.note && (
                    <div className="mt-2">
                      <span className="text-xs text-primary">Fichamento disponível</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center text-muted-foreground">
          {search ? 'Nenhum tópico encontrado' : 'Nenhum tópico disponível'}
        </div>
      )}
    </div>
  );
}

