import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarClock,
  Clock3,
  Flame,
  NotebookPen,
  Play,
  RotateCcw,
  Target,
} from 'lucide-react';
import api from '../lib/api';

type TimerSession = {
  id: string;
  duration: number;
  type: string;
  createdAt: string;
};

const buildSafeId = (() => {
  let counter = 0;
  return () => {
    counter += 1;
    return `session-${counter}`;
  };
})();

const focusLinks = [
  {
    id: 'notes',
    title: 'Notas e fichamentos',
    description: 'Centralize ideias e conexões no módulo de notas.',
    icon: NotebookPen,
    href: '/notes',
  },
  {
    id: 'spaced',
    title: 'Revisão espaçada',
    description: 'Reforce memórias acionando sua fila de flashcards.',
    icon: BookOpen,
    href: '/spaced-repetition',
  },
  {
    id: 'planner',
    title: 'Planejamento semanal',
    description: 'Distribua blocos de deep work no Weekly Planner.',
    icon: CalendarClock,
    href: '/weekly-planner',
  },
];


export default function ToolsFocus() {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [workMinutes, setWorkMinutes] = useState(() => {
    const saved = localStorage.getItem('pomodoro_work_minutes');
    return saved ? parseInt(saved) : 25;
  });
  const [shortBreakMinutes, setShortBreakMinutes] = useState(() => {
    const saved = localStorage.getItem('pomodoro_short_break_minutes');
    return saved ? parseInt(saved) : 5;
  });
  const [longBreakMinutes, setLongBreakMinutes] = useState(() => {
    const saved = localStorage.getItem('pomodoro_long_break_minutes');
    return saved ? parseInt(saved) : 15;
  });
  const navigate = useNavigate();
  
  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro_work_minutes', workMinutes.toString());
  }, [workMinutes]);
  
  useEffect(() => {
    localStorage.setItem('pomodoro_short_break_minutes', shortBreakMinutes.toString());
  }, [shortBreakMinutes]);
  
  useEffect(() => {
    localStorage.setItem('pomodoro_long_break_minutes', longBreakMinutes.toString());
  }, [longBreakMinutes]);

  useEffect(() => {
    let isMounted = true;
    const loadSessions = async () => {
      try {
        const response = await api.get('/timer/history').catch(() => ({ data: [] }));
        if (!isMounted) return;

        const raw = Array.isArray(response.data)
          ? response.data
          : response.data?.sessions || response.data?.history || [];

        const normalized = raw
          .filter(Boolean)
          .map((session: any, index: number): TimerSession => ({
            id: session.id || session._id || buildSafeId() || `session-${index}`,
            duration: Number(session.duration) || 0,
            type: session.type || 'pomodoro',
            createdAt: session.createdAt || session.date || new Date().toISOString(),
          }))
          .sort(
            (a: TimerSession, b: TimerSession) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setSessions(normalized);
      } catch (error) {
        console.error('Erro ao carregar histórico de foco', error);
        if (isMounted) {
          setSessions([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSessions();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return {
        totalMinutes: 0,
        averageMinutes: 0,
        streakDays: 0,
        completedCycles: 0,
      };
    }

    const totalSeconds = sessions.reduce((acc, session) => acc + session.duration, 0);
    const totalMinutes = Math.round(totalSeconds / 60);
    const averageMinutes = Math.max(1, Math.round(totalMinutes / sessions.length));
    const completedCycles = sessions.filter((session) => session.type !== 'break').length;

    const dayKey = (date: Date) => date.toISOString().split('T')[0];
    const daysWithStudy = new Set(
      sessions.map((session) => dayKey(new Date(session.createdAt)))
    );
    let streakDays = 0;
    const cursor = new Date();
    while (daysWithStudy.has(dayKey(cursor))) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      totalMinutes,
      averageMinutes,
      streakDays,
      completedCycles,
    };
  }, [sessions]);

  const recentSessions = sessions.slice(0, 4);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const triggerTimer = (minutes?: number, type: 'work' | 'shortBreak' | 'longBreak' = 'work') => {
    if (typeof window === 'undefined') return;
    let timerMinutes = minutes;
    if (!timerMinutes) {
      if (type === 'work') timerMinutes = workMinutes;
      else if (type === 'shortBreak') timerMinutes = shortBreakMinutes;
      else timerMinutes = longBreakMinutes;
    }
    window.dispatchEvent(new CustomEvent('setTimerPreset', { detail: { minutes: timerMinutes, type } }));
    window.dispatchEvent(new CustomEvent('openSessionTimer'));
  };

  const highlightSession = recentSessions[0];
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <section className="border border-white/10 bg-transparent p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary">Tools & Focus</p>
            <h1 className="text-3xl font-serif font-light text-white">Central de Pomodoro</h1>
            <p className="mt-2 text-sm text-white/70">
              Configure tempos de trabalho, descanso curto e descanso longo. Acompanhe minutos investidos e acione o timer oficial.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="gap-2 text-white" onClick={() => triggerTimer()}>
              <Play className="h-4 w-4" />
              Iniciar agora
            </Button>
            <Button variant="outline" className="gap-2 border-white/20 text-white/80 hover:text-white" onClick={() => navigate('/statistics')}>
              <Activity className="h-4 w-4" />
              Ver desempenho
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr,0.6fr]">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                  Trabalho (min)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={workMinutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 25;
                    setWorkMinutes(Math.max(1, Math.min(120, value)));
                  }}
                  className="w-full border-b border-white/10 bg-transparent px-2 py-3 text-2xl font-mono font-semibold text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                  Descanso curto (min)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={shortBreakMinutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 5;
                    setShortBreakMinutes(Math.max(1, Math.min(60, value)));
                  }}
                  className="w-full border-b border-white/10 bg-transparent px-2 py-3 text-2xl font-mono font-semibold text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                  Descanso longo (min)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreakMinutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 15;
                    setLongBreakMinutes(Math.max(1, Math.min(60, value)));
                  }}
                  className="w-full border-b border-white/10 bg-transparent px-2 py-3 text-2xl font-mono font-semibold text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                {sessions.length} sessões registradas
              </div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                {stats.streakDays} dias de streak
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-transparent p-6 text-center">
            <p className="text-xs uppercase tracking-[0.45em] text-white/70">Próximo ciclo</p>
            <div className="mt-4 text-6xl font-mono font-bold text-white">
              {workMinutes.toString().padStart(2, '0')}:00
            </div>
            <p className="mt-2 text-sm text-white/60">Sincroniza com o timer flutuante do Nexus.</p>
            <div className="mt-6 space-y-2">
              <Button className="w-full gap-2 bg-primary text-white hover:bg-primary/90" onClick={() => triggerTimer(undefined, 'work')}>
                <Play className="h-4 w-4" />
                Iniciar trabalho
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-2 border-white/20 text-white/80 hover:text-white" onClick={() => triggerTimer(undefined, 'shortBreak')}>
                  <Play className="h-3 w-3" />
                  Descanso curto
                </Button>
                <Button variant="outline" className="gap-2 border-white/20 text-white/80 hover:text-white" onClick={() => triggerTimer(undefined, 'longBreak')}>
                  <Play className="h-3 w-3" />
                  Descanso longo
                </Button>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-white/60">
              Dica: revise metas antes de iniciar e use o botão flutuante para acompanhar em qualquer página.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr,0.65fr]">
        <Card className="border border-white/10 bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-primary" />
              Ritmo de foco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Minutos', value: stats.totalMinutes, helper: 'Acumulado recente' },
                { label: 'Média', value: `${stats.averageMinutes}m`, helper: 'Por ciclo' },
                { label: 'Ciclos', value: stats.completedCycles, helper: 'Pomodoros' },
                { label: 'Streak', value: `${stats.streakDays}d`, helper: 'Dias seguidos' },
              ].map((item) => (
                <div key={item.label} className="border-b border-white/10 pb-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">{item.label}</p>
                  <p className="text-2xl font-semibold text-white">{item.value}</p>
                  <span className="text-[11px] text-white/60">{item.helper}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-3 text-xs font-mono uppercase tracking-[0.3em] text-white/60">Últimas sessões</p>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, idx) => (
                    <Skeleton key={idx} className="h-14 w-full rounded-xl bg-white/5" />
                  ))}
                </div>
              ) : recentSessions.length === 0 ? (
                <p className="text-sm text-white/70">Sem registros por enquanto. Inicie um ciclo acima para começar seu histórico.</p>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="items-center border-b border-white/10 px-4 py-3 text-sm text-white md:flex md:justify-between"
                    >
                      <div>
                        <p className="font-medium">{session.type === 'break' ? 'Pausa guiada' : 'Sessão focada'}</p>
                        <p className="text-xs text-white/60">{formatDateLabel(session.createdAt)}</p>
                      </div>
                      <div className="mt-2 text-right text-white md:mt-0">
                        <p className="text-base font-semibold text-primary">{formatDuration(session.duration)}</p>
                        <span className="text-[11px] text-white/60">Registrado</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-white/10 bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock3 className="h-5 w-5 text-primary" />
                Atalhos imediatos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2" onClick={() => triggerTimer()}>
                  <Play className="h-4 w-4" />
                  Iniciar agora
                </Button>
                <Button variant="secondary" className="gap-2 text-white" onClick={() => navigate('/weekly-planner')}>
                  <CalendarClock className="h-4 w-4" />
                  Planejar blocos
                </Button>
                <Button variant="outline" className="gap-2 border-white/10" onClick={() => navigate('/spaced-repetition')}>
                  <RotateCcw className="h-4 w-4" />
                  Revisar flashcards
                </Button>
                <Button variant="outline" className="gap-2 border-white/10" onClick={() => navigate('/notes')}>
                  <NotebookPen className="h-4 w-4" />
                  Registrar insights
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

    </div>
  );
}
