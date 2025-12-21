import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import Splash from '../../pages/Splash';

interface SetupRequiredRouteProps {
  children: React.ReactNode;
}

export function SetupRequiredRoute({ children }: SetupRequiredRouteProps) {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLoading) {
      // Check if onboarding is completed
      const onboardingCompleted = localStorage.getItem('onboardingCompleted');
      if (!onboardingCompleted) {
        navigate('/onboarding', { replace: true });
        return;
      }

      // Check if initial setup is completed
      const initialSetupCompleted = localStorage.getItem('initialSetupCompleted');
      if (!initialSetupCompleted) {
        navigate('/initial-setup', { replace: true });
        return;
      }

      // If localStorage says setup is complete, allow access even if courseData is still loading
      // This prevents redirect loops after completing setup
      // Only check courseData as a fallback if localStorage is not set
    }
  }, [user, userLoading, navigate]);

  // Show splash while loading user
  if (userLoading) {
    return <Splash />;
  }

  // Check if setup is complete based on localStorage (primary check)
  const onboardingCompleted = localStorage.getItem('onboardingCompleted');
  const initialSetupCompleted = localStorage.getItem('initialSetupCompleted');
  
  if (!onboardingCompleted || !initialSetupCompleted) {
    // Show splash while redirecting instead of null
    return <Splash />;
  }

  // Allow access if localStorage says setup is complete
  // courseData may still be loading, but that's okay - it will load in the background

  return <>{children}</>;
}

