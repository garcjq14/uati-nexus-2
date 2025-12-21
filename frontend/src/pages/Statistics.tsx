import { useMemo } from 'react';
import { useCourse } from '../contexts/CourseContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ActivityHeatmap } from '../components/statistics/ActivityHeatmap';

const COLORS = ['#A31F34', '#22c55e', '#3b82f6', '#f59e0b'];

export default function Statistics() {
  const { courseData, loading } = useCourse();

  // Mock activity data for heatmap - moved before early return
  const activityData = useMemo(() => {
    // Generate consistent mock data without mutating variables
    const generateSeededValue = (index: number) => {
      // Simple hash function for consistent pseudo-random values
      const hash = (index * 9301 + 49297) % 233280;
      return (hash / 233280) % 1;
    };
    
    return Array.from({ length: 365 }, (_, i) => {
      const date = new Date(2024, 0, 1);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(generateSeededValue(i) * 8),
      };
    });
  }, []);

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  // Mock data for charts - in real app, this would come from API
  const progressByBlock = courseData.curriculum.map((module) => ({
    name: module.code,
    progress: module.progress,
    status: module.status,
  }));

  const weeklyHours = [
    { week: 'Sem 1', hours: 12.5, lastWeek: 10.0 },
    { week: 'Sem 2', hours: 15.0, lastWeek: 12.5 },
    { week: 'Sem 3', hours: 18.5, lastWeek: 15.0 },
    { week: 'Sem 4', hours: 14.0, lastWeek: 18.5 },
    { week: 'Sem 5', hours: 16.5, lastWeek: 14.0 },
    { week: 'Sem 6', hours: 20.0, lastWeek: 16.5 },
  ];

  // Calculate comparison
  const currentWeek = weeklyHours[weeklyHours.length - 1];
  const lastWeek = weeklyHours[weeklyHours.length - 2];
  const comparison = currentWeek ? ((currentWeek.hours - lastWeek.hours) / lastWeek.hours) * 100 : 0;

  const powCompletion = [
    { name: 'PoW 1', completed: 100, average: 85 },
    { name: 'PoW 2', completed: 70, average: 75 },
    { name: 'PoW 3', completed: 0, average: 0 },
  ];

  const handleExport = () => {
    // Export functionality would go here
    console.log('Exporting statistics...');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-serif">Estatísticas Detalhadas</h1>
        <Button variant="outline" onClick={handleExport} className="touch-manipulation w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Exportar Relatório</span>
          <span className="sm:hidden">Exportar</span>
        </Button>
      </div>

      {/* Progress by Block */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso por Bloco</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={progressByBlock}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#27272a',
                  border: '1px solid #27272a',
                  borderRadius: '0.5rem',
                }}
                cursor={{ fill: 'rgba(120, 6, 6, 0.1)' }}
              />
              <Bar 
                dataKey="progress" 
                fill="#A31F34"
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Hours with Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Horas de Estudo por Semana</CardTitle>
            {comparison !== 0 && (
              <div className="flex items-center gap-2 text-sm">
                {comparison > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-green-400">
                      {Math.abs(comparison).toFixed(1)}% mais que a semana anterior
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span className="text-red-400">
                      {Math.abs(comparison).toFixed(1)}% menos que a semana anterior
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="week" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#27272a',
                  border: '1px solid #27272a',
                  borderRadius: '0.5rem',
                }}
                cursor={{ stroke: '#A31F34', strokeWidth: 2 }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#A31F34"
                strokeWidth={2}
                dot={{ fill: '#A31F34', r: 4 }}
                name="Esta Semana"
              />
              <Line
                type="monotone"
                dataKey="lastWeek"
                stroke="#666"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={{ fill: '#666', r: 3 }}
                name="Semana Anterior"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Atividade</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap data={activityData} />
        </CardContent>
      </Card>

      {/* PoW Completion */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Média de Conclusão de PoW</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={powCompletion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#27272a',
                    border: '1px solid #27272a',
                    borderRadius: '0.5rem',
                  }}
                  cursor={{ fill: 'rgba(120, 6, 6, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="completed" fill="#A31F34" name="Seu Progresso" />
                <Bar dataKey="average" fill="#22c55e" name="Média Geral" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completado', value: courseData.curriculum.filter((c) => c.status === 'completed').length },
                    { name: 'Em Progresso', value: courseData.curriculum.filter((c) => c.status === 'active').length },
                    { name: 'Bloqueado', value: courseData.curriculum.filter((c) => c.status === 'locked').length },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2].map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#27272a',
                    border: '1px solid #27272a',
                    borderRadius: '0.5rem',
                  }}
                  cursor={{ fill: 'rgba(120, 6, 6, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
