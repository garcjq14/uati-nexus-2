import { useCourse } from '../../../contexts/CourseContext';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export function ModulesWidget() {
  const { courseData } = useCourse();
  
  const highlightedModules = courseData.curriculum
    .slice()
    .sort((a: any, b: any) => a.order - b.order)
    .slice(0, 3);

  if (highlightedModules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
        <p className="text-muted-foreground">Nenhum módulo disponível.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {highlightedModules.map((module: any) => (
        <Link
          key={module.id}
          to={`/curriculum/${module.id}`}
          className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.05] hover:border-white/10 transition-all group"
        >
          <div className="h-12 w-12 rounded-xl border border-white/10 bg-black/40 flex items-center justify-center">
            <span className="text-xs font-mono tracking-[0.2em] text-muted-foreground">{module.code}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
              {module.title}
            </p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">{module.status}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">{module.progress}%</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em]">andamento</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      ))}
    </div>
  );
}


