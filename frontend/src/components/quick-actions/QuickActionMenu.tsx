import { motion } from 'framer-motion';
import type { LucideIcon } from '../../types/lucide';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface QuickAction {
  icon: LucideIcon;
  label: string;
  action: () => void;
}

interface QuickActionMenuProps {
  actions: QuickAction[];
  onClose: () => void;
}

export function QuickActionMenu({ actions, onClose }: QuickActionMenuProps) {
  return (
    <Card className="border-white/10 bg-background/95 backdrop-blur-md shadow-xl min-w-[200px]">
      <CardContent className="p-2">
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => {
              action.action();
              onClose();
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
              'hover:bg-white/5 transition-colors',
              'text-left text-sm font-medium text-white'
            )}
          >
            <action.icon className="h-5 w-5 text-primary" />
            <span>{action.label}</span>
          </motion.button>
        ))}
      </CardContent>
    </Card>
  );
}

