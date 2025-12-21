import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  status: string;
  deadline?: string;
  progress: number;
  createdAt: string;
}

interface ProjectTimelineProps {
  projects: Project[];
}

export function ProjectTimeline({ projects }: ProjectTimelineProps) {
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dateA - dateB;
    });
  }, [projects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalizado':
        return 'text-emerald-400 border-emerald-400/40 bg-emerald-500/5';
      case 'em_progresso':
        return 'text-[#780606] border-[#780606]/40 bg-[#780606]/10';
      default:
        return 'text-muted-foreground border-white/10 bg-white/[0.02]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finalizado':
        return CheckCircle2;
      default:
        return Circle;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sem prazo';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/10" />

      <div className="space-y-8">
        {sortedProjects.map((project, index) => {
          const StatusIcon = getStatusIcon(project.status);
          const daysUntil = getDaysUntilDeadline(project.deadline);
          const isOverdue = daysUntil !== null && daysUntil < 0;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              {...({ className: 'relative flex gap-6' } as { className?: string })}
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center',
                    getStatusColor(project.status)
                  )}
                >
                  <StatusIcon className="h-2.5 w-2.5" />
                </div>
              </div>

              {/* Project card */}
              <div className="flex-1 min-w-0">
                <Link to={`/projects/${project.id}`}>
                  <Card className="border border-white/10 bg-white/[0.01] hover:border-[#780606]/40 transition-all cursor-pointer rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white mb-1 truncate">
                            {project.title}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {project.deadline && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className={cn(isOverdue && 'text-red-400')}>
                                  {formatDate(project.deadline)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {daysUntil !== null
                                  ? isOverdue
                                    ? `${Math.abs(daysUntil)} dias atrasado`
                                    : `${daysUntil} dias restantes`
                                  : 'Sem prazo'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                              getStatusColor(project.status)
                            )}
                          >
                            {project.status === 'finalizado'
                              ? 'Finalizado'
                              : project.status === 'em_progresso'
                              ? 'Em Progresso'
                              : 'Planejado'}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="text-white font-medium">{project.progress}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full bg-[#780606] rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

