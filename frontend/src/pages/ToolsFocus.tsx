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
  ListChecks,
  NotebookPen,
  Play,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';

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

const routineSteps = [
  {
    title: 'Preparação',
    description: 'Defina objetivo, recursos e duração antes de iniciar.',
  },
  {
    title: 'Execução',
    description: 'Bloqueie distrações e acompanhe o timer oficial do Nexus.',
  },
  {
    title: 'Consolidação',
    description: 'Registre insights em notas e marque revisões futuras.',
  },
];

const timerPresets = [
  {
    id: 'classic',
    label: 'Sprint clássico',
    minutes: 25,
    description: 'Pomodoro tradicional para ciclos rápidos.',
  },
  {
    id: 'deep',
    label: 'Deep focus',
    minutes: 45,
    description: 'Ideal para leituras densas e escrita.',
  },
  {
    id: 'maker',
    label: 'Maker hour',
    minutes: 60,
    description: 'Tempo inteiro para projetos e código.',
  },
];

const microHabits = [
  {
    id: 'breath',
    title: 'Aterrissar a mente',
    description: 'Respire por 2 minutos e defina o objetivo em voz alta.',
  },
  {
    id: 'environment',
    title: 'Preparar ambiente',
    description: 'Feche abas supérfluas, silencie o celular e hidrate-se.',
  },
  {
    id: 'debrief',
    title: 'Registrar aprendizados',
    description: 'Ao final, anote 3 insights e o próximo passo.',
  },
];

export default function ToolsFocus() {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(timerPresets[0].minutes);
  const navigate = useNavigate();

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

  const triggerTimer = (minutes?: number) => {
    if (typeof window === 'undefined') return;
    if (minutes) {
      window.dispatchEvent(new CustomEvent('setTimerPreset', { detail: { minutes } }));
    }
    window.dispatchEvent(new CustomEvent('openSessionTimer'));
  };

  const highlightSession = recentSessions[0];
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a0505] via-[#090101] to-[#020202] p-6 sm:p-8 shadow-[0_25px_90px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary">Tools & Focus</p>
            <h1 className="text-3xl font-serif font-light text-white">Central de Pomodoro</h1>
            <p className="mt-2 text-sm text-white/70">
              Escolha o ciclo ideal, acompanhe minutos investidos e acione o timer oficial sem sair do painel.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="gap-2 text-white" onClick={() => triggerTimer(selectedPreset)}>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {timerPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.minutes)}
                  className={cn(
                    'rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50',
                    selectedPreset === preset.minutes && 'border-white bg-white text-background shadow-lg shadow-white/10'
                  )}
                >
                  <p
                    className={cn(
                      'mb-2 text-[10px] font-semibold uppercase tracking-[0.35em]',
                      selectedPreset === preset.minutes ? 'text-background/70' : 'text-white/70'
                    )}
                  >
                    {preset.label}
                  </p>
                  <div
                    className={cn(
                      'text-3xl font-mono font-semibold',
                      selectedPreset === preset.minutes ? 'text-background' : 'text-white'
                    )}
                  >
                    {preset.minutes.toString().padStart(2, '0')}:00
                  </div>
                  <p
                    className={cn(
                      'mt-1 text-xs leading-snug',
                      selectedPreset === preset.minutes ? 'text-background/70' : 'text-white/70'
                    )}
                  >
                    {preset.description}
                  </p>
                </button>
              ))}
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

          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-center shadow-[0_25px_90px_rgba(0,0,0,0.55)]">
            <p className="text-xs uppercase tracking-[0.45em] text-white/70">Próximo ciclo</p>
            <div className="mt-4 text-6xl font-mono font-bold text-white">
              {selectedPreset.toString().padStart(2, '0')}:00
            </div>
            <p className="mt-2 text-sm text-white/60">Sincroniza com o timer flutuante do Nexus.</p>
            <Button className="mt-6 w-full gap-2 bg-primary text-white hover:bg-primary/90" onClick={() => triggerTimer(selectedPreset)}>
              <Play className="h-4 w-4" />
              Iniciar pomodoro oficial
            </Button>
            <p className="mt-3 text-[11px] text-white/60">
              Dica: revise metas antes de iniciar e use o botão flutuante para acompanhar em qualquer página.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr,0.65fr]">
        <Card className="border border-white/5 bg-card/60 backdrop-blur">
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
                <div key={item.label} className="rounded-2xl border border-white/5 bg-white/5 p-4">
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
                      className="items-center rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white md:flex md:justify-between"
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
          <Card className="border border-white/5 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock3 className="h-5 w-5 text-primary" />
                Atalhos imediatos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2" onClick={() => triggerTimer(selectedPreset)}>
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

          <Card className="border border-white/5 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-primary" />
                Micro-hábitos de foco
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {microHabits.map((habit) => (
                <div key={habit.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">{habit.title}</p>
                  <p className="text-xs text-white/70">{habit.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr,0.65fr]">
        <Card className="border border-white/5 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-primary" />
              Ritmo de foco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, idx) => (
                  <Skeleton key={idx} className="h-24 w-full rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Minutos</p>
                  <p className="text-2xl font-semibold text-white">{stats.totalMinutes}</p>
                  <span className="text-[11px] text-white/60">Acumulado recente</span>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Média</p>
                  <p className="text-2xl font-semibold text-white">{stats.averageMinutes}m</p>
                  <span className="text-[11px] text-white/60">Por ciclo</span>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Ciclos</p>
                  <p className="text-2xl font-semibold text-white">{stats.completedCycles}</p>
                  <span className="text-[11px] text-white/60">Pomodoros</span>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">Streak</p>
                  <p className="text-2xl font-semibold text-white">{stats.streakDays}d</p>
                  <span className="text-[11px] text-white/60">Dias seguidos</span>
                </div>
              </div>
            )}

            <div>
              <p className="mb-3 text-xs font-mono uppercase tracking-[0.3em] text-white/60">Últimas sessões</p>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, idx) => (
                    <Skeleton key={idx} className="h-14 w-full rounded-xl bg-white/5" />
                  ))}
                </div>
              ) : recentSessions.length === 0 ? (
                <p className="text-sm text-white/70">
                  Sem registros por enquanto. Inicie um ciclo acima para começar seu histórico.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="items-center rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white md:flex md:justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {session.type === 'break' ? 'Pausa guiada' : 'Sessão focada'}
                        </p>
                        <p className="text-xs text-white/60">{formatDateLabel(session.createdAt)}</p>
                      </div>
                      <div className="mt-2 text-right text-white md:mt-0">
                        <p className="text-base font-semibold text-primary">
                          {formatDuration(session.duration)}
                        </p>
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
          <Card className="border border-white/5 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock3 className="h-5 w-5 text-primary" />
                Atalhos imediatos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2" onClick={() => triggerTimer(selectedPreset)}>
                  <Play className="h-4 w-4" />
                  Iniciar agora
                </Button>
                <Button
                  variant="secondary"
                  className="gap-2 text-white"
                  onClick={() => navigate('/weekly-planner')}
                >
                  <CalendarClock className="h-4 w-4" />
                  Planejar blocos
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-white/10"
                  onClick={() => navigate('/spaced-repetition')}
                >
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

          <Card className="border border-white/5 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-primary" />
                Ponte com outros módulos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {focusLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => navigate(link.href)}
                    className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition hover:border-primary/40 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{link.title}</p>
                        <p className="text-xs text-white/70">{link.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-white/60" />
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-white/5 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ListChecks className="h-5 w-5 text-primary" />
              Rotina recomendada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {routineSteps.map((step, index) => (
              <div key={step.title} className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{step.title}</p>
                  <p className="text-sm text-white/70">{step.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-white/5 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-primary" />
              Guarda-chuva de foco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-white/80">
            <p>O Nexus centraliza os elementos essenciais para manter consistência:</p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-white/70">
              <li>Timer oficial registra automaticamente seus ciclos.</li>
              <li>Planner semanal distribui blocos de deep work.</li>
              <li>Notas e flashcards mantêm o registro pós-sessão.</li>
            </ul>
            <p className="text-xs text-white/60">
              Resultado: menos sobrecarga visual, mesma cadência de estudos e uma experiência coesa em todo o ecossistema UATI.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
