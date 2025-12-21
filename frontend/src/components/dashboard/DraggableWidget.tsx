import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DashboardWidget } from './DashboardWidget';
import type { ReactNode } from 'react';

interface DraggableWidgetProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  onRemove?: () => void;
}

export function DraggableWidget({
  id,
  title,
  children,
  className,
  onRemove,
}: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'none',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DashboardWidget
        id={id}
        title={title}
        className={className}
        onRemove={onRemove}
        isDragging={isDragging}
      >
        <div {...listeners} className="cursor-grab active:cursor-grabbing -m-2 p-2">
          {children}
        </div>
      </DashboardWidget>
    </div>
  );
}

