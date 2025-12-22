import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Network,
  Code,
  FileText,
  Wrench,
  User,
  Moon,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Keyboard,
  X
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCourse } from '../../contexts/CourseContext';
import { cn } from '../../lib/utils';

const navigationGroups = [
  {
    title: 'Aprendizado',
    items: [
      { name: 'Nexus Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Plano de Curso', href: '/curriculum', icon: GraduationCap },
      { name: 'Biblioteca & Recursos', href: '/library', icon: BookOpen },
    ],
  },
  {
    title: 'Prática',
    items: [
      { name: 'Projetos Práticos', href: '/projects', icon: Code },
      { name: 'Revisão Espaçada', href: '/spaced-repetition', icon: FileText },
      { name: 'Grafo de Conhecimento', href: '/knowledge-graph', icon: Network },
    ],
  },
  {
    title: 'Ferramentas',
    items: [
      { name: 'Fichamento Digital', href: '/notes', icon: FileText },
      { name: 'Tools & Focus', href: '/tools-focus', icon: Wrench },
      { name: 'Hub de Ferramentas', href: '/tools-hub', icon: Wrench },
    ],
  },
  {
    title: 'Pessoal',
    items: [
      { name: 'Perfil do Estudante', href: '/profile', icon: User },
      { name: 'Conquistas', href: '/achievements', icon: Trophy },
      { name: 'Configurações', href: '/settings', icon: Settings },
      { name: 'Documentos Mestres', href: '/documents', icon: FileText },
    ],
  },
];

const moduleLabels: Record<string, string> = {
  '/': 'MOD. DASHBOARD',
  '/curriculum': 'MOD. CURRICULUM',
  '/library': 'MOD. LIBRARY',
  '/knowledge-graph': 'MOD. BRAINERY',
  '/projects': 'MOD. PROJECTS',
  '/spaced-repetition': 'MOD. FLASHCARDS',
  '/tools-focus': 'MOD. TOOLS',
  '/tools-hub': 'MOD. TOOLS',
  '/notes': 'MOD. ZETTELKASTEN',
  '/profile': 'MOD. PROFILE',
  '/achievements': 'MOD. ACHIEVEMENTS',
  '/settings': 'MOD. SETTINGS',
  '/documents': 'MOD. DOCS',
};

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen: externalIsMobileOpen, onMobileClose }: SidebarProps = {}) {
  const location = useLocation();
  const { user } = useUser();
  const { currentCourse } = useCourse();
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isMobileOpen = externalIsMobileOpen !== undefined ? externalIsMobileOpen : internalMobileOpen;
  const handleMobileToggle = onMobileClose 
    ? () => { if (isMobileOpen) onMobileClose(); else setInternalMobileOpen(true); }
    : () => setInternalMobileOpen(!internalMobileOpen);

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static flex h-screen flex-col bg-[#050506] border-r border-white/5 z-40 transition-all duration-300 ease-out',
          isMobileOpen ? 'translate-x-0 w-[85vw] xs:w-[80vw] sm:w-[75vw] max-w-[280px] shadow-2xl' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'lg:w-0 lg:overflow-hidden lg:border-r-0' : 'lg:w-72'
        )}
        style={{
          height: '-webkit-fill-available',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          maxHeight: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          boxShadow: isMobileOpen ? '4px 0 24px rgba(0, 0, 0, 0.5)' : 'none'
        }}
      >
        {/* Mobile Close Button */}
        {isMobileOpen && (
          <button
            onClick={() => {
              if (onMobileClose) {
                onMobileClose();
              } else {
                setInternalMobileOpen(false);
              }
            }}
            className="lg:hidden absolute top-4 right-4 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 text-white transition-all touch-manipulation"
            aria-label="Fechar menu"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        )}
        {/* Toggle Button - Desktop Only (completely hidden on mobile) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-6 z-50 h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#050506] text-white hover:bg-white/[0.05] hover:border-[#780606]/50 transition-all shadow-lg touch-manipulation pointer-events-auto"
          aria-label={isCollapsed ? 'Mostrar menu' : 'Esconder menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-2.5 xs:gap-3 sm:gap-4 px-3 xs:px-4 sm:px-4 lg:px-8 pt-4 xs:pt-5 sm:pt-6 lg:pt-10 pb-3 xs:pb-4 sm:pb-6 lg:pb-8 transition-opacity duration-300',
          isCollapsed && 'lg:opacity-0 lg:pointer-events-none',
          isMobileOpen && 'pr-12 lg:pr-4' // Add padding for close button on mobile
        )}>
          <div className="flex h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#780606] text-white shadow-[0px_0px_25px_rgba(120,6,6,0.5)] flex-shrink-0">
            <Network className="h-5 w-5 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-lg xs:text-xl sm:text-xl font-serif font-bold tracking-[0.2em] text-white leading-tight truncate">UATI</p>
            <p className="text-[10px] xs:text-[11px] sm:text-xs font-bold text-[#780606] tracking-[0.3em] truncate">NEXUS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn(
          'flex-1 overflow-y-auto px-2 xs:px-3 sm:px-4 py-3 xs:py-4 sm:py-4 transition-opacity duration-300',
          isCollapsed && 'lg:opacity-0 lg:pointer-events-none'
        )}>
          {navigationGroups.map((group) => (
            <div key={group.title} className="mb-4 xs:mb-5 sm:mb-6 last:mb-0">
              <h3 className={cn(
                'px-3 xs:px-4 sm:px-5 mb-2 xs:mb-2.5 sm:mb-3 text-[9px] xs:text-[10px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/60 transition-opacity',
                isCollapsed && 'lg:opacity-0'
              )}>
                {group.title}
              </h3>
              <div className="space-y-1 xs:space-y-1 sm:space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => {
                        if (onMobileClose) {
                          onMobileClose();
                        } else {
                          setInternalMobileOpen(false);
                        }
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 xs:gap-3.5 sm:gap-3 lg:gap-4 px-3 xs:px-3.5 sm:px-3 lg:px-5 py-3 xs:py-3.5 sm:py-3 lg:py-3.5 text-sm xs:text-sm font-medium transition-all duration-200 rounded-lg overflow-hidden touch-manipulation active:scale-[0.98]',
                        isActive
                          ? 'text-white bg-white/5'
                          : 'text-muted-foreground hover:text-white hover:bg-white/[0.03]'
                      )}
                      style={{ minHeight: '48px' }}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#780606] shadow-[0_0_20px_rgba(120,6,6,0.8)] rounded-r-full" />
                      )}
                      <item.icon
                        className={cn(
                          'h-5 w-5 xs:h-5 xs:w-5 sm:h-5 sm:w-5 transition-colors z-10 flex-shrink-0',
                          isActive ? 'text-[#780606]' : 'text-muted-foreground group-hover:text-[#780606]'
                        )}
                      />
                      <div className="flex flex-col z-10 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold tracking-wide truncate">{item.name}</span>
                        </div>
                        <span className="text-[8px] xs:text-[9px] sm:text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/60 group-hover:text-muted-foreground/80 transition-colors truncate">
                          {moduleLabels[item.href] || 'MOD.'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>


        {/* User Profile */}
        {user && (
          <div className={cn(
            'border-t border-white/5 p-3 xs:p-4 sm:p-4 lg:p-6 transition-opacity duration-300',
            isCollapsed && 'lg:opacity-0 lg:pointer-events-none'
          )}>
            <div className="flex items-center gap-3 xs:gap-3.5 sm:gap-3 lg:gap-4 p-2 xs:p-2.5 sm:p-2 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors cursor-pointer group touch-manipulation">
              <div className="relative flex-shrink-0">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=780606&color=fff`}
                  alt={user.name}
                  className="h-11 w-11 xs:h-12 xs:w-12 sm:h-12 sm:w-12 rounded-full border-2 border-white/10 group-hover:border-[#780606]/50 transition-colors object-cover"
                />
                <div className="absolute bottom-0 right-0 h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-3 sm:w-3 rounded-full bg-green-500 border-2 border-[#050506]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm xs:text-sm sm:text-sm font-bold text-white truncate group-hover:text-[#780606] transition-colors">{user.name}</div>
                <div className="text-[10px] xs:text-[10px] sm:text-[10px] text-muted-foreground font-mono tracking-[0.2em] uppercase truncate mt-0.5">
                  {currentCourse?.title?.toUpperCase() || 'SEM CURSO'}
                </div>
              </div>
              <Settings className="h-4 w-4 xs:h-4 xs:w-4 sm:h-4 sm:w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-30 lg:hidden transition-opacity duration-300"
          onClick={() => {
            if (onMobileClose) {
              onMobileClose();
            } else {
              setInternalMobileOpen(false);
            }
          }}
        />
      )}

      {/* Show Button when collapsed - Desktop Only */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 h-16 w-6 items-center justify-center rounded-r-md bg-[#050506] border border-l-0 border-white/10 text-white hover:bg-white/[0.05] hover:border-[#780606]/50 transition-all shadow-lg touch-manipulation"
          aria-label="Mostrar menu"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </>
  );
}