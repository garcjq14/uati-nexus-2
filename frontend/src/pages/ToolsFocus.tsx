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
  ListChecks,
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

export default function ToolsFocus() {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [loading, setLoading] = useState(true);
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

  const dispatchOpenTimer = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openSessionTimer'));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-8 px-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Deep Work</p>
          <h1 className="text-3xl font-serif font-light text-white tracking-tight">Modo Foco</h1>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-white/10"
          onClick={() => navigate('/statistics')}
        >
          <Activity className="h-4 w-4" />
          Ver desempenho completo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border border-white/5 bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white font-light flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Ritmo de foco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, idx) => (
                  <Skeleton key={idx} className="h-24 w-full rounded-xl bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Minutos</p>
                  <p className="text-2xl font-semibold text-white">{stats.totalMinutes}</p>
                  <span className="text-[11px] text-muted-foreground">Total nos últimos registros</span>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Média</p>
                  <p className="text-2xl font-semibold text-white">{stats.averageMinutes}m</p>
                  <span className="text-[11px] text-muted-foreground">Por sessão concluída</span>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Ciclos</p>
                  <p className="text-2xl font-semibold text-white">{stats.completedCycles}</p>
                  <span className="text-[11px] text-muted-foreground">Pomodoros ativos</span>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Streak</p>
                  <p className="text-2xl font-semibold text-white">{stats.streakDays}d</p>
                  <span className="text-[11px] text-muted-foreground">Dias consecutivos</span>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs uppercase font-mono tracking-[0.3em] text-muted-foreground mb-3">Últimas sessões</p>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, idx) => (
                    <Skeleton key={idx} className="h-12 w-full rounded-lg bg-white/5" />
                  ))}
                </div>
              ) : recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda não há sessões registradas. Inicie seu primeiro ciclo pelo timer do Nexus.</p>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm text-white font-medium">
                          {session.type === 'break' ? 'Pausa' : 'Sessão focada'}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateLabel(session.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{formatDuration(session.duration)}</p>
                        <span className="text-[11px] text-muted-foreground">Registrado</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/5 bg-card">
          <CardHeader>
            <CardTitle className="text-white font-light flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Rotina recomendada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {routineSteps.map((step, index) => (
              <div key={step.title} className="rounded-lg bg-white/5 p-4 border border-white/5">
                <p className="text-xs uppercase tracking-wide text-primary mb-1">Etapa {index + 1}</p>
                <p className="text-base text-white font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border border-white/5 bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white font-light flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary" />
              Atalhos imediatos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2" onClick={dispatchOpenTimer}>
                <Play className="h-4 w-4" />
                Iniciar sessão agora
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {focusLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => navigate(link.href)}
                    className="rounded-xl border border-white/5 bg-white/5 p-4 text-left transition hover:border-primary/30 hover:bg-white/10"
                  >
                    <Icon className="h-5 w-5 text-primary mb-3" />
                    <p className="text-sm text-white font-medium">{link.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">{link.description}</p>
                    <span className="inline-flex items-center text-xs text-primary gap-1">
                      Acessar
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/5 bg-card">
          <CardHeader>
            <CardTitle className="text-white font-light flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Guarda-chuva de foco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Este painel consolida os recursos essenciais já existentes no UATI Nexus:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Timer oficial (botão flutuante) registra automaticamente seus ciclos.</li>
              <li>Planner semanal distribui blocos para manter consistência.</li>
              <li>Notas e flashcards evitam redundância de todo/quick notes.</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Resultado: menos componentes pesados carregados de uma só vez e foco naquilo que já funciona no ecossistema do app.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
