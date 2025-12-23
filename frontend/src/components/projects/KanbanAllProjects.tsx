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
import { Plus, Trash2, ChevronLeft, ChevronRight, Code } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { ProjectStatusBadge } from './ProjectStatusBadge';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  description?: string;
  projectId: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
  tasks: Task[];
}

interface KanbanAllProjectsProps {
  projects: Project[];
  onTaskMove: (taskId: string, newStatus: 'todo' | 'doing' | 'done') => Promise<void>;
  onTaskDelete?: (taskId: string) => Promise<void>;
  onAddTask?: (projectId: string, status: 'todo' | 'doing' | 'done') => void;
}

const columns = [
  { id: 'todo', title: 'A Fazer', color: 'border-yellow-500/30 bg-yellow-500/5' },
  { id: 'doing', title: 'Em Andamento', color: 'border-[#780606]/30 bg-[#780606]/5' },
  { id: 'done', title: 'Concluído', color: 'border-green-500/30 bg-green-500/5' },
] as const;

interface SortableTaskProps {
  task: Task;
  projectTitle: string;
  isDragging: boolean;
  onMoveBack?: () => void;
  onMoveForward?: () => void;
  onDelete?: () => void;
  canMoveBack: boolean;
  canMoveForward: boolean;
}

function SortableTask({
  task,
  projectTitle,
  isDragging,
  onMoveBack,
  onMoveForward,
  onDelete,
  canMoveBack,
  canMoveForward,
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
      <div className="flex items-start justify-between gap-2">
        <div {...attributes} {...listeners} className="cursor-move flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Code className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate">{projectTitle}</span>
          </div>
          <p className="text-sm font-medium text-white">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
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
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors opacity-40 group-hover:opacity-100"
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
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors opacity-40 group-hover:opacity-100"
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
              className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors opacity-40 group-hover:opacity-100"
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
  projects: Project[];
  onAddTask?: (projectId: string, status: 'todo' | 'doing' | 'done') => void;
  onTaskMove: (taskId: string, newStatus: 'todo' | 'doing' | 'done') => Promise<void>;
  onTaskDelete?: (taskId: string) => Promise<void>;
  isOver?: boolean;
}

function DroppableColumn({
  column,
  tasks,
  projects,
  onAddTask,
  onTaskMove,
  onTaskDelete,
  isOver,
}: DroppableColumnProps) {
  const taskIds = tasks.map((task) => task.id);
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: column.id,
  });

  const getProjectTitle = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.title || 'Projeto';
  };

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
    <div className="flex flex-col h-full min-h-[600px] max-h-[800px] border border-white/10 rounded-lg overflow-hidden">
      <div className={cn('p-4 rounded-t-lg border-b flex-shrink-0', column.color)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-sm sm:text-base">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-white/10 px-2 py-1 rounded">
            {tasks.length}
          </span>
        </div>
        {onAddTask && projects.length > 0 && (
          <div className="space-y-2 max-h-[120px] overflow-y-auto">
            {projects.map((project) => (
              <Button
                key={project.id}
                variant="ghost"
                size="sm"
                onClick={() => onAddTask(project.id, column.id)}
                className="w-full text-xs text-muted-foreground hover:text-white justify-start truncate"
                title={project.title}
              >
                <Plus className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{project.title}</span>
              </Button>
            ))}
          </div>
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
                projectTitle={getProjectTitle(task.projectId)}
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
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Nenhuma tarefa</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">Adicione tarefas aos projetos</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanAllProjects({ projects, onTaskMove, onTaskDelete, onAddTask }: KanbanAllProjectsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Coletar todas as tarefas de todos os projetos
  const allTasks = projects.flatMap((project) =>
    (project.tasks || []).map((task) => ({
      ...task,
      projectId: project.id,
    }))
  );

  const handleDragStart = (event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    if (event.over) {
      const overId = String(event.over.id);
      if (columns.some((col) => col.id === overId)) {
        setOverColumn(overId);
      } else {
        const task = allTasks.find((t) => t.id === overId);
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
    const task = allTasks.find((t) => t.id === taskId);

    if (!task) {
      return;
    }

    let targetStatus: 'todo' | 'doing' | 'done' = task.status;

    const overId = String(over.id);
    const column = columns.find((col) => col.id === overId);
    if (column) {
      targetStatus = column.id as 'todo' | 'doing' | 'done';
    } else {
      const targetTask = allTasks.find((t) => t.id === overId);
      if (targetTask) {
        targetStatus = targetTask.status;
      }
    }

    if (task.status !== targetStatus) {
      try {
        await onTaskMove(taskId, targetStatus);
      } catch (error) {
        console.error('Failed to move task:', error);
      }
    }
  };

  const getTasksByStatus = (status: 'todo' | 'doing' | 'done') => {
    return allTasks.filter((task) => task.status === status);
  };

  const activeTask = activeId ? allTasks.find((t) => t.id === activeId) : null;
  const activeProject = activeTask ? projects.find((p) => p.id === activeTask.projectId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              projects={projects}
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
        {activeTask && activeProject ? (
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
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{activeProject.title}</span>
            </div>
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

