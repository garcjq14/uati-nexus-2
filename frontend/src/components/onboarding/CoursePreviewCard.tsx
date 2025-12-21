import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { GraduationCap, BookOpen, Code, Network } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CoursePreviewCardProps {
  title: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: 'graduation' | 'book' | 'code' | 'network';
}

const iconMap = {
  graduation: GraduationCap,
  book: BookOpen,
  code: Code,
  network: Network,
};

export function CoursePreviewCard({
  title,
  description,
  selected = false,
  onClick,
  icon = 'graduation',
}: CoursePreviewCardProps) {
  const Icon = iconMap[icon];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-300',
          selected
            ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(120,6,6,0.3)]'
            : 'border-border bg-secondary hover:border-primary/50 hover:bg-primary/5'
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg transition-colors',
                selected
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-muted-foreground'
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            {selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-6 w-6 rounded-full bg-primary flex items-center justify-center"
              >
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}





