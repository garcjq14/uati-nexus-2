import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FileText, BookOpen, Code, Target } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QuickActionMenu } from './QuickActionMenu';
import { cn } from '../../lib/utils';

export function QuickActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Keyboard shortcut: Ctrl/Cmd + K to open quick actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Context-aware actions based on current page
  const getContextActions = () => {
    const path = location.pathname;

    if (path.startsWith('/notes')) {
      return [
        { icon: FileText, label: 'Nova Nota', action: () => navigate('/notes/new') },
        { icon: BookOpen, label: 'Criar Flashcard', action: () => navigate('/spaced-repetition?action=create') },
      ];
    }

    if (path.startsWith('/library')) {
      return [
        { icon: BookOpen, label: 'Adicionar Recurso', action: () => {
          // Trigger add resource modal - would need to be passed as prop or use context
          const event = new CustomEvent('openAddResource');
          window.dispatchEvent(event);
        }},
        { icon: FileText, label: 'Nova Nota', action: () => navigate('/notes/new') },
      ];
    }

    if (path.startsWith('/projects')) {
      return [
        { icon: Code, label: 'Novo Projeto', action: () => {
          const event = new CustomEvent('openCreateProject');
          window.dispatchEvent(event);
        }},
        { icon: Target, label: 'Nova Tarefa', action: () => {
          const event = new CustomEvent('openAddTask');
          window.dispatchEvent(event);
        }},
      ];
    }

    // Default actions
    return [
      { icon: FileText, label: 'Nova Nota', action: () => navigate('/notes/new') },
      { icon: BookOpen, label: 'Adicionar Recurso', action: () => navigate('/library') },
      { icon: Code, label: 'Novo Projeto', action: () => navigate('/projects') },
      { icon: Target, label: 'Criar Flashcard', action: () => navigate('/spaced-repetition?action=create') },
    ];
  };

  return (
    <>
      <motion.div
        className="fixed z-40"
        initial={false}
        animate={{ scale: isOpen ? 0.9 : 1 }}
        style={{ 
          transform: 'translateZ(0)',
          bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 1rem))',
          right: 'max(1rem, calc(env(safe-area-inset-right) + 1rem))'
        }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-20 right-0 mb-4"
            >
              <QuickActionMenu
                actions={getContextActions()}
                onClose={() => setIsOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_0_30px_rgba(120,6,6,0.5)]',
            'hover:bg-primary/90 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
            'group relative touch-manipulation'
          )}
          style={{ minWidth: '56px', minHeight: '56px' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          aria-label={isOpen ? 'Fechar menu de ações rápidas' : 'Abrir menu de ações rápidas'}
          title="Ações Rápidas (Ctrl+K)"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
          {/* Keyboard shortcut hint */}
          {!isOpen && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Ctrl+K
            </span>
          )}
        </motion.button>
      </motion.div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default QuickActionButton;
