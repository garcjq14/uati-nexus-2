import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, X } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface AchievementUnlockProps {
  achievement: {
    title: string;
    description: string;
    icon?: any;
  };
  onClose: () => void;
}

export function AchievementUnlock({ achievement, onClose }: AchievementUnlockProps) {
  const Icon = achievement.icon || Trophy;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          className="relative"
        >
          {/* Confetti */}
          {[...Array(12)].map((_, i) => (
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
                x: Math.cos((i * Math.PI * 2) / 12) * 150,
                y: Math.sin((i * Math.PI * 2) / 12) * 150,
                rotate: 360,
              }}
              transition={{
                delay: 0.2,
                duration: 2,
                ease: 'easeOut',
              }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
          ))}

          <Card className="border-primary/30 bg-background/95 backdrop-blur-md shadow-2xl max-w-md">
            <CardContent className="p-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="mx-auto"
              >
                <div className="h-24 w-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto">
                  <Icon className="h-12 w-12 text-primary" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-serif font-bold text-white mb-2">
                  Conquista Desbloqueada!
                </h2>
                <h3 className="text-xl font-semibold text-primary mb-2">{achievement.title}</h3>
                <p className="text-muted-foreground">{achievement.description}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button onClick={onClose} variant="default" className="w-full">
                  Continuar
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}





