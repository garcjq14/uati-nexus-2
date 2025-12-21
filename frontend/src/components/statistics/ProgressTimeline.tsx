import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, Calendar, Target } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TimelineEvent {
  date: string;
  type: 'milestone' | 'achievement' | 'project';
  title: string;
  description?: string;
}

interface ProgressTimelineProps {
  events?: TimelineEvent[];
}

export function ProgressTimeline({ events = [] }: ProgressTimelineProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  if (sortedEvents.length === 0) {
    return (
      <Card className="border-white/5 bg-card">
        <CardContent className="p-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum evento ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/5 bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Timeline de Progresso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />

          <div className="space-y-6">
            {sortedEvents.map((event, index) => {
              const date = new Date(event.date);
              const iconColors = {
                milestone: 'text-primary',
                achievement: 'text-yellow-400',
                project: 'text-green-400',
              };

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex gap-6"
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full border-2 flex items-center justify-center',
                        `border-${event.type === 'milestone' ? 'primary' : event.type === 'achievement' ? 'yellow-400' : 'green-400'}/30`,
                        `bg-${event.type === 'milestone' ? 'primary' : event.type === 'achievement' ? 'yellow-400' : 'green-400'}/10`
                      )}
                    >
                      <Target className={cn('h-2.5 w-2.5', iconColors[event.type])} />
                    </div>
                  </div>

                  {/* Event content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-white">{event.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {date.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}





