import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { DraggableWidget } from './DraggableWidget';
import { Button } from '../ui/button';
import { Edit2, Check, X, Eye, EyeOff } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';

interface Widget {
  id: string;
  title: string;
  component: React.ReactNode;
  defaultSize: { w: number; h: number };
}

interface WidgetGridProps {
  widgets: Widget[];
}

export function WidgetGrid({ widgets }: WidgetGridProps) {
  const { layout, updateLayout } = useDashboard();
  const [isEditing, setIsEditing] = useState(false);
  const [localLayout, setLocalLayout] = useState(() => ({
    ...layout,
    widgets: layout.widgets || [],
  }));
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalLayout((prevLayout) => {
        if (!prevLayout.widgets || prevLayout.widgets.length === 0) {
          return prevLayout;
        }
        const oldIndex = prevLayout.widgets.findIndex((w) => w.id === active.id);
        const newIndex = prevLayout.widgets.findIndex((w) => w.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          return prevLayout;
        }

        const newWidgets = arrayMove(prevLayout.widgets, oldIndex, newIndex);
        return { ...prevLayout, widgets: newWidgets };
      });
    }
  };

  const handleSave = () => {
    updateLayout(localLayout);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalLayout(layout);
    setIsEditing(false);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setHiddenWidgets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  };

  const visibleWidgets = widgets.filter((w) => !hiddenWidgets.has(w.id));
  const widgetIds = visibleWidgets.map((w) => w.id);

  return (
    <div className="space-y-6">
      {/* Edit Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {hiddenWidgets.size > 0 && (
            <span>{hiddenWidgets.size} widget{hiddenWidgets.size > 1 ? 's' : ''} oculto{hiddenWidgets.size > 1 ? 's' : ''}</span>
          )}
        </div>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Personalizar Dashboard
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        )}
      </div>

      {/* Widget Visibility Controls */}
      {isEditing && (
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <p className="text-sm font-semibold text-white mb-3">Mostrar/Ocultar Widgets</p>
          <div className="flex flex-wrap gap-2">
            {widgets.map((widget) => {
              const isHidden = hiddenWidgets.has(widget.id);
              return (
                <Button
                  key={widget.id}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className={`flex items-center gap-2 ${isHidden ? 'opacity-50' : ''}`}
                >
                  {isHidden ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Mostrar {widget.title}
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Ocultar {widget.title}
                    </>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleWidgets.map((widget) => {
              const widgetLayout = localLayout.widgets?.find((w) => w.id === widget.id);
              const colSpan = widgetLayout?.w || widget.defaultSize.w;
              const rowSpan = widgetLayout?.h || widget.defaultSize.h;

              return (
                <div
                  key={widget.id}
                  className={`col-span-${colSpan} row-span-${rowSpan}`}
                  style={{
                    gridColumn: `span ${colSpan}`,
                    gridRow: `span ${rowSpan}`,
                  }}
                >
                  <DraggableWidget
                    id={widget.id}
                    title={widget.title}
                    onRemove={isEditing ? () => {
                      toggleWidgetVisibility(widget.id);
                    } : undefined}
                  >
                    {widget.component}
                  </DraggableWidget>
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {isEditing && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            Modo de edição ativo. Arraste os widgets para reorganizar ou use os controles acima para mostrar/ocultar widgets.
          </p>
        </div>
      )}
    </div>
  );
}

