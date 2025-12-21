import api from './api';

// Track page visits
export async function trackPageVisit(pageName: string) {
  try {
    await api.post('/activities', {
      type: 'page_visit',
      title: `Visitou ${pageName}`,
      description: pageName,
    });
  } catch (error) {
    // Silently fail - activity tracking shouldn't break the app
    console.warn('Failed to track page visit:', error);
  }
}

// Track login
export async function trackLogin() {
  try {
    await api.post('/activities', {
      type: 'first_login',
      title: 'Primeiro Login',
      description: 'Usuário fez login',
    });
  } catch (error) {
    console.warn('Failed to track login:', error);
  }
}

// Track dashboard visit
export async function trackDashboardVisit() {
  try {
    await api.post('/activities', {
      type: 'dashboard_visit',
      title: 'Visitou Dashboard',
      description: 'Dashboard',
    });
  } catch (error) {
    console.warn('Failed to track dashboard visit:', error);
  }
}

// Track activity completion
export async function trackActivityCompleted(activityType: string, title: string) {
  try {
    await api.post('/activities', {
      type: 'activity_completed',
      title: `Completou: ${title}`,
      description: activityType,
    });
  } catch (error) {
    console.warn('Failed to track activity completion:', error);
  }
}



