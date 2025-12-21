import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trophy, Sparkles, Star, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MicroCelebrationProps {
  type: 'module' | 'flashcard' | 'project' | 'achievement';
  message?: string;
  onComplete?: () => void;
}

const celebrationConfig = {
  module: {
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    defaultMessage: 'Módulo concluído!',
    emoji: '🎉',
  },
  flashcard: {
    icon: Star,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    defaultMessage: 'Excelente!',
    emoji: '⭐',
  },
  project: {
    icon: Trophy,
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    defaultMessage: 'Projeto finalizado!',
    emoji: '🏆',
  },
  achievement: {
    icon: Zap,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    defaultMessage: 'Conquista desbloqueada!',
    emoji: '✨',
  },
};

export function MicroCelebration({ type, message, onComplete }: MicroCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = celebrationConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <div className={`${config.bgColor} border-2 border-white/20 rounded-2xl p-8 shadow-2xl backdrop-blur-md`}>
            <div className="flex flex-col items-center gap-4">
              {/* Icon with animation */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className={`${config.color} relative`}
              >
                <Icon className="h-16 w-16" />
                <motion.div
                  animate={{ scale: [0, 1.5, 0], opacity: [1, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border-4 border-current"
                />
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-4xl mb-2">{config.emoji}</div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {message || config.defaultMessage}
                </h3>
              </motion.div>

              {/* Sparkles effect */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 6) * 100,
                    y: Math.sin((i * Math.PI * 2) / 6) * 100,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.3 + i * 0.1,
                    ease: 'easeOut',
                  }}
                >
                  <Sparkles className={`h-6 w-6 ${config.color}`} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}





