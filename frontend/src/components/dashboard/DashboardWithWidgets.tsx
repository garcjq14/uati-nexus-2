import { useDashboard } from '../../contexts/DashboardContext';
import { WidgetGrid } from './WidgetGrid';
import { ProgressWidget } from './widgets/ProgressWidget';
import { FlashcardsWidget } from './widgets/FlashcardsWidget';
import { ActiveProjectWidget } from './widgets/ActiveProjectWidget';
import { ModulesWidget } from './widgets/ModulesWidget';

export function DashboardWithWidgets() {
  const { isLoading } = useDashboard();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const widgets = [
    {
      id: 'progress',
      title: 'Progresso Geral',
      component: <ProgressWidget />,
      defaultSize: { w: 1, h: 1 },
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      component: <FlashcardsWidget />,
      defaultSize: { w: 1, h: 2 },
    },
    {
      id: 'active-project',
      title: 'Projeto Ativo',
      component: <ActiveProjectWidget />,
      defaultSize: { w: 2, h: 2 },
    },
    {
      id: 'modules',
      title: 'Módulos em Foco',
      component: <ModulesWidget />,
      defaultSize: { w: 2, h: 2 },
    },
  ];

  return <WidgetGrid widgets={widgets} />;
}





