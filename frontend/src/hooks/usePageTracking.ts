import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageVisit, trackDashboardVisit } from '../lib/activityTracker';

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/statistics': 'Estatísticas',
  '/activities': 'Atividades',
  '/notifications': 'Notificações',
  '/curriculum': 'Currículo',
  '/projects': 'Projetos',
  '/notes': 'Notas',
  '/library': 'Biblioteca',
  '/spaced-repetition': 'Repetição Espaçada',
  '/knowledge-graph': 'Grafo de Conhecimento',
  '/achievements': 'Conquistas',
  '/settings': 'Configurações',
  '/profile': 'Perfil',
};

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    
    // Track dashboard visit specifically
    if (pathname === '/') {
      trackDashboardVisit();
    }
    
    // Track page visit
    const pageName = pageNames[pathname] || pathname;
    trackPageVisit(pageName);
  }, [location.pathname]);
}




