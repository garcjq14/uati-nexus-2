import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { cn } from '../lib/utils';

export default function ProjectChecklist() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchChecklist();
      fetchProject();
    }
  }, [id]);

  const fetchChecklist = async () => {
    try {
      const response = await api.get(`/projects/${id}/checklist`);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch checklist:', error);
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

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      await api.put(`/projects/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      fetchProject(); // Update project progress
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-serif">Checklist de Entrega</h1>
          {project && <p className="text-muted-foreground">{project.title}</p>}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso do Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedCount} de {totalCount} tarefas concluídas
              </span>
              <span className="text-primary font-bold">{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card>
        <CardHeader>
          <CardTitle>Tarefas Obrigatórias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-4 rounded-lg border border-border p-4 transition-colors',
                  task.status === 'done' && 'bg-success/10 border-success/50'
                )}
              >
                <button
                  onClick={() => toggleTask(task.id, task.status)}
                  className="flex-shrink-0"
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1">
                  <h3
                    className={cn(
                      'font-semibold',
                      task.status === 'done' && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma tarefa no checklist ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

