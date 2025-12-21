import { useCourse } from '../../../contexts/CourseContext';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/button';
import { Play } from 'lucide-react';

export function FlashcardsWidget() {
  const { courseData } = useCourse();
  const stats = courseData.stats;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8 mt-2">
        <p className="text-7xl font-bold text-white mb-2 leading-none tracking-tight">
          {stats.flashcardsDue}
        </p>
        <p className="text-sm text-muted-foreground">Cartas acumuladas para revisão</p>
      </div>
      <Button
        variant="outline"
        className="w-full border border-white/10 bg-white/[0.02] hover:bg-[#780606] hover:border-[#780606] hover:text-white rounded-lg py-6 text-sm font-medium"
        asChild
      >
        <Link to="/spaced-repetition" className="flex items-center justify-center gap-2">
          INICIAR SESSÃO
          <Play className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}


