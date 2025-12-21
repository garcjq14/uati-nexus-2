import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle2, FileText, BookOpen, Code, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { cn } from '../lib/utils';

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
}

const activityIcons: Record<string, any> = {
  pow_completed: CheckCircle2,
  flashcard_created: FileText,
  topic_read: BookOpen,
  project_updated: Code,
};

const activityColors: Record<string, string> = {
  pow_completed: 'text-success',
  flashcard_created: 'text-blue-400',
  topic_read: 'text-yellow-400',
  project_updated: 'text-primary',
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchActivities();
  }, [filter, page]);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/activities', {
        params: { filter, page, limit: 20 },
      });
      if (page === 1) {
        setActivities(response.data);
      } else {
        setActivities((prev) => [...prev, ...response.data]);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { id: 'all', label: 'Todas' },
    { id: 'pow_completed', label: 'PoW Concluído' },
    { id: 'flashcard_created', label: 'Ficha Criada' },
    { id: 'topic_read', label: 'Tópico Lido' },
    { id: 'project_updated', label: 'Projeto Atualizado' },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diff < 1) return 'Agora';
    if (diff < 60) return `${diff} min atrás`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && activities.length === 0) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif">Feed de Atividades</h1>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <div className="flex gap-2">
            {filters.map((f) => (
              <Button
                key={f.id}
                variant={filter === f.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setFilter(f.id);
                  setPage(1);
                  setActivities([]);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type] || FileText;
            const color = activityColors[activity.type] || 'text-muted-foreground';

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={cn('rounded-full bg-secondary p-2', color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{activity.title}</h3>
                      {activity.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {activities.length > 0 && (
        <div className="text-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? 'Carregando...' : 'Carregar Mais'}
          </Button>
        </div>
      )}

      {activities.length === 0 && !loading && (
        <div className="text-center text-muted-foreground">
          Nenhuma atividade encontrada
        </div>
      )}
    </div>
  );
}

