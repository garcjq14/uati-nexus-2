import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, LayoutDashboard, Menu, X } from 'lucide-react';
import type { LucideIcon } from '../../types/lucide';
import api from '../../lib/api';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { Breadcrumbs } from '../navigation/Breadcrumbs';
import { CourseSelector } from '../courses/CourseSelector';

const pageTitles: Record<string, { title: string; subtitle: string; icon: LucideIcon | null }> = {
  '/': { title: 'Nexus Dashboard', subtitle: 'MOD. DASHBOARD', icon: LayoutDashboard },
  '/statistics': { title: 'Estatísticas Detalhadas', subtitle: 'MOD. STATS', icon: null },
  '/activities': { title: 'Feed de Atividades', subtitle: 'MOD. ACTIVITIES', icon: null },
  '/notifications': { title: 'Notificações', subtitle: 'MOD. NOTIFICATIONS', icon: null },
  '/curriculum': { title: 'Plano de Curso', subtitle: 'MOD. CURRICULUM', icon: null },
  '/library': { title: 'Biblioteca & Recursos', subtitle: 'MOD. LIBRARY', icon: null },
  '/knowledge-graph': { title: 'Grafo de Conhecimento', subtitle: 'MOD. BRAINERY', icon: null },
  '/projects': { title: 'Projetos Práticos', subtitle: 'MOD. PROJECTS', icon: null },
  '/spaced-repetition': { title: 'Revisão Espaçada', subtitle: 'MOD. FLASHCARDS', icon: null },
  '/tools-focus': { title: 'Tools & Focus', subtitle: 'MOD. TOOLS', icon: null },
  '/tools-hub': { title: 'Hub de Ferramentas', subtitle: 'MOD. TOOLS', icon: null },
  '/notes': { title: 'Fichamento Digital', subtitle: 'MOD. ZETTELKASTEN', icon: null },
  '/notes/connections': { title: 'Mapa de Conexões', subtitle: 'MOD. ZETTELKASTEN', icon: null },
  '/paradigms': { title: 'Mapa de Paradigmas', subtitle: 'MOD. PARADIGMS', icon: null },
  '/settings': { title: 'Configurações', subtitle: 'MOD. SETTINGS', icon: null },
  '/documents': { title: 'Documentos Mestres', subtitle: 'MOD. DOCS', icon: null },
  '/profile': { title: 'Perfil do Estudante', subtitle: 'MOD. PROFILE', icon: null },
};

interface TopBarProps {
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export function TopBar({ isMobileMenuOpen = false, onMobileMenuToggle }: TopBarProps) {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        const response = await api.get('/notifications/unread-count');
        if (mounted) {
          setUnreadCount(response.data.count);
        }
      } catch {
        // Silently fail
      }
    };

    // Initial fetch
    fetchData();
    // Set up polling interval
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const pageInfo =
    pageTitles[location.pathname] ||
    Object.entries(pageTitles).find(([path]) =>
      path !== '/' && location.pathname.startsWith(`${path}/`)
    )?.[1] || { title: '', subtitle: '', icon: null };

  return (
    <div 
      className="flex h-14 xs:h-16 sm:h-16 lg:h-20 xl:h-24 items-center justify-between border-b border-white/5 bg-[#050506]/98 backdrop-blur-xl sticky top-0 z-30"
      style={{ 
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))'
      }}
    >
      {/* Left: Mobile Menu Button + Page Title */}
      <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 lg:gap-3 flex-1 min-w-0">
        {/* Mobile Menu Button */}
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2.5 rounded-lg hover:bg-white/10 active:bg-white/20 touch-manipulation flex-shrink-0 transition-all active:scale-95"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label={isMobileMenuOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        )}
        {pageInfo.icon && (
          <div className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-white/5 text-[#780606] flex-shrink-0">
            <pageInfo.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <Breadcrumbs />
          {location.pathname === '/' ? (
            <div className="min-w-0">
              <p className="text-[8px] xs:text-[9px] sm:text-[10px] lg:text-[10px] font-mono uppercase tracking-[0.2em] xs:tracking-[0.25em] sm:tracking-[0.3em] lg:tracking-[0.4em] text-muted-foreground/70 truncate mb-0.5">
                {pageInfo.subtitle || 'MOD.'}
              </p>
              <h1 className="text-base xs:text-lg sm:text-xl lg:text-xl font-semibold text-white tracking-wide truncate leading-tight">{pageInfo.title}</h1>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="text-[8px] xs:text-[9px] sm:text-[10px] lg:text-[10px] font-mono uppercase tracking-[0.2em] xs:tracking-[0.25em] sm:tracking-[0.3em] lg:tracking-[0.4em] text-muted-foreground/70 truncate">
                {pageInfo.subtitle || 'MOD.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 lg:gap-6 flex-shrink-0 min-w-0">
        {/* Course Selector - Hidden on very small screens */}
        <div className="hidden sm:block min-w-0 flex-shrink">
          <CourseSelector />
        </div>

        {/* Notifications */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`Notificações${unreadCount > 0 ? `: ${unreadCount} não lidas` : ''}`}
            className="relative group flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 touch-manipulation transition-all active:scale-95"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <Bell className="h-6 w-6 text-muted-foreground group-hover:text-white transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#780606] border-2 border-[#050506] animate-pulse"></span>
              </span>
            )}
          </button>
          <NotificationCenter
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>
      </div>
    </div>
  );
}