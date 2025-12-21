import { useCourse } from '../../../contexts/CourseContext';
import { CheckCircle } from 'lucide-react';

export function ProgressWidget() {
  const { courseData } = useCourse();
  const stats = courseData.stats;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[160px]">
      <div className="h-12 w-12 rounded-full bg-[#780606]/10 flex items-center justify-center mb-5">
        <CheckCircle className="h-6 w-6 text-[#780606] stroke-[1.5]" />
      </div>
      <p className="text-3xl font-bold text-white mb-2">{stats.progress}%</p>
      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Conclusão Geral</p>
    </div>
  );
}


