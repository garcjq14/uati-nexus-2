import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { GripVertical, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DashboardWidgetProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  onRemove?: () => void;
  isDragging?: boolean;
}

export function DashboardWidget({
  id,
  title,
  children,
  className,
  onRemove,
  isDragging,
}: DashboardWidgetProps) {
  return (
    <div className={cn('relative group', className)}>
      <Card className="border-white/5 bg-card h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-move" />
              <h3 className="text-sm font-semibold text-white">{title}</h3>
            </div>
            {onRemove && (
              <button
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

