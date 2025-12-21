import { motion } from 'framer-motion';
import type { LucideIcon } from '../../types/lucide';
import { cn } from '../../lib/utils';

interface AchievementBadgeProps {
  icon: LucideIcon;
  title: string;
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AchievementBadge({
  icon: Icon,
  title,
  unlocked,
  size = 'md',
  className,
}: AchievementBadgeProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <motion.div
      className={cn('relative', className)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={title}
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center border-2 transition-all',
          sizes[size],
          unlocked
            ? 'bg-primary/20 border-primary text-primary'
            : 'bg-white/5 border-white/10 text-muted-foreground opacity-50'
        )}
      >
        <Icon className={size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'} />
      </div>
      {unlocked && (
        <motion.div
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-background"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        />
      )}
    </motion.div>
  );
}

