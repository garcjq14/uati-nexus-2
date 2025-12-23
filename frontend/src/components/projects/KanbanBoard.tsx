import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useToast } from '../feedback/ToastSystem';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  description?: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: 'todo' | 'doing' | 'done') => Promise<void>;
  onTaskDelete?: (taskId: string) => Promise<void>;
  onAddTask?: (status: 'todo' | 'doing' | 'done') => void;
}

const columns = [
  { id: 'todo', title: 'A Fazer', color: 'border-yellow-500/30 bg-yellow-500/5' },
  { id: 'doing', title: 'Em Progresso', color: 'border-[#780606]/30 bg-[#780606]/5' },
  { id: 'done', title: 'Concluído', color: 'border-green-500/30 bg-green-500/5' },
] as const;

interface SortableTaskProps {
  task: Task;
  isDragging: boolean;
  onMoveBack?: () => void;
  onMoveForward?: () => void;
  onDelete?: () => void;
  canMoveBack: boolean;
  canMoveForward: boolean;
}

function SortableTask({ 
  task, 
  isDragging, 
  onMoveBack, 
  onMoveForward, 
  onDelete,
  canMoveBack,
  canMoveForward 
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isSortableDragging || isDragging ? 0.8 : 1,
        y: 0,
        scale: isSortableDragging || isDragging ? 1.05 : 1,
      }}
      whileHover={{ scale: 1.02 }}
      {...({ className: cn(
        'group p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:border-[#780606]/40 transition-all relative',
        (isSortableDragging || isDragging) && 'opacity-50 shadow-lg border-[#780606]/60'
      ) } as { className?: string })}
    >
      {/* Drag handle area - exclude action buttons */}
      <div className="flex items-start justify-between gap-2">
        <div {...attributes} {...listeners} className="cursor-move flex-1">
          <p className="text-sm font-medium text-white">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
        {/* Action buttons - always visible but smaller */}
        <div className="flex gap-1 flex-shrink-0">
          {canMoveBack && onMoveBack && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onMoveBack();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Voltar status"
              aria-label="Voltar status"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          )}
          {canMoveForward && onMoveForward && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onMoveForward();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Avançar status"
              aria-label="Avançar status"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
                  onDelete();
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors cursor-pointer z-10"
              title="Deletar tarefa"
              aria-label="Deletar tarefa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface DroppableColumnProps {
  column: typeof columns[number];
  tasks: Task[];
  onAddTask?: (status: 'todo' | 'doing' | 'done') => void;
  onTaskMove: (taskId: string, newStatus: 'todo' | 'doing' | 'done') => Promise<void>;
  onTaskDelete?: (taskId: string) => Promise<void>;
  isOver?: boolean;
}

function DroppableColumn({ 
  column, 
  tasks, 
  onAddTask, 
  onTaskMove,
  onTaskDelete,
  isOver 
}: DroppableColumnProps) {
  const taskIds = tasks.map((task) => task.id);
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: column.id,
  });

  const getPreviousStatus = (currentStatus: 'todo' | 'doing' | 'done'): 'todo' | 'doing' | 'done' | null => {
    if (currentStatus === 'done') return 'doing';
    if (currentStatus === 'doing') return 'todo';
    return null;
  };

  const getNextStatus = (currentStatus: 'todo' | 'doing' | 'done'): 'todo' | 'doing' | 'done' | null => {
    if (currentStatus === 'todo') return 'doing';
    if (currentStatus === 'doing') return 'done';
    return null;
  };

  return (
    <div className="flex flex-col h-full min-h-[500px] max-h-[700px] border border-white/10 rounded-lg overflow-hidden">
      <div className={cn('p-4 rounded-t-lg border-b flex-shrink-0', column.color)}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white text-sm sm:text-base">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-white/10 px-2 py-1 rounded">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddTask(column.id)}
            className="w-full text-xs text-muted-foreground hover:text-white"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar tarefa
          </Button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-4 space-y-3 rounded-b-lg transition-colors overflow-y-auto overflow-x-hidden',
          (isOver || isDroppableOver) ? 'bg-[#780606]/5 border-[#780606]/20' : 'bg-white/[0.02]'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => {
            const previousStatus = getPreviousStatus(task.status);
            const nextStatus = getNextStatus(task.status);
            
            return (
              <SortableTask 
                key={task.id} 
                task={task} 
                isDragging={false}
                canMoveBack={previousStatus !== null}
                canMoveForward={nextStatus !== null}
                onMoveBack={previousStatus ? () => onTaskMove(task.id, previousStatus) : undefined}
                onMoveForward={nextStatus ? () => onTaskMove(task.id, nextStatus) : undefined}
                onDelete={onTaskDelete ? () => onTaskDelete(task.id) : undefined}
              />
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ tasks, onTaskMove, onTaskDelete, onAddTask }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const { success } = useToast();

  // Configure pointer sensor to only activate after a delay or distance
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    if (event.over) {
      const overId = String(event.over.id);
      // Check if we're over a column
      if (columns.some((col) => col.id === overId)) {
        setOverColumn(overId);
      } else {
        // If over a task, find which column it belongs to
        const task = tasks.find((t) => t.id === overId);
        if (task) {
          setOverColumn(task.status);
        } else {
          setOverColumn(null);
        }
      }
    } else {
      setOverColumn(null);
    }
  };

  const handleDragEnd = async (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumn(null);

    if (!over) {
      return;
    }

    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      return;
    }

    // Determine the target column
    let targetStatus: 'todo' | 'doing' | 'done' = task.status;

    // Check if we're dropping on a column
    const overId = String(over.id);
    const column = columns.find((col) => col.id === overId);
    if (column) {
      targetStatus = column.id as 'todo' | 'doing' | 'done';
    } else {
      // If dropping on a task, use that task's status
      const targetTask = tasks.find((t) => t.id === overId);
      if (targetTask) {
        targetStatus = targetTask.status;
      }
    }

    if (task.status !== targetStatus) {
      try {
        await onTaskMove(taskId, targetStatus);
        success('Tarefa movida com sucesso!');
      } catch (error) {
        console.error('Failed to move task:', error);
      }
    }
  };

  const getTasksByStatus = (status: 'todo' | 'doing' | 'done') => {
    return tasks.filter((task) => task.status === status);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full overflow-x-auto">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              onAddTask={onAddTask}
              onTaskMove={onTaskMove}
              onTaskDelete={onTaskDelete}
              isOver={overColumn === column.id}
            />
          );
        })}
      </div>
      <DragOverlay
        style={{ cursor: 'grabbing' }}
        dropAnimation={null}
      >
        {activeTask ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1.05,
              rotate: 2,
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            {...({ 
              className: 'p-3 rounded-lg border border-[#780606]/60 bg-[#050506] shadow-2xl w-64 pointer-events-none' 
            } as { className?: string })}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-white flex-1">
                {activeTask.title}
              </p>
            </div>
            {activeTask.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {activeTask.description}
              </p>
            )}
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
