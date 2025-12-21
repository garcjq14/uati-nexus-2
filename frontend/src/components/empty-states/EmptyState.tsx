import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import type { LucideIcon } from '../../types/lucide';
import { Sparkles, Rocket, Target } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: ReactNode;
  className?: string;
  motivational?: boolean;
  type?: 'default' | 'dashboard' | 'library' | 'projects' | 'notes' | 'flashcards';
}

const motivationalMessages = [
  'Cada jornada começa com um primeiro passo',
  'Grandes conquistas são feitas de pequenos progressos',
  'O aprendizado é uma aventura sem fim',
  'Sua dedicação transforma sonhos em realidade',
];

const getContextualContent = (type?: string) => {
  switch (type) {
    case 'dashboard':
      return {
        emoji: '🎯',
        motivational: 'Seu dashboard está pronto para ser preenchido com progresso!',
      };
    case 'library':
      return {
        emoji: '📚',
        motivational: 'Construa sua biblioteca de conhecimento, um recurso de cada vez',
      };
    case 'projects':
      return {
        emoji: '🚀',
        motivational: 'Transforme conhecimento em projetos práticos e demonstre seu domínio',
      };
    case 'notes':
      return {
        emoji: '📝',
        motivational: 'Capture ideias, insights e conexões. Cada nota é um tijolo no seu conhecimento',
      };
    case 'flashcards':
      return {
        emoji: '🧠',
        motivational: 'Crie flashcards para revisão espaçada e retenção duradoura',
      };
    default:
      return {
        emoji: '✨',
        motivational: motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
      };
  }
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  className,
  motivational = true,
  type = 'default',
}: EmptyStateProps) {
  const contextual = getContextualContent(type);
  const displayEmoji = contextual.emoji;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="border-white/5 bg-white/[0.02] relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <CardContent className="flex flex-col items-center justify-center p-12 text-center relative z-10">
          {illustration ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              {illustration}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6 relative"
            >
              {Icon ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 relative">
                  <Icon className="h-10 w-10 text-primary" />
                  {motivational && (
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="h-6 w-6 text-primary" />
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-6xl mb-2"
                >
                  {displayEmoji}
                </motion.div>
              )}
            </motion.div>
          )}

          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-semibold text-white mb-2"
          >
            {title}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-2 max-w-md"
          >
            {description}
          </motion.p>

          {motivational && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 text-sm text-primary/80 mb-6"
            >
              <Rocket className="h-4 w-4" />
              <span>{contextual.motivational}</span>
            </motion.div>
          )}

          {actionLabel && onAction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                onClick={onAction} 
                variant="default" 
                className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(120,6,6,0.3)]"
              >
                <Target className="mr-2 h-4 w-4" />
                {actionLabel}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

