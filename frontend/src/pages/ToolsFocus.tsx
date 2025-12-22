import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Modal } from '../components/ui/modal';
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
  Settings,
  X,
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
  const [showConfig, setShowConfig] = useState(false);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary">Tools & Focus</p>
          <h1 className="text-3xl font-serif font-light text-white">Central de Pomodoro</h1>
        </div>
      </div>

      {/* Timer Card - Grande e Centralizado */}
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="border border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent shadow-2xl shadow-primary/10 w-full max-w-2xl">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center space-y-8">
              {/* Timer Display */}
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.5em] text-white/60 mb-6">Próximo ciclo</p>
                <div className="text-8xl md:text-9xl font-mono font-bold text-white mb-4">
                  {workMinutes.toString().padStart(2, '0')}:00
                </div>
                <p className="text-sm text-white/60">Sincroniza com o timer flutuante do Nexus</p>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-3">
                <Button 
                  className="w-full gap-2 bg-primary text-white hover:bg-primary/90 h-14 text-lg font-semibold" 
                  onClick={() => triggerTimer(undefined, 'work')}
                >
                  <Play className="h-5 w-5" />
                  Iniciar Trabalho
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="gap-2 border-white/20 text-white/80 hover:text-white hover:border-primary/50 h-12" 
                    onClick={() => triggerTimer(undefined, 'shortBreak')}
                  >
                    <Play className="h-4 w-4" />
                    Descanso Curto
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2 border-white/20 text-white/80 hover:text-white hover:border-primary/50 h-12" 
                    onClick={() => triggerTimer(undefined, 'longBreak')}
                  >
                    <Play className="h-4 w-4" />
                    Descanso Longo
                  </Button>
                </div>
              </div>

              {/* Config Button */}
              <Button 
                variant="ghost" 
                className="gap-2 text-white/70 hover:text-white hover:bg-white/5 mt-4" 
                onClick={() => setShowConfig(true)}
              >
                <Settings className="h-4 w-4" />
                Configurar Timer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Config Modal */}
      <Modal isOpen={showConfig} onClose={() => setShowConfig(false)}>
        <div className="bg-background rounded-xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Configurar Timer</h2>
            <button
              onClick={() => setShowConfig(false)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                Trabalho (minutos)
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
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                Descanso Curto (minutos)
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
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                Descanso Longo (minutos)
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

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 border-white/20 text-white/80 hover:text-white" 
                onClick={() => setShowConfig(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-primary text-white hover:bg-primary/90" 
                onClick={() => setShowConfig(false)}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </Modal>

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
