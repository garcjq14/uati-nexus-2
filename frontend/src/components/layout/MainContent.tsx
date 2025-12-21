import type { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <div 
      className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#050506]/40 to-[#020203]" 
      style={{ 
        scrollBehavior: 'smooth', 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        minHeight: 0
      }}
    >
      <div 
        className="mx-auto flex max-w-7xl flex-col gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 py-2 xs:py-3 sm:py-4 md:py-6 lg:py-10" 
        style={{ 
          contentVisibility: 'auto',
          paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
          minHeight: 'min-content'
        }}
      >
        {children}
      </div>
    </div>
  );
}
