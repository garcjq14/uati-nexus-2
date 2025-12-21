import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Lightbulb, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { useCourse } from '../../contexts/CourseContext';
import { cn } from '../../lib/utils';

export function InsightsPanel() {
  const { courseData } = useCourse();
  const stats = courseData.stats;

  const insights = useMemo(() => {
    const insightsList = [];

    // Progress insight
    if (stats.progress > 50) {
      insightsList.push({
        type: 'positive',
        icon: TrendingUp,
        title: 'Excelente Progresso!',
        message: `Você já completou ${stats.progress}% do curso. Continue assim!`,
      });
    } else if (stats.progress < 10) {
      insightsList.push({
        type: 'info',
        icon: Target,
        title: 'Começando Bem',
        message: 'Você está no início da jornada. Mantenha a consistência!',
      });
    }

    // Hours insight
    if (stats.hoursStudied > 100) {
      insightsList.push({
        type: 'positive',
        icon: TrendingUp,
        title: 'Centenário de Horas!',
        message: `Parabéns! Você já estudou mais de ${Math.floor(stats.hoursStudied)} horas.`,
      });
    } else if (stats.hoursStudied > 0 && stats.hoursStudied < 10) {
      insightsList.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Construindo o Hábito',
        message: 'Cada hora conta! Continue construindo seu hábito de estudo.',
      });
    }

    // Consistency insight
    if (stats.hoursStudied > 0) {
      const avgHoursPerWeek = stats.hoursStudied / 4; // Assuming 4 weeks
      if (avgHoursPerWeek > 10) {
        insightsList.push({
          type: 'positive',
          icon: TrendingUp,
          title: 'Muito Consistente!',
          message: `Você está estudando em média ${avgHoursPerWeek.toFixed(1)} horas por semana.`,
        });
      }
    }

    return insightsList;
  }, [stats]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="border-white/5 bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Insights Automáticos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const colors = {
            positive: 'border-green-500/30 bg-green-500/10 text-green-400',
            info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
            warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
          };

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn('p-4 rounded-lg border', colors[insight.type as keyof typeof colors])}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.message}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}


