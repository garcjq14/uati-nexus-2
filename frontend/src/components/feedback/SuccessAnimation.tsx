import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, Trophy, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  message: string;
  type?: 'success' | 'achievement' | 'milestone';
  duration?: number;
  onComplete?: () => void;
}

export function SuccessAnimation({
  message,
  type = 'success',
  duration = 2000,
  onComplete,
}: SuccessAnimationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => onComplete?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const icons = {
    success: CheckCircle2,
    achievement: Trophy,
    milestone: Star,
  };

  const colors = {
    success: 'text-green-400',
    achievement: 'text-yellow-400',
    milestone: 'text-primary',
  };

  const Icon = icons[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            {/* Confetti particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  opacity: 0,
                  x: 0,
                  y: 0,
                  rotate: 0,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 8) * 100,
                  y: Math.sin((i * Math.PI * 2) / 8) * 100,
                  rotate: 360,
                }}
                transition={{
                  delay: 0.2,
                  duration: 1.5,
                  ease: 'easeOut',
                }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
            ))}

            <div className="bg-background border border-primary/30 rounded-xl px-6 py-4 shadow-[0_0_30px_rgba(120,6,6,0.3)] flex items-center gap-3 min-w-[300px]">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Icon className={`h-6 w-6 ${colors[type]}`} />
              </motion.div>
              <p className="text-white font-medium">{message}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface MicroCelebrationProps {
  trigger: boolean;
  type?: 'task' | 'flashcard' | 'module' | 'project';
  onComplete?: () => void;
}

export function MicroCelebration({ trigger, type = 'task', onComplete }: MicroCelebrationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  const messages = {
    task: 'Tarefa concluída!',
    flashcard: 'Excelente!',
    module: 'Módulo completo!',
    project: 'Projeto finalizado!',
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className="text-4xl"
          >
            ✨
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-12 text-sm font-semibold text-primary"
          >
            {messages[type]}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}





