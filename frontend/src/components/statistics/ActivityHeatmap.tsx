import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface ActivityHeatmapProps {
  data?: Array<{ date: string; count: number }>;
  year?: number;
}

export function ActivityHeatmap({ data = [], year = new Date().getFullYear() }: ActivityHeatmapProps) {
  // Generate calendar data for the year
  const calendarData = useMemo(() => {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      const days: Array<{ date: Date; count: number }> = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const activity = data.find((item) => item.date === dateStr);
        days.push({
          date: new Date(d),
          count: activity?.count || 0,
        });
      }
      
      return days;
    } catch (error) {
      console.error('Error generating calendar data:', error);
      return [];
    }
  }, [data, year]);

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-white/5';
    if (count <= 2) return 'bg-primary/20';
    if (count <= 4) return 'bg-primary/40';
    if (count <= 6) return 'bg-primary/60';
    return 'bg-primary';
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - day);
    return weekStart;
  };

  const weeks = useMemo(() => {
    try {
      if (!calendarData || calendarData.length === 0) {
        return [];
      }
      
      const weekMap = new Map<string, Array<{ date: Date; count: number }>>();
      
      calendarData.forEach((day) => {
        const weekStart = getWeekStart(day.date);
        const weekKey = weekStart.toISOString();
        
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, []);
        }
        const weekDays = weekMap.get(weekKey);
        if (weekDays) {
          weekDays.push(day);
        }
      });
      
      return Array.from(weekMap.values());
    } catch (error) {
      console.error('Error generating weeks:', error);
      return [];
    }
  }, [calendarData]);

  const maxCount = useMemo(() => {
    try {
      if (!calendarData || calendarData.length === 0) return 1;
      const counts = calendarData.map((d) => d.count);
      if (counts.length === 0) return 1;
      return Math.max(...counts, 1);
    } catch (error) {
      console.error('Error calculating maxCount:', error);
      return 1;
    }
  }, [calendarData]);

  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const getDayKey = (weekIndex: number, dayIndex: number) => `${weekIndex}-${dayIndex}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-white/5" />
            <div className="w-3 h-3 rounded bg-primary/20" />
            <div className="w-3 h-3 rounded bg-primary/40" />
            <div className="w-3 h-3 rounded bg-primary/60" />
            <div className="w-3 h-3 rounded bg-primary" />
          </div>
          <span>Mais</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {calendarData.filter((d) => d.count > 0).length} dias com atividade em {year}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                if (!day || !day.date) return null;
                const isToday = day.date.toDateString() === new Date().toDateString();
                const dayKey = getDayKey(weekIndex, dayIndex);
                const isHovered = hoveredDay === dayKey;
                
                return (
                  <div
                    key={dayKey}
                    className="relative"
                    onMouseEnter={() => setHoveredDay(dayKey)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className={`
                        w-3 h-3 rounded-sm border
                        ${getIntensity(day.count)}
                        ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                        ${day.count > 0 ? 'cursor-pointer' : ''}
                        transition-all
                      `}
                      style={{
                        opacity: day.count > 0 ? 0.8 + (day.count / maxCount) * 0.2 : 0.3,
                      }}
                    />
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-2 py-1 rounded bg-background border border-white/10 text-xs text-white whitespace-nowrap">
                        {day.date.toLocaleDateString('pt-BR')}: {day.count} atividade{day.count !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Hoje</span>
        </div>
      </div>
    </div>
  );
}
