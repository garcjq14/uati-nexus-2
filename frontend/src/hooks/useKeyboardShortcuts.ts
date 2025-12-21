import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;
      
      // Don't trigger shortcuts when user is typing in input fields
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable ||
                          target.closest('input, textarea, [contenteditable="true"]');
      
      // Allow shortcuts with modifiers (Ctrl/Cmd) even in input fields
      const hasModifier = e.ctrlKey || e.metaKey;
      
      // Don't trigger single key shortcuts (like '/', '?', 'G') when typing in input fields
      if (isInputField && !hasModifier) {
        return;
      }
      
      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrlKey ? e.ctrlKey : !e.ctrlKey;
        const metaMatch = s.metaKey ? e.metaKey : !e.metaKey;
        const shiftMatch = s.shiftKey ? e.shiftKey : !e.shiftKey;

        return keyMatch && ctrlMatch && metaMatch && shiftMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function useGlobalShortcuts() {
  const navigate = useNavigate();

  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      action: () => {
        // Will be handled by CommandPalette component
        const event = new CustomEvent('openCommandPalette');
        window.dispatchEvent(event);
      },
      description: 'Abrir busca global',
    },
    {
      key: 'n',
      metaKey: true,
      action: () => navigate('/notes/new'),
      description: 'Nova nota',
    },
    {
      key: '/',
      action: () => {
        const event = new CustomEvent('openCommandPalette');
        window.dispatchEvent(event);
      },
      description: 'Abrir busca',
    },
    // Show shortcuts page
    {
      key: '?',
      action: () => navigate('/shortcuts'),
      description: 'Mostrar atalhos de teclado',
    },
    // Toggle sidebar (Ctrl/Cmd + \)
    {
      key: '\\',
      metaKey: true,
      action: () => {
        const event = new CustomEvent('toggleSidebar');
        window.dispatchEvent(event);
      },
      description: 'Alternar sidebar',
    },
  ]);

  // Handle G + letter navigation
  useEffect(() => {
    let gPressed = false;
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger G navigation when user is typing in input fields
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable ||
                          target.closest('input, textarea, [contenteditable="true"]');
      
      if (isInputField) {
        gPressed = false;
        return;
      }
      
      const key = e.key.toLowerCase();
      
      // Reset if too much time passed
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        gPressed = false;
      }, 1000);

      if (key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        gPressed = true;
        return;
      }

      if (gPressed && !e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (key) {
          case 'd':
            e.preventDefault();
            navigate('/dashboard');
            gPressed = false;
            break;
          case 'c':
            e.preventDefault();
            navigate('/curriculum');
            gPressed = false;
            break;
          case 'p':
            e.preventDefault();
            navigate('/projects');
            gPressed = false;
            break;
          case 'n':
            // Only navigate if not Cmd/Ctrl+N (which is for new note)
            if (!e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              navigate('/notes');
              gPressed = false;
            }
            break;
          case 's':
            e.preventDefault();
            navigate('/statistics');
            gPressed = false;
            break;
          case 'f':
            e.preventDefault();
            navigate('/tools-focus');
            gPressed = false;
            break;
          case 'm':
            e.preventDefault();
            navigate('/documents');
            gPressed = false;
            break;
          case 'h':
            e.preventDefault();
            navigate('/shortcuts');
            gPressed = false;
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeout) clearTimeout(timeout);
    };
  }, [navigate]);
}
