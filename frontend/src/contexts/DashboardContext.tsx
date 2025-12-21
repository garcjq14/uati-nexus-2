import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../lib/api';

interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface DashboardLayout {
  widgets: WidgetLayout[];
}

interface DashboardContextType {
  layout: DashboardLayout;
  updateLayout: (layout: DashboardLayout) => void;
  isLoading: boolean;
}

const defaultLayout: DashboardLayout = {
  widgets: [
    { id: 'progress', x: 0, y: 0, w: 4, h: 2 },
    { id: 'flashcards', x: 4, y: 0, w: 4, h: 2 },
    { id: 'active-project', x: 0, y: 2, w: 4, h: 3 },
    { id: 'modules', x: 4, y: 2, w: 4, h: 3 },
  ],
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<DashboardLayout>(defaultLayout);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLayout();
  }, []);

  const loadLayout = async () => {
    try {
      // Try to load from localStorage first (fallback)
      const savedLayout = localStorage.getItem('dashboardLayout');
      if (savedLayout) {
        setLayout(JSON.parse(savedLayout));
        setIsLoading(false);
        return;
      }

      const response = await api.get('/user/dashboard-layout');
      if (response.data && response.data.layout) {
        setLayout(response.data.layout);
        localStorage.setItem('dashboardLayout', JSON.stringify(response.data.layout));
      }
    } catch (error) {
      // Use default layout if not found
      console.log('Using default dashboard layout');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLayout = async (newLayout: DashboardLayout) => {
    setLayout(newLayout);
    // Save to localStorage as backup
    localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
    try {
      await api.put('/user/dashboard-layout', { layout: newLayout });
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
    }
  };

  return (
    <DashboardContext.Provider value={{ layout, updateLayout, isLoading }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}
