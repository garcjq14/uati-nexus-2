import { useMemo } from 'react';
import { useCourse } from '../../../contexts/CourseContext';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const SolidProgressBar = ({ value }: { value: number }) => {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <svg viewBox="0 0 100 4" className="w-full h-2">
      <rect width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect width={safeValue} height="4" rx="2" fill="#780606" />
    </svg>
  );
};

export function ActiveProjectWidget() {
  const { courseData } = useCourse();
  
  const activeProject = useMemo(() => {
    if (!courseData) return null;
    return courseData.projects.find((p) => p.status === 'em_progresso' && p.priority);
  }, [courseData]);

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
        <p className="text-muted-foreground mb-4">Nenhum projeto ativo</p>
        <Link
          to="/projects"
          className="text-primary hover:underline text-sm flex items-center gap-1"
        >
          Ver projetos <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
            Projeto Ativo
          </p>
          <Link
            to={`/projects/${activeProject.id}`}
            className="text-lg font-bold text-white hover:text-primary transition-colors flex items-center gap-2"
          >
            {activeProject.title}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {activeProject.priority && (
          <span className="inline-flex items-center rounded-full border border-[#780606]/20 bg-[#780606]/10 px-3 py-1 text-[10px] font-semibold text-[#780606] uppercase tracking-[0.2em]">
            Prioridade
          </span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progresso</span>
          <span>{activeProject.progress}%</span>
        </div>
        <SolidProgressBar value={activeProject.progress || 0} />
      </div>
      {activeProject.tasks?.length ? (
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">Sprint atual</p>
          <ul className="space-y-1.5">
            {activeProject.tasks.slice(0, 3).map((task: any) => (
              <li key={task.id} className="flex items-center gap-2 text-sm text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-[#780606]" />
                {task.title}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhuma tarefa associada.</p>
      )}
    </div>
  );
}





