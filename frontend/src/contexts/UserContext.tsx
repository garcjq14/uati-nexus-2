import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  portfolio?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  headline?: string;
  onboardingCompleted?: boolean;
  currentMajor?: {
    id: string;
    majorId: string;
    title: string;
  };
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isSetupComplete: () => boolean;
  canAccessApp: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.warn('Failed to fetch user:', error);
      // Set user to null if API call fails (user not authenticated or API unavailable)
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
    
    // Sync onboarding status from localStorage to backend if needed
    const syncOnboardingStatus = async () => {
      const onboardingCompleted = localStorage.getItem('onboardingCompleted');
      if (onboardingCompleted === 'true') {
        try {
          // Check if backend already has it marked
          const prefsResponse = await api.get('/user/preferences').catch(() => null);
          if (prefsResponse?.data?.onboardingCompleted === false) {
            // Backend doesn't have it, sync it
            await api.post('/user/onboarding-complete').catch(() => {
              // Silently fail if user is not authenticated yet
            });
          }
        } catch (error) {
          // Silently fail - user might not be authenticated yet
        }
      }
    };
    
    // Wait a bit for user to be loaded
    setTimeout(syncOnboardingStatus, 1000);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    const userData = response.data.user;
    setUser(userData);
    
    // Sync onboarding status to localStorage
    if (userData.onboardingCompleted !== undefined) {
      if (userData.onboardingCompleted) {
        localStorage.setItem('onboardingCompleted', 'true');
      } else {
        localStorage.removeItem('onboardingCompleted');
      }
    }
    
    // Track login activity for achievements
    try {
      const { trackLogin } = await import('../lib/activityTracker');
      await trackLogin();
    } catch (error) {
      // Silently fail
    }
  };

  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('initialSetupCompleted');
    setUser(null);
  };

  const isSetupComplete = () => {
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    const initialSetupCompleted = localStorage.getItem('initialSetupCompleted');
    return !!(onboardingCompleted && initialSetupCompleted);
  };

  const canAccessApp = () => {
    return !!(user && isSetupComplete());
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      refreshUser,
      isSetupComplete,
      canAccessApp
    }}>
      {children}
    </UserContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    // Return safe defaults instead of throwing error
    // This allows components to work even if provider is not available yet
    return {
      user: null,
      loading: true,
      login: async () => {},
      logout: async () => {},
      refreshUser: async () => {},
      isSetupComplete: () => false,
      canAccessApp: () => false,
    };
  }
  return context;
}

