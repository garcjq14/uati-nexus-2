import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showOnce?: boolean;
  storageKey?: string;
}

export function Tooltip({ content, children, position = 'top', showOnce = false, storageKey }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    if (showOnce && storageKey) {
      const seen = localStorage.getItem(`tooltip_${storageKey}`);
      if (seen === 'true') {
        setHasSeen(true);
      }
    }
  }, [showOnce, storageKey]);

  const handleClose = () => {
    setIsVisible(false);
    if (showOnce && storageKey) {
      localStorage.setItem(`tooltip_${storageKey}`, 'true');
      setHasSeen(true);
    }
  };

  if (hasSeen && showOnce) {
    return <>{children}</>;
  }

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              'absolute z-50 w-64 p-3 rounded-lg bg-background border border-white/10 shadow-xl',
              positions[position]
            )}
          >
            <div className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white flex-1">{content}</p>
              {showOnce && (
                <button
                  onClick={handleClose}
                  className="p-0.5 rounded hover:bg-white/5 transition-colors"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
            {/* Arrow */}
            <div
              className={cn(
                'absolute w-2 h-2 bg-background border-white/10 rotate-45',
                position === 'top' && 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-b border-r',
                position === 'bottom' && 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t border-l',
                position === 'left' && 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 border-l border-t',
                position === 'right' && 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 border-r border-b'
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}





