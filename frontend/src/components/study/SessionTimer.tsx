import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Maximize2, Minimize2, X, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { useToast } from '../feedback/ToastSystem';

declare global {
  interface WindowEventMap {
    openSessionTimer: CustomEvent<void>;
    setTimerPreset: CustomEvent<{ minutes: number }>;
  }
}

interface SessionTimerProps {
  initialMinutes?: number;
  onComplete?: (duration: number) => void;
  className?: string;
}

export function SessionTimer({ initialMinutes = 25, onComplete, className }: SessionTimerProps) {
  const [baseMinutes, setBaseMinutes] = useState(initialMinutes);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { success } = useToast();

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev === 0) {
            setMinutes((prevMin) => {
              if (prevMin === 0) {
                handleComplete();
                return 0;
              }
              return prevMin - 1;
            });
            return 59;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    const handleOpenTimer = () => setIsExpanded(true);
    window.addEventListener('openSessionTimer', handleOpenTimer);
    return () => window.removeEventListener('openSessionTimer', handleOpenTimer);
  }, []);

  useEffect(() => {
    const handlePreset = (event: CustomEvent<{ minutes: number }>) => {
      if (!event?.detail?.minutes) return;
      setBaseMinutes(event.detail.minutes);
      setMinutes(event.detail.minutes);
      setSeconds(0);
      setIsExpanded(true);
      setIsRunning(false);
    };

    const presetListener = (event: Event) => handlePreset(event as CustomEvent<{ minutes: number }>);
    window.addEventListener('setTimerPreset', presetListener);
    return () => window.removeEventListener('setTimerPreset', presetListener);
  }, []);

  useEffect(() => {
    setBaseMinutes(initialMinutes);
    setMinutes(initialMinutes);
    setSeconds(0);
  }, [initialMinutes]);

  const handleStart = async () => {
    setIsRunning(true);
    const sessionDuration = baseMinutes * 60;
    try {
      const response = await api.post('/timer/session', {
        duration: sessionDuration,
        type: 'pomodoro',
      });
      setSessionId(response.data.id);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setMinutes(baseMinutes);
    setSeconds(0);
    setSessionId(null);
  };

  const handleComplete = async () => {
    setIsRunning(false);
    const totalElapsed = baseMinutes * 60 - (minutes * 60 + seconds);
    const totalSeconds = Math.max(0, totalElapsed);
    
    if (sessionId) {
      try {
        await api.put(`/timer/session/${sessionId}`, {
          completed: true,
          duration: totalSeconds,
        });
      } catch (error) {
        console.error('Failed to update session:', error);
      }
    }

    success('Sessão de estudo concluída!');
    onComplete?.(totalSeconds);
    handleStop();
  };

  const formatTime = (min: number, sec: number) => {
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const progressBase = Math.max(1, baseMinutes * 60);
  const rawProgress =
    ((progressBase - (minutes * 60 + seconds)) / progressBase) * 100;
  const progress = Math.min(100, Math.max(0, rawProgress));

  if (isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Card className="border-primary/30 bg-background/95 backdrop-blur-md shadow-2xl w-80">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Timer de Estudo</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded hover:bg-white/5"
                >
                  <Minimize2 className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={handleStop}
                  className="p-1 rounded hover:bg-white/5"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="text-5xl font-mono font-bold text-primary mb-2">
                {formatTime(minutes, seconds)}
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>

            <div className="mb-4 flex gap-3">
              <Button
                onClick={() => {
                  setMinutes(25);
                  setSeconds(0);
                }}
                variant="outline"
                size="sm"
                className="flex-1 text-xs transition-all hover:bg-secondary/50 hover:scale-105 active:scale-95"
                disabled={isRunning}
              >
                25:00
              </Button>
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  variant="default"
                  className="flex-1 bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar
                </Button>
              ) : (
                <Button
                  onClick={handlePause}
                  variant="outline"
                  className="flex-1 transition-all hover:bg-secondary/50 hover:scale-105 active:scale-95"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar
                </Button>
              )}
              <Button
                onClick={handleStop}
                variant="outline"
                className="flex-1 transition-all hover:bg-secondary/50 hover:scale-105 active:scale-95"
              >
                <Square className="mr-2 h-4 w-4" />
                Parar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={() => setIsExpanded(true)}
      className={cn(
        'fixed z-40 flex items-center justify-center rounded-full bg-primary text-white shadow-[0_0_30px_rgba(120,6,6,0.5)]',
        'hover:bg-primary/90 touch-manipulation',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Timer: ${formatTime(minutes, seconds)}`}
      style={{ 
        transform: 'translateZ(0)',
        bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 1rem))',
        right: 'max(5.5rem, calc(env(safe-area-inset-right) + 5.5rem))',
        minWidth: '56px',
        minHeight: '56px',
        width: '56px',
        height: '56px'
      }}
    >
      <Clock className="h-6 w-6 text-white" />
    </motion.button>
  );
}

export default SessionTimer;
