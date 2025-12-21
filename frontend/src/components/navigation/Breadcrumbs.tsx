import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/curriculum': 'Plano de Curso',
  '/library': 'Biblioteca',
  '/projects': 'Projetos',
  '/notes': 'Notas',
  '/spaced-repetition': 'Flashcards',
  '/knowledge-graph': 'Grafo de Conhecimento',
  '/statistics': 'Estatísticas',
  '/settings': 'Configurações',
  '/profile': 'Perfil',
};

export function Breadcrumbs() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', path: '/' },
  ];

  let currentPath = '';
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    const label = routeLabels[currentPath] || path.charAt(0).toUpperCase() + path.slice(1);
    breadcrumbs.push({ label, path: currentPath });
  });

  // Don't show breadcrumbs on dashboard
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm overflow-x-auto" aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <div key={crumb.path} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {index === 0 ? (
              <Link
                to={crumb.path}
                className="flex items-center gap-1 text-muted-foreground hover:text-white transition-colors touch-manipulation"
                style={{ minWidth: '44px', minHeight: '44px', padding: '0.5rem' }}
              >
                <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            ) : (
              <>
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                {isLast ? (
                  <span className="text-white font-medium truncate max-w-[120px] sm:max-w-none">{crumb.label}</span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-muted-foreground hover:text-white transition-colors truncate max-w-[100px] sm:max-w-none touch-manipulation"
                    style={{ minHeight: '44px', padding: '0.25rem 0.5rem' }}
                  >
                    {crumb.label}
                  </Link>
                )}
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
}





