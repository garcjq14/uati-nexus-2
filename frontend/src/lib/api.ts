import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Debug: Log da URL da API (apenas em desenvolvimento ou se não estiver configurada)
if (!import.meta.env.VITE_API_URL || import.meta.env.DEV) {
  console.log('🔧 API URL configurada:', API_URL);
  console.log('🔧 VITE_API_URL da env:', import.meta.env.VITE_API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (no response means network issue)
    if (!error.response) {
      const isNetworkError = 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
        error.message?.includes('Failed to fetch');
      
      if (isNetworkError) {
        const errorMessage = API_URL.includes('localhost') 
          ? `Não foi possível conectar ao servidor em ${API_URL}. Verifique se o backend está rodando.`
          : `Não foi possível conectar ao servidor em ${API_URL}. Verifique se a variável VITE_API_URL está configurada corretamente no Vercel.`;
        const networkError = new Error(errorMessage);
        networkError.name = 'NetworkError';
        console.error('❌ Erro de conexão:', {
          url: API_URL,
          error: error.message,
          code: error.code,
        });
        return Promise.reject(networkError);
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Handle 404 when user not found (token might be invalid)
    if (error.response?.status === 404) {
      const errorMessage = error.response?.data?.error?.toLowerCase() || '';
      if (errorMessage.includes('user not found')) {
        localStorage.removeItem('token');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle 400 when user ID is invalid (foreign key constraint)
    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.error?.toLowerCase() || '';
      if (errorMessage.includes('invalid user') || errorMessage.includes('user id')) {
        localStorage.removeItem('token');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
